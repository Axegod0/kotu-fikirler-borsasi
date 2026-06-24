import { useEffect, useRef, useCallback, useState } from 'react';
import socket from '../socket';

/**
 * useWebRTC — Mesh P2P ses yönetimi
 *
 * Kullanım:
 *   const { isMuted, toggleMute, peerStates, isVoiceActive, joinVoice, leaveVoice } = useWebRTC(enabled);
 *
 * enabled: boolean — voiceOption === 'ingame' ise true geçilir
 */

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function useWebRTC(enabled) {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // peerStates: { [peerId]: 'connecting' | 'connected' | 'failed' }
  const [peerStates, setPeerStates] = useState({});

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { [peerId]: RTCPeerConnection }
  const pendingCandidatesRef = useRef({}); // { [peerId]: RTCIceCandidateInit[] }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function updatePeerState(peerId, state) {
    setPeerStates((prev) => ({ ...prev, [peerId]: state }));
  }

  function removePeerState(peerId) {
    setPeerStates((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }

  // ─── RTCPeerConnection Factory ────────────────────────────────────────────
  const createPeerConnection = useCallback((peerId) => {
    if (peerConnectionsRef.current[peerId]) return peerConnectionsRef.current[peerId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerId] = pc;

    updatePeerState(peerId, 'connecting');

    // Yerel ses track'lerini ekle
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Karşı tarafın ses stream'ini al
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      // Sesli oynat — her peer için bir <audio> elementi oluştur
      let audio = document.getElementById(`audio-${peerId}`);
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = `audio-${peerId}`;
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
      }
      audio.srcObject = remoteStream;
    };

    // ICE candidate'ları relay et
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', { to: peerId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[WebRTC] ${peerId} connection state: ${state}`);
      if (state === 'connected') updatePeerState(peerId, 'connected');
      if (state === 'failed' || state === 'closed') {
        updatePeerState(peerId, 'failed');
      }
    };

    // Bekleyen ICE candidate varsa uygula
    if (pendingCandidatesRef.current[peerId]) {
      pendingCandidatesRef.current[peerId].forEach((c) => {
        pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      });
      delete pendingCandidatesRef.current[peerId];
    }

    return pc;
  }, []);

  // ─── Cleanup a single peer ────────────────────────────────────────────────
  const closePeer = useCallback((peerId) => {
    const pc = peerConnectionsRef.current[peerId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[peerId];
    }
    removePeerState(peerId);

    // Ses elementini kaldır
    const audio = document.getElementById(`audio-${peerId}`);
    if (audio) audio.remove();
  }, []);

  // ─── Join Voice Channel ───────────────────────────────────────────────────
  const joinVoice = useCallback(async () => {
    if (!enabled || isVoiceActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setIsVoiceActive(true);
      socket.emit('webrtc_join_voice');
      console.log('[WebRTC] Joined voice channel');
    } catch (err) {
      console.error('[WebRTC] Mikrofon erişimi reddedildi:', err);
    }
  }, [enabled, isVoiceActive]);

  // ─── Leave Voice Channel ──────────────────────────────────────────────────
  const leaveVoice = useCallback(() => {
    socket.emit('webrtc_leave_voice');

    // Tüm peer bağlantılarını kapat
    Object.keys(peerConnectionsRef.current).forEach(closePeer);
    peerConnectionsRef.current = {};
    pendingCandidatesRef.current = {};

    // Yerel stream'i durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    setIsVoiceActive(false);
    setPeerStates({});
    console.log('[WebRTC] Left voice channel');
  }, [closePeer]);

  // ─── Mute / Unmute ────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  }, []);

  // ─── Socket Event Listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    // Sunucu mevcut peer listesini gönderdi → her birine offer yolla
    const onPeers = async ({ peers }) => {
      for (const peerId of peers) {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', { to: peerId, offer });
      }
    };

    // Yeni bir peer katıldı → offer bekle (onlar bize offer gönderecek)
    const onNewPeer = ({ peerId }) => {
      console.log('[WebRTC] New peer arrived:', peerId);
      // Bağlantıyı oluştur ama offer bekliyoruz
      createPeerConnection(peerId);
    };

    // Offer geldi → answer yolla
    const onOffer = async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { to: from, answer });
    };

    // Answer geldi
    const onAnswer = async ({ from, answer }) => {
      const pc = peerConnectionsRef.current[from];
      if (!pc) return;
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    // ICE candidate geldi
    const onIceCandidate = async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current[from];
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      } else {
        // remoteDescription henüz set edilmemişse beklet
        if (!pendingCandidatesRef.current[from]) pendingCandidatesRef.current[from] = [];
        pendingCandidatesRef.current[from].push(candidate);
      }
    };

    // Bir peer ayrıldı
    const onPeerLeft = ({ peerId }) => {
      closePeer(peerId);
    };

    socket.on('webrtc_peers', onPeers);
    socket.on('webrtc_new_peer', onNewPeer);
    socket.on('webrtc_offer_for_you', onOffer);
    socket.on('webrtc_answer_for_you', onAnswer);
    socket.on('webrtc_ice_for_you', onIceCandidate);
    socket.on('webrtc_peer_left', onPeerLeft);

    return () => {
      socket.off('webrtc_peers', onPeers);
      socket.off('webrtc_new_peer', onNewPeer);
      socket.off('webrtc_offer_for_you', onOffer);
      socket.off('webrtc_answer_for_you', onAnswer);
      socket.off('webrtc_ice_for_you', onIceCandidate);
      socket.off('webrtc_peer_left', onPeerLeft);
    };
  }, [enabled, createPeerConnection, closePeer]);

  // Bileşen unmount olursa ses kanalını kapat
  useEffect(() => {
    return () => {
      if (isVoiceActive) leaveVoice();
    };
  }, []);

  return {
    isVoiceActive,
    isMuted,
    peerStates,
    joinVoice,
    leaveVoice,
    toggleMute,
    connectedPeerCount: Object.values(peerStates).filter((s) => s === 'connected').length,
  };
}
