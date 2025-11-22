<template>
  <div :class="['summary-card', variantClass]">
    <div class="summary-card__icon">
      <i :class="icon"></i>
    </div>
    <div class="summary-card__content">
      <small>{{ label }}</small>
      <strong>{{ value }}</strong>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{
  icon: string
  label: string
  value: string | number
  description?: string
  variant?: 'primary' | 'success' | 'warning' | 'info'
}>()

const variantClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'summary-card--success'
    case 'warning':
      return 'summary-card--warning'
    case 'info':
      return 'summary-card--info'
    default:
      return 'summary-card--primary'
  }
})
</script>

<style scoped>
.summary-card {
  position: relative;
  border-radius: 1rem;
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
  border: 1px solid transparent;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

.summary-card__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.summary-card__content {
  display: flex;
  flex-direction: column;

}

.summary-card__content small {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary-card__content strong {
  font-size: 1rem;
  font-weight: 500;
}

.summary-card__content p {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.summary-card--primary {
  background: linear-gradient(135deg, #eff6ff, #eef2ff);
  border-color: #c7d2fe;
}

.summary-card--primary .summary-card__icon {
  background: #dbeafe;
  color: #2563eb;
}

.summary-card--success {
  background: linear-gradient(135deg, #ecfccb, #d1fae5);
  border-color: #bbf7d0;
}

.summary-card--success .summary-card__icon {
  background: #bbf7d0;
  color: #16a34a;
}

.summary-card--warning {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fcd34d;
}

.summary-card--warning .summary-card__icon {
  background: #fde68a;
  color: #d97706;
}

.summary-card--info {
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
  border-color: #7dd3fc;
}

.summary-card--info .summary-card__icon {
  background: #bae6fd;
  color: #0284c7;
}
</style>

