<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, Button, RadioButton } from 'primevue'
import type { IProduct } from '@/stores/product/product'
import { getProductImageUrl } from '@/utils/imageUrl'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import icon from '@/assets/images/icon/icon.png'

const props = defineProps<{
  visible: boolean
  selectedProducts: IProduct[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
}>()

const layout = ref<'9' | '16'>('9')
const isGenerating = ref(false)
const printAreaRef = ref<HTMLElement | null>(null)

const itemsPerPage = computed(() => parseInt(layout.value))

const pages = computed(() => {
  const chunks = []
  for (let i = 0; i < props.selectedProducts.length; i += itemsPerPage.value) {
    chunks.push(props.selectedProducts.slice(i, i + itemsPerPage.value))
  }
  return chunks
})

const getImageUrl = (image: any) => {
  if (!image) return ''
  return getProductImageUrl(image?.filename)
}

const generatePDF = async () => {
  if (!printAreaRef.value) return
  isGenerating.value = true

  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pagesElements = printAreaRef.value.querySelectorAll('.print-page')

    for (let i = 0; i < pagesElements.length; i++) {
      if (i > 0) pdf.addPage()

      const canvas = await html2canvas(pagesElements[i] as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    }

    pdf.save('fish-catalog.pdf')
  } catch (error) {
    console.error('Error generating PDF:', error)
  } finally {
    isGenerating.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="พิมพ์แคตตาล็อกปลา"
    :style="{ width: '90vw', maxWidth: '1000px' }" :breakpoints="{ '960px': '95vw' }" :maximizable="true">
    <div class="flex flex-col gap-4 h-full">
      <!-- Controls -->
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-center gap-4">
          <span class="font-medium text-gray-700">รูปแบบการจัดวาง:</span>
          <div class="flex items-center gap-2">
            <RadioButton v-model="layout" inputId="layout9" name="layout" value="9" />
            <label for="layout9" class="cursor-pointer">9 ตัว/หน้า (3x3)</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="layout" inputId="layout16" name="layout" value="16" />
            <label for="layout16" class="cursor-pointer">16 ตัว/หน้า (4x4)</label>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          จำนวนปลาที่เลือก: {{ selectedProducts.length }} ตัว ({{ pages.length }} หน้า)
        </div>
      </div>
      <!-- Preview Area -->
      <div class="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
        <div ref="printAreaRef" class="flex flex-col gap-8">
          <div v-for="(page, pageIndex) in pages" :key="pageIndex" class="print-page bg-white shadow-lg relative"
            :style="{
              width: '210mm',
              height: '297mm',
              padding: '10mm',
              boxSizing: 'border-box'
            }">
            <div class="grid"
              :class="layout === '9' ? 'grid-cols-3 grid-rows-3 gap-4' : 'grid-cols-4 grid-rows-4 gap-4'">
              <div v-for="(product, index) in page" :key="product._id"
                class="relative flex flex-col items-center justify-center overflow-hidden">
                <!-- Main Image -->
                <div class="w-full h-full flex items-center justify-center">
                  <img v-if="product.images && product.images.length > 0" :src="getImageUrl(product.images[0])"
                    class="max-w-full max-h-full object-contain drop-shadow-lg" crossorigin="anonymous" />
                  <div v-else class="text-white/50 text-xs">No Image</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button label="ยกเลิก" icon="pi pi-times" severity="secondary" @click="handleClose" />
        <Button label="ดาวน์โหลด PDF" icon="pi pi-download" severity="primary" @click="generatePDF"
          :loading="isGenerating" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.writing-vertical-lr {
  writing-mode: vertical-lr;
  text-orientation: mixed;
}
</style>
