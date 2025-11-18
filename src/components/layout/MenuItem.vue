<template>
  <button
    @click="$emit('click')"
    :class="[
      'w-full flex items-center space-x-3 px-3 py-1.5 text-sm rounded-full transition-all duration-200 group',
      active && !submenu && 'bg-blue-400  ',
      submenu ? 'ml-2 text-sm py-2' : '',
    ]"
  >
    <i
      :class="[
        icon,
        'text-sm ',
        active && submenu && '!text-blue-600',
        active && !submenu ? 'text-white ' : 'text-gray-600 group-hover:text-black',
      ]"
    ></i>
    <span
      class="flex-1 text-left font-[500]!"
      :class="[
        active && submenu && '!text-blue-600 font-[500]!',
        active && !submenu ? 'text-white ' : 'text-gray-600 group-hover:text-black',
      ]"
      >{{ label }}</span
    >
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
