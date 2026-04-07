# WP4 - Figma / Adobe XD Handoff Rehberi

Bu rehber, hazirlanan UI/UX dokumani ve HTML prototipin Figma veya Adobe XD'ye nasil tasinacagini aciklar.

## 1) Kaynak Dosyalar

- Tasarim kurallari ve ekran gereksinimleri: `WP4_UI_UX_Design.md`
- Tiklanabilir referans prototip: `wp4_prototype.html`

## 2) Figma'ya Aktarim Akisi

1. Figma'da yeni dosya olustur.
2. `Design System` adli bir sayfa ac:
   - Renk stillerini olustur (Primary, Secondary, Surface, Error vb.).
   - Text stilleri olustur (H1, H2, Body, Caption).
3. `Components` sayfasi ac:
   - Button (Primary/Secondary)
   - Text Field (default/error)
   - Card ve KPI Card
   - Sidebar item (active/default)
4. `Screens` sayfasi ac:
   - Landing
   - Dashboard
   - Daily Log
   - Goals
5. `Prototype` modunda:
   - Sol menudeki butonlari ilgili frame'lere bagla.
   - `Hemen Basla` -> Register frame, `Giris Yap` -> Login frame (varsa).

## 3) Adobe XD'ye Aktarim Akisi

1. Yeni artboard seti olustur (Desktop + Mobile).
2. Character styles ve color styles tanimla.
3. Repeat Grid ile KPI kartlarini hizli olustur.
4. Prototype sekmesinde ekran gecislerini tanimla:
   - Dashboard -> Daily Log -> Goals
5. Share for Review baglantisi ureterek geri bildirim topla.

## 4) UX Test Senaryolari (Postman degil, kullanici testi)

Bu paket UI/UX oldugu icin testler gorev bazli yapilmalidir:

- Senaryo 1: Kullanici dashboard'dan bugunku ilerlemeyi anlar mi?
- Senaryo 2: Kullanici 60 saniye icinde gunluk kayit ekleyebiliyor mu?
- Senaryo 3: Kullanici yeni hedef olusturup durumunu gorebiliyor mu?
- Senaryo 4: Mobil gorunumde navigasyon anlasilir mi?

Metrikler:
- Task completion rate (%)
- Ortalama gorev tamamlama suresi
- Hata sayisi
- SUS benzeri memnuniyet puani (1-5)

## 5) Kabul Kriterleri

- Tum ana ekranlarin hi-fi tasarimi tamam
- Navigasyon prototipi tiklanabilir
- Renk ve tipografi standardi sabit
- En az 3 kullanicidan UX geri bildirimi alinmis

