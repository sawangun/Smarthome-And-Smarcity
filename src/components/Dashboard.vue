<template>
  <div class="min-h-screen bg-slate-100 p-6 md:p-10 font-sans text-slate-800 selection:bg-indigo-200">
    
    <!-- Header Section -->
    <header class="mb-10 text-center md:text-left">
      <div class="inline-block px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold tracking-wide mb-3 shadow-inner">
        VIRTUAL HOME & CITY
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">
        Smart Home & City <span class="text-indigo-600">IoT Hub</span>
      </h1>
      <p class="text-slate-500 mt-3 text-lg">Monitoring & Control Center</p>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="relative w-20 h-20">
        <div class="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        <div class="absolute inset-4 bg-indigo-100 rounded-full animate-pulse"></div>
      </div>
      <p class="text-lg font-medium text-slate-500 mt-6 animate-pulse">Menghubungkan ke miniatur...</p>
    </div>

    <div v-else class="max-w-6xl mx-auto space-y-10">
      
      <!-- Environment Status (Sensors) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Cuaca -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex justify-between items-start mb-2">
              <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Sensor Cuaca</p>
              <span class="text-2xl">{{ dbState.is_raining ? '🌧️' : '☀️' }}</span>
            </div>
            <p class="text-2xl font-black mt-2 tracking-tight" :class="dbState.is_raining ? 'text-blue-600' : 'text-slate-700'">
              {{ dbState.is_raining ? 'Hujan Turun' : 'Cerah' }}
            </p>
          </div>
        </div>

        <!-- LDR -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <div class="relative z-10">
            <div class="flex justify-between items-start mb-2">
              <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Pencahayaan</p>
              <span class="text-2xl">{{ dbState.is_dark ? '🌙' : '☀️' }}</span>
            </div>
            <p class="text-2xl font-black mt-2 tracking-tight" :class="dbState.is_dark ? 'text-indigo-600' : 'text-amber-500'">
              {{ dbState.is_dark ? 'Malam / Gelap' : 'Siang / Terang' }}
            </p>
          </div>
        </div>

        <!-- Status -->
        <div class="bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-800 hover:shadow-xl hover:shadow-indigo-900/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
          <div class="relative z-10 flex flex-col justify-between h-full">
            <p class="text-sm font-bold text-slate-400 uppercase tracking-widest">Status Sistem</p>
            <div class="flex items-center gap-3 mt-4">
              <div class="relative flex h-5 w-5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-slate-900"></span>
              </div>
              <p class="text-2xl font-black text-white tracking-tight">Online Real-time</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Control Panel (Actuators) -->
      <section class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/60">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Panel Saklar Aktuator</h2>
          <span class="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Tap untuk mengontrol</span>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <template v-for="(config, key) in actuatorConfigs" :key="key">
            <!-- Jendela disembunyikan/dikomen sementara -->
            <div 
              v-if="key !== 'jendela'"
              @click="toggleDevice(key)"
              :class="[
                'cursor-pointer relative overflow-hidden rounded-3xl p-5 border-2 transition-all duration-300 transform active:scale-95 flex flex-col',
                dbState[key] 
                  ? 'bg-indigo-50 border-indigo-200 shadow-[0_8px_16px_rgba(79,70,229,0.15)]' 
                  : 'bg-slate-50 border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-slate-100'
              ]"
            >
              
              <!-- Indikator Loading saat di-klik -->
              <div v-if="updating === key" class="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-3xl">
                <div class="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>

              <!-- Header Card (Icon & Badge) -->
              <div class="flex justify-between items-start mb-6">
                <div class="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                     :class="dbState[key] ? 'shadow-indigo-200/50' : ''">
                  {{ config.icon }}
                </div>
                
                <!-- Badge Status Kecil -->
                <span 
                  class="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md transition-colors"
                  :class="dbState[key] ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'"
                >
                  {{ dbState[key] ? 'ON' : 'OFF' }}
                </span>
              </div>
              
              <!-- Nama Perangkat -->
              <h3 class="font-extrabold text-slate-800 text-lg mb-1 leading-tight">{{ config.name }}</h3>
              <p class="text-sm font-semibold transition-colors" :class="dbState[key] ? 'text-indigo-600' : 'text-slate-400'">
                {{ dbState[key] ? config.activeLabel : config.inactiveLabel }}
              </p>

              <!-- Animasi Saklar Lucu 3D di Bawah -->
              <div class="mt-6">
                <div 
                  class="w-full h-10 rounded-xl relative p-1 transition-colors duration-300"
                  :class="dbState[key] ? 'bg-indigo-200/50' : 'bg-slate-200/70 shadow-inner'"
                >
                  <div 
                    class="w-1/2 h-full bg-white rounded-lg shadow-[0_2px_5px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all duration-300 ease-spring"
                    :class="dbState[key] ? 'translate-x-full shadow-[0_2px_8px_rgba(79,70,229,0.3)]' : 'translate-x-0'"
                  >
                    <!-- Garis Grip pada tombol (seperti saklar asli) -->
                    <div class="flex gap-[2px]">
                      <div class="w-1 h-3 rounded-full opacity-30" :class="dbState[key] ? 'bg-indigo-600' : 'bg-slate-400'"></div>
                      <div class="w-1 h-3 rounded-full opacity-30" :class="dbState[key] ? 'bg-indigo-600' : 'bg-slate-400'"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </template>

        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../supabase';

