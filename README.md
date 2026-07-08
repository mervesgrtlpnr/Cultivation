# 🌱 Cultivation: AI-Powered Personal Growth Assistant

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)

## 📌 Proje Vizyonu
Cultivation, sıradan bir alışkanlık takip uygulaması değil; kullanıcı verisini anlamlandırarak eyleme dönüştürülebilir içgörüler sunan **yapay zeka destekli bir kişisel gelişim asistanıdır.** Bir yazılım mühendisliği öğrencisi olarak, veri bilimi ve yapay zekaya olan akademik tutkumu modern yazılım mimarileriyle birleştirmek amacıyla bu projeyi geliştirdim. Temel hedefim; kullanıcıların günlük rutinlerini (spor, çalışma, beslenme vb.) sadece kaydetmelerini sağlamak değil, OpenAI entegrasyonu sayesinde bu veriler arasındaki gizli korelasyonları ortaya çıkararak onlara kişiselleştirilmiş bir vizyon sunmaktır.

## ✨ Temel Özellikler

* **🤖 Yapay Zeka İçgörü Motoru:** Kullanıcının spesifik tarih aralığındaki verilerini analiz ederek OpenAI (gpt-4o-mini) üzerinden anlamlı, motive edici ve bağlantısal analizler sunar.
* **🔄 Tek Kod Tabanı, Çift Platform:** React Native Web ve Expo Router mimarisi sayesinde yazılan kodlar hem iOS/Android cihazlarda hem de Web tarayıcılarında native performansla çalışır.
* **🔔 Akıllı Bildirim Gözlemcisi (Observer):** Dış sunuculara bağımlı kalmadan uygulamanın kendi içinde zamanı (09:00 ve 20:00) takip eden, duruma göre kullanıcıyı uyaran ve Zustand ile yönetilen akıllı panel.
* **🛡️ Veri İzolasyonu ve İhracı:** Firebase NoSQL altyapısı ile katı kullanıcı izolasyonu. Kullanıcıların verilerini CSV olarak indirebilmesi ve "Danger Zone" ile veritabanı dahil tüm varlıklarını kalıcı olarak silebilmesi.

## 🛠️ Teknoloji Yığını (Tech Stack)

* **Frontend:** React Native, Expo, React Native Web, Expo Router
* **State Management:** Zustand (Global State & Reaktif Arayüz Güncellemeleri)
* **Backend & Veritabanı (BaaS):** Firebase (Authentication & Firestore)
* **Yapay Zeka Entegrasyonu:** REST API (Fetch) üzerinden OpenAI API (`gpt-4o-mini` modeli)
* **Veri İşleme:** Asenkron veri formatlama ve Cross-Platform dosya sistemi (`expo-file-system`, `expo-sharing`, Web Blob)
