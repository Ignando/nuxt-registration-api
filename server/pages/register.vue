<script setup lang="ts">
import { ref, onMounted } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const users = ref<{name:string; email:string}[]>([])
const message = ref<string | null>(null)
const errors = ref<Record<string, string> | null>(null)

async function register() {
  message.value = null
  errors.value = null
  try {
    const res = await $fetch('/api/register', {
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value }
    })
    message.value = (res as any).message
    await loadUsers()
  } catch (e: any) {
    // Nitro returns 200 even on validation in our simple handler; adjust if you throw errors
    const data = e?.data ?? e
    message.value = data?.message ?? 'Registration failed'
    errors.value = data?.errors ?? null
  }
}

async function loadUsers() {
  users.value = await $fetch('/api/users')
}

onMounted(loadUsers)
</script>

<template>
  <main class="mx-auto max-w-lg p-6 space-y-6">
    <h1 class="text-2xl font-semibold">Nuxt 3 Registration Demo</h1>

    <form class="space-y-3" @submit.prevent="register">
      <input v-model="name" placeholder="Name" class="w-full border p-2 rounded" />
      <input v-model="email" placeholder="Email" class="w-full border p-2 rounded" />
      <input v-model="password" type="password" placeholder="Password" class="w-full border p-2 rounded" />
      <button class="px-4 py-2 rounded border">Register</button>
    </form>

    <div v-if="message" class="text-sm">{{ message }}</div>
    <ul v-if="errors" class="text-sm text-red-600 list-disc pl-5">
      <li v-for="(v,k) in errors" :key="k">{{ k }}: {{ v }}</li>
    </ul>

    <section>
      <h2 class="text-xl font-medium mb-2">Users</h2>
      <ul class="space-y-1">
        <li v-for="u in users" :key="u.email" class="text-sm">
          {{ u.name }} — {{ u.email }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style>
/* keep it minimal; Tailwind optional */
</style>