const loading = ref(true);
const updating = ref(null);

// State sentral dari DB (menyesuaikan kolom tabel 'smart_city_state')
const dbState = ref({
  pintu: false,
  jendela: false, // Jendela tetap ada di database/state, hanya UI-nya di-hide
  pagar: false,
  paket: false,
  jemuran: false,
  lampu_rumah: false,
  lampu_jalan: false,
  is_raining: false,
  is_dark: false
});

// Konfigurasi tampilan UI
const actuatorConfigs = {
  pintu: { name: 'Pintu Utama', icon: '🚪', activeLabel: 'Terbuka Terkunci', inactiveLabel: 'Tertutup Rapat' },
  jendela: { name: 'Jendela', icon: '🪟', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' }, // Akan di-skip oleh v-if di template
  pagar: { name: 'Pagar Depan', icon: '⛩️', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' },
  paket: { name: 'Kotak Paket', icon: '📦', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' },
  jemuran: { name: 'Jemuran', icon: '👕', activeLabel: 'Di Luar', inactiveLabel: 'Ditarik Ke Dalam' },
  lampu_rumah: { name: 'Lampu Rumah', icon: '💡', activeLabel: 'Menyala Terang', inactiveLabel: 'Padam' },
  lampu_jalan: { name: 'Lampu Jalan', icon: '🛣️', activeLabel: 'Menyala Terang', inactiveLabel: 'Padam' }
};

let realtimeSubscription;

// Fungsi untuk Load State awal dari Supabase
const fetchState = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('smart_city_state')
      .select('*')
      .eq('id', 1)
      .single();
      
    if (error) {
      console.error('Error fetching state from Supabase:', error.message);
    } else if (data) {
      dbState.value = data;
    }
  } catch (err) {
    console.error('System error:', err);
  } finally {
    loading.value = false;
  }
};

// Fungsi Toggle mengubah DB
const toggleDevice = async (fieldKey) => {
  if (updating.value) return; // cegah double click
  
  updating.value = fieldKey;
  const newState = !dbState.value[fieldKey];
  
  const { error } = await supabase
    .from('smart_city_state')
    .update({ [fieldKey]: newState })
    .eq('id', 1);

  if (error) {
    console.error(`Gagal update ${fieldKey}:`, error);
    alert('Gagal mengirim perintah ke Supabase!');
  } else {
    // UI update lokal secara instan supaya terasa cepat
    dbState.value[fieldKey] = newState;
  }
  
  updating.value = null;
};

// Fungsi Setup Realtime Supabase
const setupRealtime = () => {
  realtimeSubscription = supabase
    .channel('public:smart_city_state')
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'smart_city_state', 
        filter: 'id=eq.1' 
      },
      (payload) => {
        console.log('🔄 Data terbaru dari DB/ESP32:', payload.new);
        dbState.value = { ...dbState.value, ...payload.new };
      }
    )
    .subscribe((status) => {
      console.log('Realtime status:', status);
    });
};

onMounted(() => {
  fetchState();
  setupRealtime();
});

onUnmounted(() => {
  if (realtimeSubscription) {
    supabase.removeChannel(realtimeSubscription);
  }
});
</script>

<style scoped>
/* Tambahan CSS khusus untuk efek pantulan spring pada saklar */
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
