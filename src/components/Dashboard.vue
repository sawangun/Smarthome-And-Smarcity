<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      <!-- ================= HEADER ================= -->
      <header
        class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div
            class="mb-2 text-xs font-black tracking-[.2em] text-indigo-400"
          >
            IoT - By Sawangun
          </div>

          <h1 class="text-3xl font-black">
            Smart Home & City
            <span class="text-indigo-400">Dashboard</span>
          </h1>

          <p class="mt-2 text-sm text-slate-400">
            Dashboard → Supabase → Python Userbot → Telegram → ESP32
          </p>
        </div>

        <div
          class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <div class="flex items-center gap-2 text-sm font-bold">
            <span
              :class="[
                'h-2.5 w-2.5 rounded-full',
                realtimeOnline ? 'bg-emerald-400' : 'bg-red-400'
              ]"
            ></span>

            {{
              realtimeOnline
                ? 'Realtime tersambung'
                : 'Realtime belum tersambung'
            }}
          </div>

          <div class="mt-1 text-xs text-slate-500">
            {{ lastUpdateLabel }}
          </div>
        </div>
      </header>


      <!-- ================= ERROR ================= -->
      <div
        v-if="errorMessage"
        class="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
      >
        {{ errorMessage }}
      </div>


      <!-- ================= LOADING ================= -->
      <main
        v-if="!loading"
        class="space-y-6"
      >

        <!-- ================= CONDITION ================= -->
        <section class="grid gap-4 sm:grid-cols-3">

          <!-- HUJAN -->
          <div class="panel">
            <span class="text-2xl">
              {{ state.is_raining ? '🌧️' : '☀️' }}
            </span>

            <div>
              <p class="muted">Cuaca</p>

              <b>
                {{
                  state.is_raining
                    ? 'Hujan'
                    : 'Tidak hujan'
                }}
              </b>
            </div>
          </div>


          <!-- SIANG / MALAM -->
          <div class="panel">
            <span class="text-2xl">
              {{ state.is_dark ? '🌙' : '☀️' }}
            </span>

            <div>
              <p class="muted">Kondisi</p>

              <b>
                {{
                  state.is_dark
                    ? 'Malam'
                    : 'Siang'
                }}
              </b>
            </div>
          </div>


          <!-- COMMAND -->
          <div class="panel">
            <span class="text-2xl">
              📡
            </span>

            <div>
              <p class="muted">Command</p>

              <b>
                {{ pendingCount }}
                sedang diproses
              </b>
            </div>
          </div>

        </section>


        <!-- ================= DEVICE CONTROL ================= -->
        <section
          class="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"
        >

          <div
            class="mb-5 flex items-end justify-between gap-3"
          >
            <div>
              <p class="muted">
                CONTROL
              </p>

              <h2 class="mt-1 text-2xl font-black">
                Perangkat
              </h2>
            </div>

            <p
              class="hidden text-xs text-slate-500 sm:block"
            >
              Tombol mengirim command ke grup Telegram
              melalui Python Userbot.
            </p>
          </div>


          <!-- 4 DEVICE -->
          <div
            class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >

            <button
              v-for="(cfg, key) in devices"
              :key="key"
              :disabled="busy === key"
              @click="toggleDevice(key)"
              :class="[
                'relative rounded-3xl border p-5 text-left transition hover:-translate-y-1 disabled:cursor-wait',

                state[key]
                  ? 'border-emerald-400/30 bg-emerald-400/[.07]'
                  : 'border-white/10 bg-black/10'
              ]"
            >

              <!-- LOADING DEVICE -->
              <div
                v-if="busy === key"
                class="absolute inset-0 grid place-items-center rounded-3xl bg-slate-950/75 backdrop-blur-sm"
              >
                <span class="spinner"></span>
              </div>


              <!-- DEVICE HEADER -->
              <div
                class="flex items-start justify-between"
              >

                <span
                  class="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl"
                >
                  {{ cfg.icon }}
                </span>


                <span
                  :class="[
                    'rounded-full px-2 py-1 text-[10px] font-black',

                    state[key]
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : 'bg-white/5 text-slate-500'
                  ]"
                >
                  {{ state[key] ? 'ON' : 'OFF' }}
                </span>

              </div>


              <!-- DEVICE NAME -->
              <h3
                class="mt-7 text-lg font-black"
              >
                {{ cfg.name }}
              </h3>


              <!-- DEVICE STATUS -->
              <p
                :class="[
                  'mt-1 text-sm',

                  state[key]
                    ? 'text-emerald-300'
                    : 'text-slate-500'
                ]"
              >
                {{
                  state[key]
                    ? cfg.on
                    : cfg.off
                }}
              </p>


              <!-- SWITCH -->
              <div
                class="mt-6 h-8 rounded-full bg-black/30 p-1"
              >
                <div
                  :class="[
                    'h-6 w-1/2 rounded-full bg-white transition-transform duration-300',

                    state[key]
                      ? 'translate-x-full'
                      : 'translate-x-0'
                  ]"
                ></div>
              </div>

            </button>

          </div>
        </section>


        <!-- ================= COMMAND QUEUE ================= -->
        <section
          class="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"
        >

          <div
            class="mb-4 flex items-center justify-between"
          >

            <div>
              <p class="muted">
                LIVE QUEUE
              </p>

              <h2 class="mt-1 text-xl font-black">
                Aktivitas command
              </h2>
            </div>


            <button
              class="text-xs text-indigo-300 hover:text-indigo-200"
              @click="refresh"
            >
              Refresh
            </button>

          </div>


          <!-- EMPTY -->
          <div
            v-if="commands.length === 0"
            class="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-500"
          >
            Belum ada command dari dashboard.
          </div>


          <!-- COMMAND LIST -->
          <div
            v-for="c in commands"
            :key="c.id"
            class="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/10 p-3 text-sm"
          >

            <div>

              <b>
                {{ devices[c.device]?.name || c.device }}
              </b>

              →
              {{ c.desired_state ? 'ON' : 'OFF' }}

              <div
                class="text-xs text-slate-500"
              >
                {{ formatTime(c.created_at) }}
              </div>

            </div>


            <span
              :class="statusClass(c.status)"
            >
              {{ c.status }}
            </span>

          </div>

        </section>

      </main>


      <!-- ================= LOADING SCREEN ================= -->
      <div
        v-else
        class="grid min-h-[60vh] place-items-center"
      >
        <span class="spinner"></span>
      </div>

    </div>
  </div>
