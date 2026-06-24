// Kötü Fikirler Borsası - Hızlı Mod Görsel ve Komik Kelime Havuzu
// 100 Sıfat + 100 İsim = 200 Kelime

const adjectives = [
  // Mevcutlardan seçilen en iyi ve çizilebilir olanlar
  "Bantlanmış", "Küflü", "Alev Alev Yanan", "Tekerlekli", "Kanatlı", 
  "Kaslı", "Ağlayan", "Dişsiz", "Gözlüklü", "Tüylü", 
  "Yağlı", "Çamurlu", "Paslı", "Kırık", "Erimekte Olan", 
  "Göbekli", "Sivilceli", "Zombi", "Boynuzlu", "Çatlak", 
  "Delik", "Titreyen", "Kısa Devre Yapan", "Salyalı", "Uyuyan", 
  "Üşüyen", "Terleyen", "Somurtkan", "Korsan", "Zırhlı", 
  "Kamuflajlı", "Dikenli", "Yapışkan", "Uçan", "Yaylı", 
  "Çizgili", "Benekli", "Işıklı", "Ekranı Kırık", "Sırılsıklam", 
  "Yanık", "Dumanı Tüten", "Çöpten Bulunmuş", "Modifiyeli", "Büyülü", 
  "Altın Kaplama", "Üzerine Basılmış", "Dişlenmiş", "Küçücük", "Devasa", 
  "Şişme", "Katlanabilir", "Uzaktan Kumandalı", "Kel", "Kuyruklu", 
  "Zehirli", "Radyoaktif", "Çivili", "İçi Boş", "Tonlarca Ağırlıkta", 
  "Şeffaf", "Yamuk", "Asabi", "Kıllı",
  
  // Yeni eklenen, görsel potansiyeli yüksek ve komik sıfatlar
  "Dantelli", "Bıyıklı", "Dövmeli", "Şaşı", "Pelerinli", 
  "Pelüş", "Leopar Desenli", "Neon", "Tuğladan", "Buzdan", 
  "Karton", "Simli", "Üç Gözlü", "Ahtapot Kollu", "Korseli", 
  "Yara Bantlı", "Tüküren", "Balçık Kaplı", "Şalvarlı", "Takma Dişli", 
  "Kulaklıklı", "Papyonlu", "Dalgıç Kıyafetli", "Uzaylı", "Fosforlu", 
  "Zincirli", "Örümcek Ağlı", "Hıçkıran", "Yırtık", "Şaşkın", 
  "Gelinlikli", "Sünnetlik", "Örgü", "Kıvırcık", "Ameliyatlı", "Hamile"
];

const nouns = [
  // Mevcutlardan seçilen en iyiler (Otobüs Kartı gibi çizimi zor/detaysızlar silindi)
  "Tost Makinesi", "Çöp Kutusu", "Damacana", "Modem", "Bulaşık Süngeri", 
  "Tuvalet Fırçası", "Ranza", "Çamaşır İpi", "Kettle", "Stetoskop", 
  "Şırınga", "Sedye", "Lahmacun Küreği", "Zurna Dürüm", "Çay Bardağı", 
  "Çekyat", "Elektrikli Süpürge", "Banyo Terliği", "Vantilatör", "Soba", 
  "Televizyon Kumandası", "Şarj Kablosu", "Priz", "Ampul", "Halı", 
  "Tırnak Makası", "Kulak Çöpü", "Diş Fırçası", "Biberon", "Emzik", 
  "Baston", "Tekerlekli Sandalye", "Sifon", "Rögar Kapağı", "Trafik Hunisi", 
  "Parke Taşı", "Bank", "Döner Bıçağı", "Pisuvar", "Tabure", 
  "Klavye", "Kulaklık", "Oyuncu Koltuğu", "Mangal", "Bisiklet", 
  "Direksiyon", "Kask", "Klozet", "Dürbün", "Şemsiye", 
  "Saç Kurutma Makinesi", "Düdüklü Tencere", "Paten", "Drone", "Oyun Konsolu", 
  "Projeksiyon", "Tıraş Makinesi", "Matara", "Bebek Arabası", "Mikrofon", 
  "Kamp Çadırı", "Tekerlek", "Kumbara", "Yangın Tüpü", "El Feneri", 
  "Kombi", "Asansör", "Bulaşık Makinesi", "Traktör", "Bavul", 
  "Cüzdan", "Kirli Sepeti", "Paspas", "Ütü Masası",
  
  // Yeni eklenen, çizmesi zevkli ve yerel/absürt ürünler
  "Piknik Tüpü", "Semaver", "Alaturka Tuvalet", "Oklava", "Protez Bacak", 
  "Çaydanlık", "Su Tabancası", "Hamam Tası", "Nargile", "Satır", 
  "Buzdolabı", "Dikiş Makinesi", "Testere", "Daktilo", "Akvaryum", 
  "Şişme Havuz", "Tabut", "Mancınık", "Boks Eldiveni", "Dalgıç Tüpü", 
  "Matkap", "Kaykay", "Elektro Gitar", "Huni", "Merdane", "El Arabası"
];

module.exports = { adjectives, nouns };