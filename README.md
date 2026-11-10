# Smart City IoT Dashboard (Vue.js + Supabase)

Proyek ini adalah Dashboard Vue.js (Vite + TailwindCSS) yang terintegrasi secara *Real-time* dengan database Supabase.

## 1. Setup Database Supabase
Kamu perlu membuat **1 tabel** di Supabase bernama `smart_city_state`.

1. Buka dashboard Supabase > Table Editor > Create a new table.
2. Nama tabel: `smart_city_state`
3. Matikan / Disable RLS (Row Level Security) untuk mempermudah (atau setel policy allow read/update).
4. Buat kolom-kolom berikut (tipe data **boolean**, default `false`):
   - `id` (int8, Primary Key)
   - `pintu`
   - `jendela`
   - `pagar`
   - `paket`
   - `jemuran`
   - `lampu_rumah`
   - `lampu_jalan`
   - `is_raining`
   - `is_dark`
5. **PENTING**: Masukkan **1 data dummy / baris pertama** (Insert Row) dengan nilai `id = 1` dan semua sisanya `false`.
6. Buka menu **Database** > **Replication** > Aktifkan (Enable) replikasi pada tabel `smart_city_state`. Ini WAJIB agar UI Vue berubah otomatis saat database di-update.

## 2. Cara Menjalankan Project Vue
1. Ekstrak file ZIP ini.
2. Buka terminal di dalam folder ini dan jalankan:
   ```bash
   npm install
   ```
3. Ubah nama file `.env.example` menjadi `.env`.
4. Isi URL dan KEY dari project Supabase kamu (Project Settings > API).
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=ey...
   ```
5. Jalankan aplikasi web:
   ```bash
   npm run dev
   ```

## 3. Integrasi ke ESP32 (Catatan Backend)
Karena sekarang kamu menggunakan Supabase:
*   Di ESP32, ketika ada perubahan sensor (LDR/Hujan/RFID), ESP32 harus melakukan **HTTP PATCH/PUT** request ke REST API Supabase kamu (endpoint: `/rest/v1/smart_city_state?id=eq.1`).
*   Bisa juga menggunakan backend FastAPI kamu yang sudah ada di VPS Linux untuk menerima *webhook/polling* dari Telegram & ESP32, lalu FastAPI yang meng-update tabel di Supabase lewat `supabase-py`.