</template>


<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted
} from 'vue'

import { supabase } from '../supabase'


// ============================================================
// STATE
// ============================================================

const loading = ref(true)

const busy = ref(null)

const errorMessage = ref('')

const realtimeOnline = ref(false)

const lastUpdate = ref(new Date())

const pendingCount = ref(0)

const commands = ref([])


// ============================================================
// SMART CITY STATE
//
// HANYA 4 DEVICE YANG DIKONTROL DASHBOARD
//
// is_raining dan is_dark = INFORMASI KONDISI
// ============================================================

const state = ref({

  pintu: false,

  jemuran: false,

  lampu_rumah: false,

  lampu_jalan: false,

  is_raining: false,

  is_dark: false

})


// ============================================================
// 4 DEVICE
// ============================================================

const devices = {

  pintu: {
    name: 'Pintu',
    icon: '🚪',
    on: 'Terbuka',
    off: 'Tertutup'
  },

  jemuran: {
    name: 'Jemuran',
    icon: '👕',
    on: 'Di luar',
    off: 'Ditarik'
  },

  lampu_rumah: {
    name: 'Lampu Rumah',
    icon: '💡',
    on: 'Menyala',
    off: 'Mati'
  },

  lampu_jalan: {
    name: 'Lampu Jalan',
    icon: '🛣️',
    on: 'Menyala',
    off: 'Mati'
  }

}


// ============================================================
// LAST UPDATE LABEL
// ============================================================

const lastUpdateLabel = computed(() => {

  const sec = Math.floor(
    (Date.now() - lastUpdate.value.getTime()) / 1000
  )

  if (sec < 5) {
    return 'baru saja'
  }

  return `${sec} detik lalu`

})


// ============================================================
// REFRESH DATA
// ============================================================

async function refresh() {

  try {

    // ========================================================
    // SMART CITY STATE
    //
    // TIDAK MENGGUNAKAN .single()
    // supaya tidak menghasilkan 406
    // ========================================================

    const {
      data,
      error
    } = await supabase

      .from('smart_city_state')

      .select('*')

      .eq('id', 1)

      .limit(1)


    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

      console.error(
        'Gagal membaca smart_city_state:',
        error
      )

      errorMessage.value =
        `Gagal membaca smart_city_state: ${error.message}`

      return
    }


    // ========================================================
    // DATA TIDAK ADA
    // ========================================================

    if (!data || data.length === 0) {

      errorMessage.value =
        'Data smart_city_state dengan id=1 tidak ditemukan.'

      return
    }


    // ========================================================
    // UPDATE STATE
    // ========================================================

    state.value = {
      ...state.value,
      ...data[0]
    }

    lastUpdate.value = new Date()


    // ========================================================
    // COMMAND TERBARU
    // ========================================================

    const q = await supabase

      .from('device_commands')

      .select('*')

      .order(
        'created_at',
        {
          ascending: false
        }
      )

      .limit(10)


    if (!q.error) {

      commands.value =
        q.data || []

    } else {

      console.error(
        'Gagal membaca device_commands:',
        q.error
      )

    }


    // ========================================================
    // PENDING COMMAND COUNT
    // ========================================================

    const p = await supabase

      .from('device_commands')

      .select('*', {
        count: 'exact',
        head: true
      })

      .in(
        'status',
        [
          'pending',
          'sending',
          'sent'
        ]
      )


    if (!p.error) {

      pendingCount.value =
        p.count || 0

    } else {

      console.error(
        'Gagal menghitung command:',
        p.error
      )

    }


  } catch (error) {

    console.error(
      'Refresh error:',
      error
    )

    errorMessage.value =
      `Terjadi kesalahan: ${error.message}`

  }

}


