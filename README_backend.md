## Cultivation Backend — Hafta 2 Altyapı Özeti

Bu doküman, MSSQL veritabanı ve FastAPI backend iskeletinin nasıl kurulduğunu özetler.

### 1. Veritabanı (MSSQL)

- Veritabanı adı: **CultivationDB**
- Şema scripti: `schema.sql`
- Tablolar:
  - `users` — temel kullanıcı bilgileri
  - `daily_logs` — günlük kayıtlar
  - `habits` ve `habit_logs` — alışkanlık ve günlük logları
  - `mood_records` — ruh hali kayıtları
  - `health_records` — sağlıkla ilgili kayıtlar
  - `user_stats` — kullanıcıya ait istatistikler

Kurulum:

1. MSSQL sunucunuzda `schema.sql` dosyasını çalıştırın (SSMS veya Azure Data Studio ile).
2. Script, `CultivationDB` veritabanını yoksa oluşturur ve tüm tabloları tanımlar.

### 2. Uygulama Yapısı (FastAPI)

- Giriş noktası: `app/main.py`
  - `create_app()` içinde:
    - `/health` endpoint’i ile basit sağlık kontrolü.
    - Uygulama açılışında `Base.metadata.create_all(bind=engine)` ile tabloların oluşturulması.
    - `app.api.api_router` üzerinden `/api/v1/...` endpoint’lerinin bağlanması.
- Veritabanı bağlantısı: `app/db/database.py`
  - `Settings` sınıfı `CULTIVATION_` prefix’li environment değişkenlerinden MSSQL ayarlarını okur.
  - `settings.sqlalchemy_url()` MSSQL için `pyodbc` tabanlı bir SQLAlchemy connection string üretir.
  - `engine` ve `SessionLocal` tanımlıdır, `get_db()` dependency’si API’de kullanılır.

### 3. ORM Modelleri (SQLAlchemy)

- Modeller `app/models/` altında tanımlıdır ve MSSQL tablolarıyla uyumludur:
  - `User`, `DailyLog`, `Habit`, `HabitLog`, `MoodRecord`, `HealthRecord`, `UserStats`
  - Tüm modeller `Base` (SQLAlchemy `DeclarativeBase`) üzerinden kalıtım alır.
  - `User` ile diğer tablolar arasında `relationship` bağları kuruludur.

### 4. API Router’ları

- Ana router: `app/api/__init__.py`
  - `/api/v1/users` — kullanıcı listesini döner.
  - `/api/v1/daily-logs` — `user_id` (zorunlu) ve `log_date` (opsiyonel) ile günlük kayıtları listeler.
  - `/api/v1/moods` — `user_id` (zorunlu) ve `record_date` (opsiyonel) ile ruh hali kayıtlarını listeler.

Örnek istekler (varsayılan `uvicorn` portu 8000 kabul edilerek):

- `GET http://localhost:8000/health`
- `GET http://localhost:8000/api/v1/users`
- `GET "http://localhost:8000/api/v1/daily-logs?user_id=1"`
- `GET "http://localhost:8000/api/v1/moods?user_id=1"`

### 5. Çalıştırma Adımları

1. Python sanal ortamı oluşturun ve bağımlılıkları kurun:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. `.env` dosyasında gerekli MSSQL ayarlarını yapın (gerekirse):

   ```env
   CULTIVATION_MSSQL_SERVER=localhost
   CULTIVATION_MSSQL_DATABASE=CultivationDB
   CULTIVATION_MSSQL_DRIVER=ODBC Driver 17 for SQL Server
   # Windows auth kullanmıyorsanız:
   # CULTIVATION_MSSQL_TRUSTED_CONNECTION=false
   # CULTIVATION_MSSQL_USERNAME=...
   # CULTIVATION_MSSQL_PASSWORD=...
   ```

3. Uygulamayı çalıştırın:

   ```bash
   uvicorn app.main:app --reload
   ```

4. Tarayıcıdan veya API client’tan `/health` ve `/api/v1/...` endpoint’lerini test edin.

## Is Paketi 3 - Kullanici Yonetimi ve Guvenlik

Bu bolumde kayit, giris, JWT ve profil guncelleme akislari eklenmistir.

### Yeni endpointler

- `POST /api/v1/auth/register`
  - Body:
    - `full_name` (string)
    - `email` (string, unique)
    - `password` (string, min 8)
  - Sonuc: olusan kullanici profili (sifre hashli saklanir)

- `POST /api/v1/auth/login`
  - Body:
    - `email`
    - `password`
  - Sonuc: `access_token` ve `token_type=bearer`

- `GET /api/v1/users/me` (JWT gerekli)
  - Header: `Authorization: Bearer <access_token>`
  - Sonuc: giris yapan kullanici profili

- `PUT /api/v1/users/me` (JWT gerekli)
  - Header: `Authorization: Bearer <access_token>`
  - Body (opsiyonel alanlar):
    - `full_name`, `birth_date`, `gender`, `weight`, `height`
  - Sonuc: guncellenmis profil

### Postman test sirasi

1. `POST /api/v1/auth/register` ile yeni kullanici olustur.
2. `POST /api/v1/auth/login` ile token al.
3. Token'i Postman collection auth kismina `Bearer Token` olarak yapistir.
4. `GET /api/v1/users/me` cagrisinin 200 dondugunu dogrula.
5. `PUT /api/v1/users/me` ile bir alan guncelle (ornegin `full_name`), tekrar `GET /users/me` ile degisikligi dogrula.
6. Yanlis token ile `GET /users/me` cagrisi yapip 401 dondugunu test et.

### Guvenlik notlari

- Sifreler bcrypt (`passlib`) ile hashlenir; plain password veritabanina yazilmaz.
- JWT payload `sub` alaninda `user_id` tasir.
- Varsayilan JWT ayarlari `.env` uzerinden override edilmelidir:
  - `CULTIVATION_JWT_SECRET_KEY`
  - `CULTIVATION_JWT_ALGORITHM`
  - `CULTIVATION_JWT_ACCESS_TOKEN_EXPIRE_MINUTES`

