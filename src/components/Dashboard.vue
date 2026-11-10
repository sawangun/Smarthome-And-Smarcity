<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- Header -->
      <header class="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            SMART CITY • LIVE
          </div>
          <h1 class="text-3xl font-black tracking-tight sm:text-4xl">
            Smart Home <span class="text-indigo-400">&amp; City</span>
          </h1>
          <p class="mt-2 text-sm text-slate-400">
            Kontrol dashboard → Supabase → Python Userbot → Telegram → ESP32
          </p>
        </div>

        <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div :class="['h-3 w-3 rounded-full', systemOnline ? 'bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.8)]' : 'bg-red-400']"></div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Realtime</p>
            <p class="text-sm font-semibold">{{ systemOnline ? 'Terhubung' : 'Terputus' }}</p>
          </div>
        </div>
      </header>

      <div v-if="loading" class="grid place-items-center rounded-3xl border border-white/10 bg-white/5 py-28">
        <div class="text-center">
          <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400"></div>
          <p class="mt-4 text-sm text-slate-400">Menghubungkan ke Smart City...</p>
        </div>
      </div>

      <main v-else class="space-y-7">

        <!-- Sensor summary -->
        <section class="grid gap-4 md:grid-cols-3">
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="label">Cuaca</p>
                <p :class="['mt-2 text-2xl font-black', dbState.is_raining ? 'text-sky-300' : 'text-amber-300']">
                  {{ dbState.is_raining ? 'Hujan' : 'Cerah' }}
                </p>
              </div>
              <div class="icon-box">{{ dbState.is_raining ? '🌧️' : '☀️' }}</div>
            </div>
            <p class="mt-3 text-xs text-slate-500">Sensor hujan ESP32</p>
          </div>

          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="label">Pencahayaan</p>
                <p :class="['mt-2 text-2xl font-black', dbState.is_dark ? 'text-indigo-300' : 'text-amber-300']">
                  {{ dbState.is_dark ? 'Malam' : 'Siang' }}
                </p>
              </div>
              <div class="icon-box">{{ dbState.is_dark ? '🌙' : '☀️' }}</div>
            </div>
            <p class="mt-3 text-xs text-slate-500">Sensor LDR ESP32</p>
          </div>

          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="label">Perintah aktif</p>
                <p class="mt-2 text-2xl font-black text-white">{{ pendingCount }}</p>
              </div>
              <div class="icon-box">📡</div>
            </div>
            <p class="mt-3 text-xs text-slate-500">Menunggu diproses Userbot</p>
          </div>
        </section>

        <!-- Main controls -->
        <section class="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="label">Control center</p>
              <h2 class="mt-1 text-2xl font-black">Perangkat Rumah &amp; Kota</h2>
            </div>
            <p class="text-xs text-slate-500">Klik saklar untuk mengirim command ke grup Telegram</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DeviceCard
              v-for="(config, key) in visibleDevices"
              :key="key"
              :config="config"
              :state="!!dbState[key]"
              :busy="updating === key"
              @toggle="toggleDevice(key)"
            />
          </div>
        </section>

        <!-- Activity -->
        <section class="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div class="rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-7">
            <div class="mb-5 flex items-center justify-between">
              <div>
                <p class="label">Activity</p>
                <h2 class="mt-1 text-xl font-black">Sinkronisasi terakhir</h2>
              </div>
              <span class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                {{ lastSyncText }}
              </span>
            </div>

            <div class="space-y-3">
              <div v-if="!activity.length" class="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500">
                Belum ada aktivitas pada sesi ini.
              </div>

              <div
                v-for="item in activity"
                :key="item.id"
                class="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/10 p-3"
              >
                <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-lg">
                  {{ item.icon }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ item.message }}</p>
                  <p class="text-xs text-slate-500">{{ item.time }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl border border-indigo-400/10 bg-indigo-500/5 p-5 sm:p-7">
            <p class="label">Architecture</p>
            <h2 class="mt-1 text-xl font-black">Alur kontrol</h2>
            <ol class="mt-5 space-y-4 text-sm">
              <li class="flex gap-3"><span class="step">1</span><span>Dashboard membuat command di <b>device_commands</b>.</span></li>
              <li class="flex gap-3"><span class="step">2</span><span>Python Userbot membaca command yang pending.</span></li>
              <li class="flex gap-3"><span class="step">3</span><span>Userbot mengirim <b>/pintu</b>, <b>/jemuran</b>, dll. ke grup.</span></li>
              <li class="flex gap-3"><span class="step">4</span><span>ESP32 mengeksekusi dan mengirim status balik.</span></li>
              <li class="flex gap-3"><span class="step">5</span><span>Userbot menyimpan status aktual ke Supabase.</span></li>
              <li class="flex gap-3"><span class="step">6</span><span>Supabase Realtime langsung mengubah dashboard.</span></li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabase'

const loading = ref(true)
const updating = ref(null)
const systemOnline = ref(false)
const lastSync = ref(new Date())
const activity = ref([])
const pendingCount = ref(0)

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
})

const actuatorConfigs = {
  pintu: { name: 'Pintu Utama', icon: '🚪', on: 'Terbuka', off: 'Tertutup' },
  jendela: { name: 'Jendela', icon: '🪟', on: 'Terbuka', off: 'Tertutup' },
  pagar: { name: 'Pagar Depan', icon: '⛩️', on: 'Terbuka', off: 'Tertutup' },
  paket: { name: 'Kotak Paket', icon: '📦', on: 'Terbuka', off: 'Tertutup' },
  jemuran: { name: 'Jemuran', icon: '👕', on: 'Di luar', off: 'Ditarik' },
  lampu_rumah: { name: 'Lampu Rumah', icon: '💡', on: 'Menyala', off: 'Mati' },
  lampu_jalan: { name: 'Lampu Jalan', icon: '🛣️', on: 'Menyala', off: 'Mati' }
}