// ============================================================
// TOGGLE DEVICE
//
// PENTING:
//
// Dashboard TIDAK mengubah smart_city_state.
//
// Dashboard hanya membuat command:
//
// device_commands
//      ↓
// Python Userbot
//      ↓
// Telegram
//      ↓
// ESP32
//
// Setelah ESP32 mengirim status,
// Python baru mengubah smart_city_state.
// ============================================================

async function toggleDevice(device) {

  if (busy.value) {
    return
  }


  busy.value = device

  errorMessage.value = ''


  try {

    // ========================================================
    // TENTUKAN TARGET
    // ========================================================

    const desired =
      !Boolean(state.value[device])


    // ========================================================
    // INSERT COMMAND
    // ========================================================

    const {
      error
    } = await supabase

      .from('device_commands')

      .insert({

        device: device,

        desired_state: desired,

        status: 'pending'

      })


    // ========================================================
    // ERROR
    // ========================================================

    if (error) {

      console.error(
        'Command gagal masuk queue:',
        error
      )

      errorMessage.value =
        `Command gagal masuk queue: ${error.message}`

      return
    }


    // ========================================================
    // REFRESH
    // ========================================================

    await refresh()


  } catch (error) {

    console.error(
      'Toggle error:',
      error
    )

    errorMessage.value =
      `Terjadi kesalahan: ${error.message}`

  } finally {

    busy.value = null

  }

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(value) {

  if (!value) {
    return '-'
  }

  return new Date(
    value
  ).toLocaleTimeString(
    'id-ID'
  )

}


// ============================================================
// STATUS CLASS
// ============================================================

function statusClass(status) {

  if (status === 'completed') {

    return 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300'

  }


  if (status === 'failed') {

    return 'rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300'

  }


  if (status === 'sent') {

    return 'rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300'

  }


  if (status === 'sending') {

    return 'rounded-full bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-300'

  }


  return 'rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300'

}


// ============================================================
// REALTIME CHANNEL
// ============================================================

let stateChannel = null

let commandChannel = null

let refreshTimer = null


// ============================================================
// ON MOUNTED
// ============================================================

onMounted(async () => {

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  await refresh()

  loading.value = false


  // ==========================================================
  // SMART CITY STATE REALTIME
  // ==========================================================

  stateChannel = supabase

    .channel(
      'smart-city-state-live'
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'smart_city_state',
        filter: 'id=eq.1'
      },
      payload => {

        console.log(
          '[Realtime] smart_city_state:',
          payload
        )


        if (
          payload.eventType === 'DELETE'
        ) {
          return
        }


        if (
          payload.new
        ) {

          state.value = {
            ...state.value,
            ...payload.new
          }

          lastUpdate.value =
            new Date()

        }

      }
    )

    .subscribe(status => {

      console.log(
        '[Realtime] State:',
        status
      )

      realtimeOnline.value =
        status === 'SUBSCRIBED'

    })


  // ==========================================================
  // DEVICE COMMAND REALTIME
  // ==========================================================

  commandChannel = supabase

    .channel(
      'smart-city-command-live'
    )

    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'device_commands'
      },
      async payload => {

        console.log(
          '[Realtime] device_commands:',
          payload
        )

        await refresh()

      }
    )

    .subscribe(status => {

      console.log(
        '[Realtime] Command:',
        status
      )

    })


  // ==========================================================
  // FALLBACK POLLING
  //
  // Kalau websocket/realtime bermasalah,
  // dashboard tetap membaca database.
  // ==========================================================

  refreshTimer =
    window.setInterval(
      refresh,
      2000
    )

})


// ============================================================
// ON UNMOUNTED
// ============================================================

onUnmounted(() => {

  if (stateChannel) {

    supabase.removeChannel(
      stateChannel
    )

  }


  if (commandChannel) {

    supabase.removeChannel(
      commandChannel
    )

  }


  if (refreshTimer) {

    clearInterval(
      refreshTimer
    )

  }

})

</script>


<style scoped>

.panel {
  @apply flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-5;
}

.muted {
  @apply text-[10px] font-black uppercase tracking-[.18em] text-slate-500;
}

.spinner {
  @apply h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400;
}

</style>
```
