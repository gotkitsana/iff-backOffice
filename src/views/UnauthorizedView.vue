<template>
  <div class="flex items-center justify-center h-screen bg-blue-100">
    <div class="rounded-lg p-8 mb-4 w-full">
      <h2 class="text-center text-2xl md:text-3xl font-bold pb-4">ไม่ได้รับอนุญาต</h2>
      <p class="text-center text-gray-800 text-lg md:text-xl">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </p>

      <div class="pt-6 flex justify-center">
        <router-link to="/" class="text-blue-500 hover:underline md:text-lg">
          กลับไปยังหน้าแรก
        </router-link>
      </div>
    </div>
  </div>
</template>
