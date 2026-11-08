<template>
  <div class="min-h-screen bg-slate-50 p-8 font-sans text-slate-800">
    <!-- Header Section -->
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Smart City IoT Hub</h1>
      <p class="text-slate-500 mt-2">Monitoring & Control Center (Powered by Supabase)</p>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p class="text-lg text-slate-500 animate-pulse">Menghubungkan ke Supabase...</p>
    </div>

    <div v-else>
      <!-- Environment Status (Sensors) -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cuaca</p>
            <p class="text-xl font-bold mt-1" :class="dbState.is_raining ? 'text-blue-600' : 'text-slate-700'">
              {{ dbState.is_raining ? 'Hujan Turun 🌧️' : 'Cerah ☀️' }}
            </p>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pencahayaan (LDR)</p>
            <p class="text-xl font-bold mt-1" :class="dbState.is_dark ? 'text-indigo-600' : 'text-amber-500'">
              {{ dbState.is_dark ? 'Malam / Gelap 🌙' : 'Siang / Terang ☀️' }}
            </p>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-400 uppercase tracking-wider">Status Sistem</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <p class="text-xl font-bold text-slate-700">Online Real-time</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Control Panel (Actuators) -->
      <section>
        <h2 class="text-xl font-bold mb-6 text-slate-800">Panel Kontrol Aktuator</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <!-- Generate Controls Dynamically -->
          <div 
            v-for="(config, key) in actuatorConfigs" 
            :key="key"
            class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md"
          >
            <div class="flex justify-between items-start mb-4">
              <span class="text-2xl">{{ config.icon }}</span>
              <!-- Toggle Switch -->
              <button 
                @click="toggleDevice(key)"
                :disabled="updating === key"
                :class="[
                  dbState[key] ? 'bg-blue-600' : 'bg-slate-200', 
                  updating === key ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                ]"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              >
                <span 
                  :class="dbState[key] ? 'translate-x-6' : 'translate-x-1'"
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                />
              </button>
            </div>
            <h3 class="font-semibold text-slate-700">{{ config.name }}</h3>
            <p class="text-sm mt-1 font-medium" :class="dbState[key] ? 'text-blue-600' : 'text-slate-400'">
              {{ dbState[key] ? config.activeLabel : config.inactiveLabel }}
            </p>
          </div>

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
  jendela: false,
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
  pintu: { name: 'Pintu Utama', icon: '🚪', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' },
  jendela: { name: 'Jendela', icon: '🪟', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' },
  pagar: { name: 'Pagar Depan', icon: '⛩️', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' },
  paket: { name: 'Kotak Paket', icon: '📦', activeLabel: 'Terbuka', inactiveLabel: 'Tertutup' },
  jemuran: { name: 'Jemuran', icon: '👕', activeLabel: 'Di Luar', inactiveLabel: 'Ditarik' },
  lampu_rumah: { name: 'Lampu Rumah', icon: '💡', activeLabel: 'Menyala', inactiveLabel: 'Padam' },
  lampu_jalan: { name: 'Lampu Jalan', icon: '🛣️', activeLabel: 'Menyala', inactiveLabel: 'Padam' }
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

// Fungsi Setup Realtime Supabase (Supabase Postgres Changes)
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
        // Timpa state Vue dengan data DB baru
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
