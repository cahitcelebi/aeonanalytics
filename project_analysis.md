# Aeon Analytics Proje Analizi ve Yol Haritası

## 1. Genel Yapı ve İlişkiler

### Developer (Geliştirici) Tarafı
- **developers**: Oyun geliştiricileri/şirketler
- **games**: Developer'ların yüklediği oyunlar
  - İlişki: Bir developer'ın birden çok oyunu olabilir (one-to-many)

### Player (Oyuncu) Tarafı
- **players**: Oyunu oynayan kullanıcılar
- **devices**: Oyuncuların cihaz bilgileri
- **sessions**: Oyuncuların oyun oturumları
- **events**: Oyuncuların oyun içi olayları
- **progression**: Oyuncuların ilerleme bilgileri
- **monetization**: Oyuncuların satın alma işlemleri
- **daily_metrics**: Günlük oyuncu metrikleri
- **player_segments**: Oyuncu segmentasyonu
- **performance_metrics**: Oyun performans metrikleri

## 2. Mevcut Model Dosyaları ve Durumları
- **User.js** (developers tablosu için, eksik: Game ilişkisi)
- **Event.js** (events tablosu için, hatalı alan isimleri var)
- **Metric.js** (daily_metrics ve performance_metrics için, ayrılması gerekiyor)
- **Monetization.js** (monetization tablosu için, hatalı alan isimleri var)
- **Progression.js** (progression tablosu için, hatalı alan isimleri var)

## 3. Eksik Model Dosyaları
- Game.js
- Player.js
- Device.js
- Session.js
- PlayerSegment.js

## 4. Yapılması Gerekenler (Öncelik Sırasına Göre)

### 1. Model Düzeltmeleri
- User.js'e Game ilişkisi eklenecek
- Event.js'deki hatalı alan isimleri düzeltilecek
- Monetization.js'deki hatalı alan isimleri düzeltilecek
- Progression.js'deki hatalı alan isimleri düzeltilecek

### 2. Yeni Model Oluşturma
- Game.js
- Player.js
- Device.js
- Session.js
- PlayerSegment.js

### 3. Model Ayrıştırma
- Metric.js'den DailyMetric.js ve PerformanceMetric.js ayrılacak

### 4. İlişki Tanımlamaları
- Tüm modellerde associate metodları eklenecek
- Foreign key ve referanslar düzenlenecek
- Cascade delete kuralları kontrol edilecek

### 5. Validasyonlar
- Tüm modellerde gerekli validasyonlar eklenecek
- Unique constraint'ler kontrol edilecek
- Default değerler düzenlenecek

## 5. Önerilen Sonraki Adımlar
1. Önce User.js modelini düzeltip Game ilişkisini ekleyelim
2. Sonra Game.js modelini oluşturalım
3. Player.js modelini oluşturup diğer oyuncu metrikleriyle ilişkilendirelim
4. Sırasıyla diğer modelleri oluşturalım
5. En son Metric.js'i ayrıştıralım