// Sesuaikan daftar ini dengan perangkat yang benar-benar tersedia di ESP32.
// Berdasarkan sketch yang kamu kirim: pintu, jemuran, lampu_rumah, lampu_jalan.
const visibleDevices = computed(() => ({
  pintu: actuatorConfigs.pintu,
  jemuran: actuatorConfigs.jemuran,
  lampu_rumah: actuatorConfigs.lampu_rumah,
  lampu_jalan: actuatorConfigs.lampu_jalan
}))

const lastSyncText = computed(() => {
  const diff = Math.max(0, Math.floor((Date.now() - lastSync.value.getTime()) / 1000))
  return diff < 5 ? 'baru saja' : `${diff} detik lalu`
})

const addActivity = (message, icon = '🔄') => {
  activity.value.unshift({
    id: `${Date.now()}-${Math.random()}`,
    message,
    icon,
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })
  activity.value = activity.value.slice(0, 8)
}

const fetchState = async () => {
  const { data, error } = await supabase
    .from('smart_city_state')
    .select('*')
    .eq('id', 1)
    .single()

  if (!error && data) {
    dbState.value = { ...dbState.value, ...data }
    lastSync.value = new Date()
  } else if (error) {
    console.error(error)
  }
}

const fetchPending = async () => {
  const { count, error } = await supabase
    .from('device_commands')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'sent'])

  if (!error) pendingCount.value = count || 0
}

const toggleDevice = async (key) => {
  if (updating.value) return

  const desiredState = !Boolean(dbState.value[key])
  updating.value = key

  // Jangan mengubah smart_city_state langsung.
  // Masukkan permintaan ke queue agar Python Userbot yang mengirim Telegram.
  const { error } = await supabase
    .from('device_commands')
    .insert({
      device: key,
      desired_state: desiredState,
      status: 'pending'
    })

  if (error) {
    console.error(error)
    alert(`Gagal membuat command: ${error.message}`)
  } else {
    addActivity(
      `${actuatorConfigs[key]?.name || key}: perintah ${desiredState ? 'ON' : 'OFF'} dikirim ke antrean`,
      '📡'
    )
    await fetchPending()
  }

  updating.value = null
}

let stateChannel
let commandChannel

const setupRealtime = () => {
  stateChannel = supabase
    .channel('smart-city-state-live')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'smart_city_state', filter: 'id=eq.1' },
      (payload) => {
        dbState.value = { ...dbState.value, ...payload.new }
        lastSync.value = new Date()
        systemOnline.value = true
        addActivity('Status perangkat diperbarui dari backend/ESP32', '✅')
      }
    )
    .subscribe((status) => {
      systemOnline.value = status === 'SUBSCRIBED'
    })

  commandChannel = supabase
    .channel('device-command-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'device_commands' },
      () => fetchPending()
    )
    .subscribe()
}

onMounted(async () => {
  await fetchState()
  await fetchPending()
  setupRealtime()
  loading.value = false
})

onUnmounted(() => {
  if (stateChannel) supabase.removeChannel(stateChannel)
  if (commandChannel) supabase.removeChannel(commandChannel)
})
</script>

<script>
export default {
  components: {
    DeviceCard: {
      props: ['config', 'state', 'busy'],
      emits: ['toggle'],
      template: `
        <button
          class="device-card text-left"
          :class="state ? 'device-on' : 'device-off'"
          :disabled="busy"
          @click="$emit('toggle')"
        >
          <div v-if="busy" class="absolute inset-0 z-10 grid place-items-center rounded-3xl bg-slate-950/70 backdrop-blur-sm">
            <div class="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-indigo-400"></div>
          </div>

          <div class="flex items-start justify-between">
            <div class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">{{ config.icon }}</div>
            <span class="rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest"
              :class="state ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-500'">
              {{ state ? 'ON' : 'OFF' }}
            </span>
          </div>

          <div class="mt-7">
            <h3 class="text-lg font-black">{{ config.name }}</h3>
            <p class="mt-1 text-sm" :class="state ? 'text-emerald-300' : 'text-slate-500'">
              {{ state ? config.on : config.off }}
            </p>
          </div>

          <div class="mt-6 h-8 rounded-full bg-black/20 p-1">
            <div class="h-6 w-1/2 rounded-full bg-white shadow-lg transition-transform duration-300"
              :class="state ? 'translate-x-full' : 'translate-x-0'"></div>
          </div>
        </button>
      `
    }
  }
}
</script>

<style scoped>
.card {
  @apply rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10;
}
.label {
  @apply text-[11px] font-black uppercase tracking-[0.18em] text-slate-500;
}
.icon-box {
  @apply grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-2xl;
}
.device-card {
  @apply relative min-h-[220px] overflow-hidden rounded-3xl border p-5 transition duration-200 disabled:cursor-wait;
}
.device-on {
  @apply border-emerald-400/20 bg-emerald-400/[0.06] hover:-translate-y-1 hover:border-emerald-400/40;
}
.device-off {
  @apply border-white/10 bg-white/[0.025] hover:-translate-y-1 hover:border-white/20;
}
.step {
  @apply grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-xs font-black text-indigo-300;
}
</style>
