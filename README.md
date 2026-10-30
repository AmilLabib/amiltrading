# Jurnal Trading

Diary trading pribadi: cerita, mood, keputusan, dan eksekusi saham (IDX), plus review di kemudian hari.

**Stack:** React + Vite + Tailwind CSS v4 · Vercel Serverless Functions (`/api`) · Upstash Redis.

## Jalankan lokal

```bash
npm install
cp .env.example .env.local   # isi APP_PASSWORD & AUTH_SECRET
npm run dev                   # http://localhost:5173
```

Kalau `KV_REST_API_URL` kosong, API pakai database sementara di memori (hilang saat server restart). Isi kredensial Upstash di `.env.local` kalau mau pakai data asli.

## Deploy ke Vercel

1. Push repo ini ke GitHub, lalu **Import Project** di Vercel (framework terdeteksi otomatis sebagai Vite).
2. Di project Vercel: **Storage → Create Database → Upstash for Redis** (Marketplace) → connect ke project. Ini otomatis mengisi `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
3. **Settings → Environment Variables**, tambahkan:
   - `APP_PASSWORD`: password untuk masuk
   - `AUTH_SECRET`: string acak panjang (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
4. Redeploy.

Di HP: buka situsnya → menu browser → **Add to Home Screen** supaya terasa seperti aplikasi.

## Catatan

- **Ingat saya** menyimpan sesi 180 hari (cookie HttpOnly bertanda tangan). Tanpa itu, sesi berakhir saat browser ditutup.
  Ganti `AUTH_SECRET` untuk mengeluarkan semua perangkat sekaligus.
- Login dibatasi 10 percobaan gagal per 15 menit per IP.
- P/L dihitung dengan metode harga rata-rata (1 lot = 100 lembar), belum termasuk fee broker. Penjualan melebihi lot yang tercatat di diary tidak dihitung.
- Format teks di cerita: `**tebal**`, `*miring*`, `==stabilo==`, `- daftar`, `> kutipan`, `$BBCA` jadi link ke halaman saham.

## Struktur data (Redis)

- `td:entries`: sorted set id catatan, skor = timestamp
- `td:entry:{id}`: JSON catatan `{ date, title, story, decision, moods[], trades[], reviews[] }`
