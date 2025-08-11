# 🤖 AeonAnalytic - Gemini Chatbot Kurulum Kılavuzu

## 📋 Ön Gereksinimler

- Node.js 18+ 
- PostgreSQL
- Docker & Docker Compose
- Google AI Studio hesabı

## 🚀 Kurulum Adımları

### 1. Gemini API Key Alma

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API key'inizi güvenli bir yere kaydedin

### 2. Environment Konfigürasyonu

#### Backend (.env dosyası)
```bash
# backend/.env dosyasını oluşturun
cp backend/env.example backend/.env
```

`.env` dosyasını düzenleyin:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aeon_analytics
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Gemini API Configuration
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Backend URL (for internal API calls)
BACKEND_URL=http://localhost:3001
```

#### Frontend (.env.local dosyası)
```bash
# dashboard/.env.local dosyasını oluşturun
```

`.env.local` dosyasını düzenleyin:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 3. Paket Kurulumu

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd dashboard
npm install
```

### 4. Database Kurulumu

```bash
# PostgreSQL container'ını başlatın
docker-compose up -d postgres

# Database'i oluşturun
docker exec -it aeonanalytics-postgres-1 psql -U postgres -c "CREATE DATABASE aeon_analytics;"

# Tabloları oluşturun
docker exec -i aeonanalytics-postgres-1 psql -U postgres -d aeon_analytics < backend/sql/create_tables.sql
```

### 5. Uygulamayı Başlatma

#### Development Modunda
```bash
# Backend'i başlatın
cd backend
npm run dev

# Yeni terminal'de frontend'i başlatın
cd dashboard
npm run dev
```

#### Docker ile
```bash
# Tüm servisleri başlatın
docker-compose up -d
```

### 6. Test Etme

1. Frontend'e gidin: http://localhost:3000
2. Login olun
3. Herhangi bir oyun dashboard'ına gidin
4. Sağ alt köşedeki chat butonuna tıklayın
5. "Bu oyunun genel performansını göster" gibi bir soru sorun

## 🔧 Sorun Giderme

### Gemini API Hatası
- API key'in doğru olduğundan emin olun
- API key'in aktif olduğunu kontrol edin
- Quota limitlerini kontrol edin

### Database Bağlantı Hatası
- PostgreSQL container'ının çalıştığından emin olun
- Database credentials'larını kontrol edin
- Port çakışması olup olmadığını kontrol edin

### Frontend-Backend Bağlantı Hatası
- Backend'in çalıştığından emin olun
- CORS ayarlarını kontrol edin
- Environment variable'ları kontrol edin

## 📊 Özellikler

### Desteklenen Sorgular
- "Bu oyunun genel performansını göster"
- "Son 30 günün metriklerini getir"
- "Kullanıcı retention analizi yap"
- "Gelir trendini incele"
- "ARPU ve ARPPU değerlerini göster"
- "En aktif kullanıcıları listele"
- "Crash rate analizi yap"

### Chatbot Özellikleri
- Context-aware yanıtlar
- Function calling ile API entegrasyonu
- Real-time typing indicator
- Suggestion buttons
- Chat history
- Error handling
- Responsive design

## 🔒 Güvenlik

- API key'ler backend'de saklanır
- Frontend'e hiçbir hassas bilgi gönderilmez
- Tüm API çağrıları backend üzerinden proxy edilir
- Session-based chat history
- Input validation ve sanitization

## 📈 Performans

- Lazy loading chat component
- Debounced input handling
- Optimized API calls
- Cached responses
- Minimal re-renders

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
GEMINI_API_KEY=your_production_api_key
DB_HOST=your_production_db_host
DB_PASSWORD=your_production_db_password
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring
- Chat API response times
- Gemini API usage
- Error rates
- User engagement metrics 