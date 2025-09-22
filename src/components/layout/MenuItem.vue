<template>
  <button
    @click="$emit('click')"
    :class="[
      'w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
      active
        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      submenu ? 'ml-6 text-xs py-2' : '',
    ]"
  >
    <i :class="[icon, 'text-sm', active ? 'text-blue-600' : 'text-gray-500']"></i>
    <span class="flex-1 text-left">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineOptions({
  name: 'AppMenuItem',
})

interface Props {
  icon: string
  label: string
  active?: boolean
  submenu?: boolean
}

defineProps<Props>()

defineEmits<{
  click: []
}>()
</script>
