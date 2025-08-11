<script setup lang="ts">
import { ref, onMounted } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const users = ref<any[]>([])

async function register() {
  await $fetch('/api/register', {
    method: 'POST',
    body: { name: name.value, email: email.value, password: password.value }
  })
  await loadUsers()
}

async function loadUsers() {
  users.value = await $fetch('/api/users')
}

onMounted(loadUsers)
</script>

<template>
  <main class="p-6 max-w-md mx-auto space-y-4">
    <h1 class="text-2xl font-bold">Nuxt 3 Registration API</h1>

    <form @submit.prevent="register" class="space-y-2">
      <input v-model="name" placeholder="Name" class="border p-2 w-full" />
      <input v-model="email" placeholder="Email" class="border p-2 w-full" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 w-full" />
      <button class="bg-green-500 text-white px-4 py-2 rounded">Register</button>
    </form>

    <div>
      <h2 class="text-lg font-semibold mt-4">Users:</h2>
      <ul>
        <li v-for="u in users" :key="u.email">{{ u.name }} — {{ u.email }}</li>
      </ul>
    </div>
  </main>
</template>
