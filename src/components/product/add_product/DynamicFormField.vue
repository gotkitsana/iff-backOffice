<!-- DynamicFormFields.vue -->
<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="field.type === 'textarea' ? 'md:col-span-2' : ''"
      >
        <label class="text-sm font-medium text-gray-700 mb-2 block">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- Text Input -->
        <InputText
          v-if="field.type === 'text'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key]"
        />

        <!-- Number Input -->
        <InputNumber
          v-else-if="field.type === 'number'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          :min="0"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key]"
        />

        <!-- Select Input -->
        <Select
          v-else-if="field.type === 'select'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :options="getSelectOptions(field.key)"
          optionLabel="label"
          optionValue="value"
          :placeholder="`เลือก${field.label}`"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key]"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="field.type === 'textarea'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          rows="3"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key]"
        />

        <!-- Date Input -->
        <InputText
          v-else-if="field.type === 'date'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          type="date"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InputText, InputNumber, Select, Textarea } from 'primevue'

defineProps<{
  fields: any[]
  formData: Record<string, any>
}>()

const emit = defineEmits<{
  'update-field': [key: string, value: any]
}>()

const updateField = (key: string, value: any) => {
  emit('update-field', key, value)
}

const getSelectOptions = (fieldKey: string) => {
  if (fieldKey === 'gender') {
    return [
      { label: 'ตัวผู้', value: 1 },
      { label: 'ตัวเมีย', value: 0 },
    ]
  }
  return []
}
</script>
