<template>
  <div class="action-required" v-if="pendingActions.length > 0">
    <div class="action-required__header">
      <div class="action-required__icon">
        <i class="pi pi-exclamation-triangle"></i>
      </div>
      <div>
        <h4>สิ่งที่ต้องทำ</h4>
        <p>โปรดดำเนินการตามขั้นตอนด้านล่างเพื่อให้การเปลี่ยนสถานะสมบูรณ์</p>
      </div>
    </div>

    <div class="action-required__list">
      <div
        v-for="action in pendingActions"
        :key="action.key"
        :class="[
          'action-required__item',
          action.type === 'required' ? 'action-required__item--required' : '',
        ]"
      >
        <div class="action-required__item-icon">
          <i :class="action.icon"></i>
        </div>
        <div class="action-required__item-content">
          <div class="action-required__item-header">
            <span>{{ action.title }}</span>
            <Tag :value="action.tagLabel" :severity="action.tagSeverity" size="small" />
          </div>
          <p>{{ action.description }}</p>
        </div>
        <div class="action-required__item-status">
          <i v-if="action.completed" class="pi pi-check-circle text-green-500 text-xl"></i>
          <i v-else class="pi pi-clock text-yellow-500 text-xl"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Tag } from 'primevue'

const props = defineProps<{
  showSlipUpload: boolean
  showShippingSlipUpload: boolean
  hasSlip: boolean
  hasShippingSlip: boolean
  requireShippingSlipUpload?: boolean
  skipShippingSlipUpload?: boolean
}>()

const pendingActions = computed(() => {
  const items: Array<{
    key: string
    title: string
    description: string
    icon: string
    completed: boolean
    type: 'required' | 'optional'
    tagLabel: string
    tagSeverity: 'danger' | 'warn' | 'info'
  }> = []

  if (props.showSlipUpload) {
    items.push({
      key: 'payment-slip',
      title: 'อัปโหลดสลิปการโอนเงิน',
      description: 'จำเป็นต้องยืนยันการชำระเงินก่อนดำเนินการขั้นตอนต่อไป',
      icon: 'pi pi-upload',
      completed: props.hasSlip,
      type: 'required',
      tagLabel: props.hasSlip ? 'เสร็จสิ้น' : 'จำเป็น',
      tagSeverity: props.hasSlip ? 'info' : 'danger',
    })
  }

  if (props.showShippingSlipUpload) {
    const skipped = props.skipShippingSlipUpload
    const required = props.requireShippingSlipUpload && !skipped
    items.push({
      key: 'shipping-slip',
      title: 'อัปโหลดใบเสร็จการขนส่ง',
      description: skipped
        ? 'เลือกข้ามการอัปโหลดแล้ว สามารถดำเนินการต่อได้'
        : 'ยืนยันการส่งสินค้าโดยอัปโหลดหลักฐานจากขนส่ง',
      icon: 'pi pi-truck',
      completed: props.hasShippingSlip || !!skipped,
      type: required ? 'required' : 'optional',
      tagLabel: props.hasShippingSlip || skipped ? 'เสร็จสิ้น' : required ? 'จำเป็น' : 'ตัวเลือก',
      tagSeverity: props.hasShippingSlip || skipped ? 'info' : required ? 'danger' : 'warn',
    })
  }

  return items.filter((item) => !item.completed || item.type === 'required')
})
</script>

<style scoped>
.action-required {
  background: linear-gradient(120deg, #eef2ff, #e0f2fe);
  border: 1px solid #c7d2fe;
  border-radius: 1.25rem;
  padding: 1.25rem;
  box-shadow: 0 15px 35px rgba(59, 130, 246, 0.12);
}

.action-required__header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.action-required__icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.9rem;
  background: #1d4ed8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: 0 10px 25px rgba(29, 78, 216, 0.35);
}

.action-required__header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.action-required__header p {
  margin: 0;
  font-size: 0.85rem;
  color: #4b5563;
}

.action-required__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-required__item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  background: white;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

.action-required__item--required {
  border-color: #f87171;
  box-shadow: 0 6px 20px rgba(248, 113, 113, 0.15);
}

.action-required__item-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.action-required__item-content {
  flex: 1;
}

.action-required__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.35rem;
}

.action-required__item-content p {
  margin: 0;
  font-size: 0.85rem;
  color: #4b5563;
}

.action-required__item-status {
  min-width: 2rem;
  display: flex;
  justify-content: center;
}
</style>

