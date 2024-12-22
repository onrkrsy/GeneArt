# Gene Art Visualizer

Bu proje, genetik verileri sanatsal görselleştirmelere dönüştüren interaktif bir web uygulamasıdır. Refik Anadol'un veri sanatı eserlerinden ilham alınarak geliştirilmiştir.
![image](https://github.com/user-attachments/assets/6e0d0bee-d801-4cd8-b48a-d97e860d342f)

## Teknik Özellikler
### Kullanılan Teknolojiler
 HTML5 Canvas
 JavaScript (ES6+)
 Ensembl REST API
 SimplexNoise Kütüphanesi
### Temel Bileşenler
1. **Veri Kaynağı**
  - Ensembl REST API kullanılarak gerçek gen dizilimleri (BRCA1, BRCA2 vb.) alınır
  - Her nükleotid (A, T, G, C) farklı renk ve davranışlarla temsil edilir
2. **Parçacık Sistemi**
  - Her nükleotid bir parçacık olarak temsil edilir
  - Parçacıklar akışkan bir hareket sergiler
  - Maksimum 300 parçacık kullanılarak performans optimizasyonu sağlanır
3. **Akış Alanı (Flow Field)**
  - SimplexNoise ile organik hareket patterns oluşturulur
  - Çoklu oktav noise kullanılarak karmaşık akış desenleri elde edilir
  - Parçacıkların hareketi bu akış alanına göre belirlenir
4. **Renk Sistemi**
  - Her nükleotid tipi için temel renkler:
    * A: Koyu mavi (30, 77, 140)
    * T: Altın sarısı (219, 166, 50)
    * G: Koyu yeşil (46, 93, 59)
    * C: Kahverengi (139, 69, 19)
  - Zaman bazlı renk geçişleri
  - Gradient ve glow efektleri
5. **Görsel Efektler**
  - Parçacık izleri
  - Işıma (glow) efektleri
  - Radyal gradientler
  - Yarı saydam katmanlar
### Görselleştirme Özellikleri
1. **Hareket Dinamikleri**
  - Akışkan ve organik hareket
  - Parçacıklar arası etkileşim
  - Sınır kontrolü ve yumuşak geçişler
2. **Şekil Kontrolü**
  - DNA sarmalı
  - Dairesel düzen
  - Dalga formu
3. **Performans Optimizasyonları**
  - Sınırlı parçacık sayısı
  - Renk önbelleği
  - Frame rate kontrolü
## Kullanım
1. Gen seçimi yapılır (BRCA1, BRCA2)
. Seçilen genin dizilimi API'den alınır
. Her nükleotid için parçacıklar oluşturulur
. Parçacıklar akış alanında hareket eder
. Renk ve şekil geçişleri sürekli güncellenir
## Görsel Sonuç
Oluşan görsel:
 Sürekli hareket eden, akışkan bir yapı
 Genetik veriye dayalı renk dağılımı
 Organik ve doğal görünen geçişler
 Işıklı ve parlak efektler
 DNA'nın sanatsal bir yorumu
## Geliştirme Amacı
Bu proje:
. Bilimsel verileri sanatsal bir şekilde görselleştirmeyi
. Genetik verileri anlaşılır ve estetik bir forma dönüştürmeyi
. Veri sanatı ve biyoloji arasında bir köprü kurmayı
. İnteraktif ve dinamik bir deneyim sunmayı
amaçlamaktadır.

