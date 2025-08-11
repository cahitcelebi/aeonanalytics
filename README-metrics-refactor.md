# Aeon Analytics: Gerçek Zamanlı Metrik Refaktörü ve Yol Haritası

## 1. Mevcut Tablo ve Veri Yapısı Analizi

### a) Session Tablosu
- sessionId, playerId, gameId, startTime, endTime, durationSeconds, gameVersion
- Kullanım: DAU, WAU, MAU, Session Analysis, Avg. Session Duration, Retention, New User Analysis

### b) Event Tablosu
- eventName, eventType, playerId, gameId, timestamp, parameters
- Kullanım: Event Analysis, Funnel, Custom Event, Monetization (purchase event), User Activity

### c) Analytics Tablosu
- (Artık kullanılmayacak, sadece referans)

### d) Performance Metrics Tablosu
- avgFps, avgLoadTime, crashCount, deviceModel, osVersion, gameId, date
- Kullanım: Performance başlığı altındaki metrikler

### e) Player Segments Tablosu
- segmentName, segmentCriteria, playerCount, gameId
- Kullanım: User Analysis, segment bazlı breakdown

### f) Game Tablosu
- name, platform, id
- Kullanım: Oyun ve platform filtreleri

---

## 2. Retention Hesaplama İçin Yapı
- Session tablosunda playerId, gameId, startTime alanları retention cohort hesaplaması için yeterli.
- Her gün için yeni kullanıcı cohort'u oluşturulacak.
- Sonraki günlerde aynı kullanıcı tekrar giriş yaparsa, ilgili günün retention'ı hesaplanacak.
- SQL veya ORM ile cohort bazlı sorgular yazılabilir.

---

## 3. Eksik veya İyileştirilebilecek Noktalar
- Monetizasyon: Event tablosunda "purchase" event'inin parameters alanında tutar (amount) ve para birimi (currency) gibi bilgiler olmalı.
- User Segmentation: Segment kriterleri JSONB olarak var, ancak segment bazlı breakdown için event/session sorgularında segmentId ile ilişki gerekebilir.
- Event Parametreleri: Event parametreleri JSONB, custom event analizleri için parametreye göre sorgu desteği eklenmeli.
- Bounce Rate, Conversion Rate: Session ve Event tablosundan hesaplanabilir, ancak eventName'lerin standart olması gerekir.
- Funnel/Progression: Event tablosunda eventName ve timestamp ile adım adım funnel analizi yapılabilir.

---

## 4. Model ve Tablo Uyum Kontrolü
- Tüm ana metrikler için gerekli modeller (Session, Event, Game, PlayerSegment, PerformanceMetric, Developer) mevcut.
- Model property'leri camelCase, tablo ve alan isimleri snake_case olarak field ile eşleştirilmiş.
- `underscored: false` ve field eşleştirmeleri sayesinde camelCase/snake_case uyumsuzluğu yoktur.
- Ekstra ihtiyaçlar için (daha detaylı ödeme, kullanıcı profili, funnel tanımı) ileride yeni tablo/model eklenebilir.

---

## 5. İşlem Adımları (Yol Haritası)

### 1. Backend Refaktörü
- [ ] Overview endpoint'ini gerçek tablolardan aggregate ile yaz (DAU, WAU, MAU, Avg. Session Duration, User Activity, Event Analysis, Session Analysis, New User Analysis, Retention).
- [ ] Engagement/Retention için cohort bazlı hesaplama fonksiyonu yaz.
- [ ] Monetizasyon için "purchase" event'inden revenue, ARPU, ARPPU, LTV hesaplamalarını ekle.
- [ ] User Analysis için segment bazlı breakdown endpoint'i ekle.
- [ ] Performance için performance_metrics tablosundan metrikleri çek.
- [ ] Event Analysis için eventName ve eventType bazlı breakdown endpoint'i ekle.

### 2. Frontend Geliştirmeleri
- [ ] Her başlık için uygun filtreleri (tarih, platform, segment, event tipi, ürün tipi vs.) ekle.
- [ ] Filtreler değiştikçe ilgili endpoint'e parametre göndererek metrikleri güncelle.
- [ ] Overview'da özet 9 metrik ve trend gösterimi.
- [ ] Diğer başlıklarda detaylı grafikler ve breakdown'lar.

### 3. Eksik Veri ve Yapıların Tamamlanması
- [ ] Event tablosunda "purchase" event'inin parameters alanında amount ve currency olduğundan emin ol.
- [ ] Segment bazlı breakdown için session/event ile segment ilişkilendirmesi kontrol et.
- [ ] Event parametrelerine göre dinamik sorgu desteği ekle (ör: parametreye göre filtreleme).
- [ ] Gerekirse migration ile eksik alanları ekle.

### 4. Test ve Validasyon
- [ ] Her metrik için örnek veri ile test endpoint'leri oluştur.
- [ ] Filtre kombinasyonları ile metriklerin doğruluğunu kontrol et.
- [ ] Retention ve funnel hesaplamalarını gerçek kullanıcı davranışı ile doğrula.
- [ ] Performans ve ölçeklenebilirlik testleri yap.

---

## 6. Retention Hesaplama Önerisi
- Her gün için cohort'u bul, sonraki günlerde geri dönen kullanıcıları say, yüzdesini hesapla.
- SQL örneği:
  ```sql
  -- Day 0 cohort
  SELECT playerId, MIN(DATE(startTime)) as cohortDate
  FROM sessions
  WHERE gameId = :gameId
  GROUP BY playerId

  -- Day N retention
  SELECT COUNT(DISTINCT s.playerId)
  FROM sessions s
  JOIN (
    SELECT playerId, MIN(DATE(startTime)) as cohortDate
    FROM sessions
    WHERE gameId = :gameId
    GROUP BY playerId
  ) c ON s.playerId = c.playerId
  WHERE DATE(s.startTime) = c.cohortDate + INTERVAL 'N days'
  ```

---

## 7. Sonraki Adımlar
1. Backend'de Overview endpoint'ini gerçek tablolardan aggregate ile yaz.
2. Her başlık için backend ve frontend'de filtre ve metrikleri yukarıdaki plana göre uygula.
3. Eksik veri ve alanlar için migration ve veri iyileştirmesi yap.
4. Test ve validasyon adımlarını uygula. 