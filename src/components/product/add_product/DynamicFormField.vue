<script setup lang="ts">
import type { IFields, IFieldsKey } from '@/stores/product/product';
import { InputText, InputNumber, Select, Textarea, DatePicker  } from 'primevue'

const props = defineProps<{
  fields: IFields[]
  formData: Record<IFieldsKey, string | number | Date | null>
  isSubmitting: boolean
  speciesOptions?: { label: string; value: string }[]
}>()


const emit = defineEmits<{
  'update-field': [key: IFieldsKey, value: string | number | Date | null]
}>()

const updateField = (key: IFieldsKey, value: string | number | Date | null) => {
  emit('update-field', key, value)
}

const getSelectOptions = (fieldKey: IFieldsKey, speciesOptions?: { label: string; value: string }[]) => {
  if (fieldKey === 'gender') {
    return [
      { label: 'ตัวผู้', value: 1 },
      { label: 'ตัวเมีย', value: 0 },
    ]
  }

  if (fieldKey === 'species' && speciesOptions) {
    return speciesOptions
  }

  return []
}


</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="field in fields"
        :key="field.key"
        :class="field.type === 'textarea' ? 'md:col-span-2' : ''"
      >
        <label class="text-sm font-medium text-gray-700 mb-1 block">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500 ml-1">*</span>
        </label>

        <!-- Text Input -->
        <InputText
          v-if="field.type === 'text'"
          :model-value="(formData[field.key] as string | null)"
          @update:model-value="updateField(field.key, $event as string | number | Date | null)"
          :placeholder="`กรอก${field.label}`"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Number Input -->
        <InputNumber
          v-else-if="field.type === 'number'"
          :model-value="(formData[field.key] as number | null)"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          :min="0"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Select Input -->
        <Select
          v-else-if="field.type === 'select'"
          :model-value="formData[field.key]"
          @update:model-value="updateField(field.key, $event)"
          :options="getSelectOptions(field.key, speciesOptions)"
          optionLabel="label"
          optionValue="value"
          :placeholder="`เลือก${field.label}`"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Textarea -->
        <Textarea
          v-else-if="field.type === 'textarea'"
          :model-value="(formData[field.key] as string | null)"
          @update:model-value="updateField(field.key, $event)"
          :placeholder="`กรอก${field.label}`"
          rows="3"
          fluid
          size="small"
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <!-- Date Input -->
        <DatePicker
          v-else-if="field.type === 'date'"
          :model-value="(formData[field.key] as Date | null)"
          @update:model-value="updateField(field.key, $event as string | number | Date | null)"
          showIcon
          iconDisplay="input"
          placeholder="เลือกวันที่"
          dateFormat="dd/mm/yy"
          size="small"
          fluid
          :invalid="field.required && !formData[field.key] && isSubmitting"
        />

        <small
          v-if="field.required && !formData[field.key] && isSubmitting"
          class="text-red-500 text-xs mt-1"
        >
          กรุณากรอก{{ field.label }}
        </small>

      </div>
    </div>
  </div>
</template>


