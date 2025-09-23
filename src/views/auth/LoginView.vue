<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore, type ILoginPayload } from '@/stores/auth'
import { toast } from 'vue3-toastify'
import { useMutation } from '@tanstack/vue-query'


const username = ref('')
const password = ref('')

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isSubmitting = ref(false)
const handleLogin = () => {
  isSubmitting.value = true
  if(!username.value || !password.value) {
    toast.error('กรุณากรอกข้อมูลให้ครบ')
    return
  }

  if (username.value && password.value) {
    mutate({ username: username.value, password: password.value })
  }
}

const { isPending, mutate } = useMutation({
  mutationFn: (payload: ILoginPayload) => authStore.login(payload),
  onSuccess: (data: any) => {
    console.log(data)
    if (data.data.accessToken) {
      if (route.query.redirect) {
        router.push(route.query.redirect.toString())
      } else {
        router.push('/')
      }
      username.value = ''
      password.value = ''
      isSubmitting.value = false
    }
  },
})
</script>


<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
  >
    <!-- Login Card -->
    <div class="w-full max-w-lg">
      <!-- Logo Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-24 h-24 bg-blue-400 rounded-xl mb-6 shadow-lg logo-float p-3"
        >
          <img src="@/assets/images/icon/icon.png" alt="IFF ERP" />
        </div>
        <h1 class="text-3xl font-bold! text-gray-900">เข้าสู่ระบบ IFF Back Office</h1>
      </div>

      <!-- Login Form Card -->
      <Card class="shadow-xl border-0 p-4">
        <template #content>
          <div class="space-y-4">
            <!-- Username Field -->
            <div class="space-y-1">
              <label for="username" class="block text-lg font-[500]! text-gray-700">
                ชื่อผู้ใช้
              </label>
              <div class="relative">
                <InputText
                  id="username"
                  v-model="username"
                  placeholder="กรุณาใส่ชื่อผู้ใช้"
                  :invalid="!username && isSubmitting"
                  fluid
                />
              </div>
              <small v-if="!username && isSubmitting" class="text-red-500">กรุณาระบุชื่อผู้ใช้</small>
            </div>

            <!-- Password Field -->
            <div class="space-y-1 pb-4">
              <label for="password" class="block text-lg font-[500]! text-gray-700">
                รหัสผ่าน
              </label>
              <div class="relative">
                <Password
                  id="password"
                  v-model="password"
                  placeholder="กรุณาใส่รหัสผ่าน"
                  :feedback="false"
                  :invalid="!password && isSubmitting"
                  toggleMask
                  fluid
                />
              </div>
              <small v-if="!password && isSubmitting" class="text-red-500">กรุณาระบุรหัสผ่าน</small>
            </div>

            <!-- Login Button -->
            <Button
              type="submit"
              label="เข้าสู่ระบบ"
              icon="pi pi-sign-in"
              class="login-button"
              :loading="isPending"
              @click="handleLogin"
              fluid
            />

          </div>
        </template>
      </Card>

      <!-- Footer -->
      <div class="text-center mt-8  text-gray-500 ">
        <p class="font-[500]!">&copy; 2025 Inter Fish Farm. All rights reserved.</p>
      </div>
    </div>

    <!-- Background Pattern -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full opacity-20 bg-pattern"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full opacity-20 bg-pattern"
        style="animation-delay: -10s"
      ></div>
    </div>
  </div>
</template>

