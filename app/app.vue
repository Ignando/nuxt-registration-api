<script setup lang="ts">
import { ref, onMounted } from 'vue'

const tab = ref<'login' | 'register'>('login')

const name = ref('')
const email = ref('')
const password = ref('')
const message = ref<string | null>(null)
const errors = ref<Record<string, string> | null>(null)

const users = ref<{ name: string; email: string }[]>([])

async function register() {
  message.value = null
  errors.value = null
  try {
    const res = await $fetch('/api/register', {
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value },
    })
    message.value = (res as any).message || 'Registered'
    // optional: refresh users list after register
    await loadUsers()
    // switch back to login tab (common UX)
    tab.value = 'login'
  } catch (e: any) {
    const data = e?.data ?? e
    message.value = data?.message ?? 'Registration failed'
    errors.value = data?.errors ?? null
  }
}

async function loadUsers() {
  try {
    users.value = await $fetch('/api/users')
  } catch {
    users.value = []
  }
}

onMounted(loadUsers)

// placeholder for when you add /api/login
async function login() {
  message.value = 'Login endpoint not added yet. I can wire /api/login next.'
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h1 class="title">Welcome</h1>

      <div class="tabs">
        <button
          :class="['tab', tab === 'login' && 'active']"
          @click="tab = 'login'"
        >
          Login
        </button>
        <button
          :class="['tab', tab === 'register' && 'active']"
          @click="tab = 'register'"
        >
          Register
        </button>
      </div>

      <form v-if="tab === 'login'" class="form" @submit.prevent="login">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password" required />
        <button type="submit" class="primary">Sign in</button>
      </form>

      <form v-else class="form" @submit.prevent="register">
        <input v-model="name" placeholder="Name (min 3 chars)" required />
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password (min 8)" required />
        <button type="submit" class="primary">Create account</button>
      </form>

      <p v-if="message" class="msg">{{ message }}</p>
      <ul v-if="errors" class="errors">
        <li v-for="(v, k) in errors" :key="k">{{ k }}: {{ v }}</li>
      </ul>
    </div>

    <!-- small debug panel you can remove before recording -->
    <div class="debug">
      <h3>Users</h3>
      <ul>
        <li v-for="u in users" :key="u.email">{{ u.name }} — {{ u.email }}</li>
      </ul>
    </div>
  </div>
</template>

<style>
/* Center the card */
.page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  background: #0f1220;
  color: #e8eaf3;
  padding: 24px;
  gap: 24px;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji;
}
.card {
  width: 100%;
  max-width: 420px;
  background: #151a2b;
  border: 1px solid #232a45;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
}
.title {
  margin: 0 0 12px 0;
  font-size: 22px;
  font-weight: 650;
  letter-spacing: 0.2px;
}
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #0f1322;
  border: 1px solid #232a45;
  border-radius: 10px;
  margin: 12px 0 18px;
}
.tab {
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #a8b0d6;
  cursor: pointer;
  font-weight: 550;
}
.tab.active {
  background: #1d2540;
  color: #fff;
  border-radius: 8px;
  margin: 4px;
}
.form {
  display: grid;
  gap: 10px;
}
.form input {
  width: 100%;
  padding: 10px 12px;
  background: #0f1322;
  color: #e8eaf3;
  border: 1px solid #2a3153;
  border-radius: 10px;
  outline: none;
}
.form input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.25);
}
.primary {
  padding: 10px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
}
.primary:hover { filter: brightness(1.05); }
.msg { margin-top: 10px; color: #c7d2fe; font-size: 0.95rem; }
.errors { margin-top: 8px; color: #fca5a5; font-size: 0.9rem; }
.debug {
  width: 100%;
  max-width: 420px;
  background: #0f1322;
  border: 1px dashed #2a3153;
  border-radius: 12px;
  padding: 12px 16px;
}
.debug h3 { margin: 0 0 6px 0; font-size: 14px; color: #8ea2d9; }
.debug ul { margin: 0; padding-left: 18px; font-size: 13px; color: #c9d2ff; }
</style>
