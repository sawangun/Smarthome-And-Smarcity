<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div class="mb-2 text-xs font-black tracking-[.2em] text-indigo-400">SMART CITY CONTROL</div>
          <h1 class="text-3xl font-black">Smart Home <span class="text-indigo-400">Dashboard</span></h1>
          <p class="mt-2 text-sm text-slate-400">Dashboard → Supabase → Python Userbot → Telegram → ESP32</p>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div class="flex items-center gap-2 text-sm font-bold">
            <span :class="['h-2.5 w-2.5 rounded-full', realtimeOnline ? 'bg-emerald-400' : 'bg-red-400']"></span>
            {{ realtimeOnline ? 'Realtime tersambung' : 'Realtime belum tersambung' }}
          </div>
          <div class="mt-1 text-xs text-slate-500">{{ lastUpdateLabel }}</div>
        </div>
      </header>

      <div v-if="errorMessage" class="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
        {{ errorMessage }}
      </div>

      <main v-if="!loading" class="space-y-6">
        <section class="grid gap-4 sm:grid-cols-3">
          <div class="panel"><span class="text-2xl">{{ state.is_raining ? '🌧️' : '☀️' }}</span><div><p class="muted">Cuaca</p><b>{{ state.is_raining ? 'Hujan' : 'Tidak hujan' }}</b></div></div>
          <div class="panel"><span class="text-2xl">{{ state.is_dark ? '🌙' : '☀️' }}</span><div><p class="muted">Kondisi</p><b>{{ state.is_dark ? 'Malam' : 'Siang' }}</b></div></div>
          <div class="panel"><span class="text-2xl">📡</span><div><p class="muted">Command</p><b>{{ pendingCount }} sedang diproses</b></div></div>
        </section>

        <section class="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7">
          <div class="mb-5 flex items-end justify-between gap-3">
            <div><p class="muted">CONTROL</p><h2 class="mt-1 text-2xl font-black">Perangkat</h2></div>
            <p class="hidden text-xs text-slate-500 sm:block">Tombol mengirim command ke grup Telegram melalui Python Userbot.</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button v-for="(cfg, key) in devices" :key="key" :disabled="busy === key" @click="toggleDevice(key)"
              :class="['relative rounded-3xl border p-5 text-left transition hover:-translate-y-1 disabled:cursor-wait', state[key] ? 'border-emerald-400/30 bg-emerald-400/[.07]' : 'border-white/10 bg-black/10']">
              <div v-if="busy === key" class="absolute inset-0 grid place-items-center rounded-3xl bg-slate-950/75 backdrop-blur-sm"><span class="spinner"></span></div>
              <div class="flex items-start justify-between"><span class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">{{ cfg.icon }}</span><span :class="['rounded-full px-2 py-1 text-[10px] font-black', state[key] ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/5 text-slate-500']">{{ state[key] ? 'ON' : 'OFF' }}</span></div>
              <h3 class="mt-7 text-lg font-black">{{ cfg.name }}</h3>
              <p :class="['mt-1 text-sm', state[key] ? 'text-emerald-300' : 'text-slate-500']">{{ state[key] ? cfg.on : cfg.off }}</p>
              <div class="mt-6 h-8 rounded-full bg-black/30 p-1"><div :class="['h-6 w-1/2 rounded-full bg-white transition-transform duration-300', state[key] ? 'translate-x-full' : 'translate-x-0']"></div></div>
            </button>
          </div>
        </section>

        <section class="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7">
          <div class="mb-4 flex items-center justify-between"><div><p class="muted">LIVE QUEUE</p><h2 class="mt-1 text-xl font-black">Aktivitas command</h2></div><button class="text-xs text-indigo-300" @click="refresh">Refresh</button></div>
          <div v-if="commands.length === 0" class="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500">Belum ada command dari dashboard.</div>
          <div v-for="c in commands" :key="c.id" class="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/10 p-3 text-sm">
            <div><b>{{ devices[c.device]?.name || c.device }}</b> → {{ c.desired_state ? 'ON' : 'OFF' }}<div class="text-xs text-slate-500">{{ formatTime(c.created_at) }}</div></div>
            <span :class="statusClass(c.status)">{{ c.status }}</span>
          </div>
        </section>
      </main>

      <div v-else class="grid min-h-[60vh] place-items-center"><span class="spinner"></span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../supabase'

const loading = ref(true)
const busy = ref(null)
const errorMessage = ref('')
const realtimeOnline = ref(false)
const lastUpdate = ref(new Date())
const pendingCount = ref(0)
const commands = ref([])

const state = ref({ pintu: false, jemuran: false, lampu_rumah: false, lampu_jalan: false, is_raining: false, is_dark: false })

const devices = {
  pintu: { name: 'Pintu', icon: '🚪', on: 'Terbuka', off: 'Tertutup' },
  jemuran: { name: 'Jemuran', icon: '👕', on: 'Di luar', off: 'Ditarik' },
  lampu_rumah: { name: 'Lampu Rumah', icon: '💡', on: 'Menyala', off: 'Mati' },
  lampu_jalan: { name: 'Lampu Jalan', icon: '🛣️', on: 'Menyala', off: 'Mati' }
}

const lastUpdateLabel = computed(() => {
  const sec = Math.floor((Date.now() - lastUpdate.value.getTime()) / 1000)
  return sec < 5 ? 'baru saja' : `${sec} detik lalu`
})

async function refresh() {
  const { data, error } = await supabase.from('smart_city_state').select('*').eq('id', 1).single()
  if (error) { errorMessage.value = `Gagal membaca smart_city_state: ${error.message}`; return }
  state.value = { ...state.value, ...data }
  lastUpdate.value = new Date()

  const q = await supabase.from('device_commands').select('*').order('created_at', { ascending: false }).limit(10)
  if (!q.error) commands.value = q.data || []

  const p = await supabase.from('device_commands').select('*', { count: 'exact', head: true }).in('status', ['pending', 'sending', 'sent'])
  if (!p.error) pendingCount.value = p.count || 0
}

async function toggleDevice(device) {
  if (busy.value) return
  busy.value = device
  errorMessage.value = ''
  const desired = !Boolean(state.value[device])

  // INI titik koneksi dashboard -> backend Python.
  // Dashboard TIDAK mengubah smart_city_state.
  // Python Userbot yang nanti mengirim /pintu, /jemuran, dst.
  const { error } = await supabase.from('device_commands').insert({
    device,
    desired_state: desired,
    status: 'pending'
  })

  if (error) errorMessage.value = `Command gagal masuk queue: ${error.message}`
  else await refresh()
  busy.value = null
}

function formatTime(v) { return v ? new Date(v).toLocaleTimeString('id-ID') : '-' }
function statusClass(s) {
  if (s === 'completed') return 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300'
  if (s === 'failed') return 'rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300'
  if (s === 'sent') return 'rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300'
  return 'rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300'
}

let stateChannel
let commandChannel
onMounted(async () => {
  await refresh()
  stateChannel = supabase.channel('smart-city-state-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'smart_city_state', filter: 'id=eq.1' }, payload => {
      state.value = { ...state.value, ...payload.new }
      lastUpdate.value = new Date()
    })
    .subscribe(status => { realtimeOnline.value = status === 'SUBSCRIBED' })

  commandChannel = supabase.channel('smart-city-command-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'device_commands' }, async () => { await refresh() })
    .subscribe()
  
  // fallback polling, supaya tetap terasa realtime walau websocket sempat putus
  window.__smartCityTimer = setInterval(refresh, 2000)
})

onUnmounted(() => {
  if (stateChannel) supabase.removeChannel(stateChannel)
  if (commandChannel) supabase.removeChannel(commandChannel)
  clearInterval(window.__smartCityTimer)
})
</script>

<style scoped>
.panel { @apply flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-5; }
.muted { @apply text-[10px] font-black uppercase tracking-[.18em] text-slate-500; }
.spinner { @apply h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400; }
</style>
