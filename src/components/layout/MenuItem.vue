<template>
  <button
    @click="$emit('click')"
    :class="[
      'w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
      active
        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
        : 'text-gray-700 hover:bg-gray-100',
      submenu ? 'ml-6 text-xs' : '',
    ]"
  >
    <i :class="[icon, 'text-gray-500', active ? 'text-blue-600' : '']"></i>
    <span>{{ label }}</span>
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
