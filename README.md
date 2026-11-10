# Smart City Dashboard + Telegram Userbot + ESP32

## Arsitektur

Dashboard Vue
→ `device_commands` (Supabase)
→ Python Userbot
→ command Telegram ke grup
→ ESP32 membaca command
→ ESP32 mengirim status ke grup
→ Python Userbot
→ `smart_city_state`
→ Supabase Realtime
→ Dashboard berubah otomatis.

**Penting:** browser tidak menyimpan BOT_TOKEN, API_ID, API_HASH, atau Supabase Service Role Key.

## 1. Supabase

Jalankan `supabase_setup.sql` di SQL Editor.

Tabel `smart_city_state` tetap memakai baris `id = 1` dengan kolom:

- `pintu`
- `jendela`
- `pagar`
- `paket`
- `jemuran`
- `lampu_rumah`
- `lampu_jalan`
- `is_raining`
- `is_dark`

Tambahkan tabel `device_commands` dari SQL tersebut.

Aktifkan Realtime untuk `smart_city_state` dan `device_commands`.

## 2. Frontend

Di folder `Smarthome-And-Smarcity-main`, buat `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Lalu:

```bash
npm install
npm run dev
```

Dashboard sekarang **tidak mengubah `smart_city_state` secara langsung ketika tombol ditekan**. Dashboard membuat command di `device_commands`.

## 3. Python Userbot

Install:

```bash
pip install pyrogram tgcrypto supabase python-dotenv
```

Buat `.env` di folder backend:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

API_ID=123456
API_HASH=xxxxxxxx
GROUP_CHAT_ID=-100xxxxxxxxxx
ESP32_BOT_USERNAME=NamaBotTanpaAt
```

Jalankan:

```bash
python smart_city_userbot.py
```

Pada login pertama Pyrogram akan meminta nomor Telegram, kode OTP, dan bila ada password 2FA.

## 4. Perintah yang dipakai

Sesuai sketch ESP32 yang diberikan:

| Dashboard | Telegram |
|---|---|
| Pintu | `/pintu` |
| Jemuran | `/jemuran` |
| Lampu Rumah | `/LampuRumah` |
| Lampu Jalan | `/LampuJalan` |

ESP32 menggunakan command sebagai toggle. Karena itu Python membandingkan `desired_state` dengan status aktual di `smart_city_state` sebelum mengirim command.

## 5. Sinkronisasi dua arah

### Dashboard → Grup → ESP32

1. User menekan ON/OFF.
2. Dashboard insert row `pending`.
3. Python membaca row tersebut.
4. Python mengirim command Telegram.
5. ESP32 mengeksekusi.
6. ESP32 mengirim pesan status.
7. Python menangkap pesan tersebut.
8. Python update `smart_city_state`.
9. Supabase Realtime mengubah dashboard.

### Grup → ESP32 → Dashboard

1. User mengetik `/pintu`, `/jemuran`, dll. di grup.
2. ESP32 mengeksekusi.
3. ESP32 mengirim konfirmasi.
4. Python menangkap konfirmasi.
5. Python update `smart_city_state`.
6. Dashboard berubah otomatis.

Sensor LDR dan hujan juga ikut memperbarui dashboard jika pesan ESP32 sudah sesuai parser Python.

## Catatan keamanan

Sketch ESP32 yang dikirim ke ChatGPT berisi BOT_TOKEN. **Segera revoke token tersebut di @BotFather dan buat token baru** jika token itu masih aktif. Jangan commit `.env` atau token ke GitHub.
