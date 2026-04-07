# Is Paketi 4 - Web Arayuz Tasarimi (UI/UX) ve Prototipleme

Bu dokuman, Cultivation web uygulamasi icin UI/UX temelini tanimlar ve ana ekranlarin prototipleme standardini belirler.

## 1) Tasarim Sistemi (Material Design Uyumlu)

### Renk Paleti

- Primary: `#4F46E5`
- Primary Container: `#E0E7FF`
- Secondary: `#0EA5E9`
- Accent/Success: `#22C55E`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- On Surface (metin): `#0F172A`
- Outline: `#CBD5E1`

### Tipografi

- Font Family: `Inter`, yedek: `Roboto`, `Arial`, `sans-serif`
- H1: 32px / 700
- H2: 24px / 700
- H3: 20px / 600
- Body: 16px / 400
- Caption: 13px / 400

### Bilesen Kurallari

- Buton:
  - Border radius: 12px
  - Primary button: dolu `Primary`
  - Secondary button: outline
- Kart:
  - Arka plan: `Surface`
  - Border: `1px solid Outline`
  - Radius: 16px
  - Shadow: hafif (Material elevation 1-2)
- Form:
  - Input yuksekligi: 44px
  - Label + helper text standardi
  - Hata metni: `Error`

## 2) Ekranlar ve UX Akislari

## 2.1 Ana Sayfa (Landing)

Amaç: Uygulama degerini net anlatmak ve kullaniciyi kayit/giris akisina yonlendirmek.

Ana bolumler:
- Hero (baslik, alt metin, CTA)
- Ozellik kartlari:
  - Gunluk takip
  - Hedef yonetimi
  - Ruh hali analizi
- Guven ve sosyal kanit alani
- Footer (iletisim, gizlilik)

CTA:
- `Hemen Basla` -> Kayit
- `Giris Yap` -> Login

## 2.2 Kontrol Paneli (Dashboard)

Amaç: Kullanicinin gunluk durumunu tek bakista gostermek.

Bolumler:
- Ust bar: kullanici, bildirim, cikis
- Sol menu: Dashboard, Gunluk Kayit, Hedefler, Mood, Profil
- KPI kartlari:
  - Bugunku calisma suresi
  - Haftalik hedef tamamlama
  - Ortalama mood skoru
  - Streak bilgisi
- Grafik alanlari:
  - Son 7 gun mood trendi
  - Son 7 gun calisma dakikasi

## 2.3 Gunluk Kayit Ekrani

Amaç: Kullanicinin bir gunu hizli sekilde kaydetmesi.

Form alanlari:
- Tarih
- Notlar
- Calisma dakikasi
- Su tuketimi
- Uyku suresi
- Verimlilik skoru (1-10)

UX:
- Kaydet butonu sayfada sabit gorunur
- Basarili kayit sonrasi toast mesaj
- Validasyon hatalari alan altinda gosterilir

## 2.4 Hedef Belirleme Ekrani

Amaç: Hedef olusturma, listeleme ve tamamlandi takibi.

Bolumler:
- Yeni hedef formu:
  - Baslik
  - Aciklama
  - Hedef tarih
- Hedef listesi:
  - Durum etiketi (Devam ediyor/Tamamlandi)
  - Filter: tumu, aktif, tamamlandi

## 3) Bilgi Mimarisi ve Navigasyon

- Public:
  - `/` (Ana Sayfa)
  - `/login`
  - `/register`
- Authenticated:
  - `/dashboard`
  - `/daily-log`
  - `/goals`
  - `/mood`
  - `/profile`

## 4) UX Iyilestirme Kararlari

- Mobil oncelikli responsive yaklasim
- 8px grid sistemi
- Formlarda minimum adim prensibi
- Ana aksiyonlarda tutarli buton yerlestirmesi
- Empty state, loading state, error state tanimlari

## 5) Prototip Kapsami

Tiklanabilir prototip dosyasi: `wp4_prototype.html`

Bu prototipte:
- Sol menuden ekran gecisi
- Dashboard kartlari
- Gunluk kayit formu
- Hedef listesi ve basit etkileşim

