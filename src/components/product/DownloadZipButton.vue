<script setup lang="ts">
import { ref } from 'vue'
import { Button } from 'primevue'
import type { IProduct } from '../../stores/product/product'
import JSZip from 'jszip'

// Props
const props = defineProps<{
  selectedMediaItems: Array<{
    url: string
    type: 'image' | 'certificate' | 'video'
    filename: string
  }>
  selectedProduct: IProduct | null
}>()

// State
const isDownloadingZip = ref(false)

// Function
const downloadAllAsZip = async () => {
  if (props.selectedMediaItems.length === 0 || isDownloadingZip.value || !props.selectedProduct)
    return

  isDownloadingZip.value = true

  try {
    const zip = new JSZip()

    const downloadPromises = props.selectedMediaItems.map(async (item, index) => {
      try {
        // สำหรับ Firebase URLs ใช้ fetch พร้อม error handling
        const response = await fetch(item.url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const blob = await response.blob()

        let filename = item.filename
        if (!filename) {
          const ext = item.type === 'video' ? 'mp4' : item.type === 'certificate' ? 'pdf' : 'jpg'
          filename = `${item.type}-${index + 1}.${ext}`
        }

        zip.file(filename, blob)
      } catch (error) {
        console.error(`Failed to download ${item.filename}:`, error)

        // ถ้าเป็นวิดีโอที่ดาวน์โหลดไม่ได้ ให้ดาวน์โหลดแยก
        if (item.type === 'video') {
          console.log('Downloading video separately...')
          const link = document.createElement('a')
          link.href = item.url
          link.download = item.filename || 'video.mp4'
          link.target = '_blank'
          link.click()
        }
      }
    })

    await Promise.all(downloadPromises)

    // สร้างชื่อไฟล์ ZIP
    const productName = props.selectedProduct.species
      ? props.selectedProduct.species?.name
      : props.selectedProduct.name
    const productSku = props.selectedProduct.sku || 'unknown'
    const pondName = props.selectedProduct.fishpond?.name || 'pond'
    const weightName = props.selectedProduct.weight || 'unknown'
    const safeName = `${productName}-${productSku}-${pondName}-${weightName}`.replace(
      /[<>:"/\\|?*]/g,
      '-'
    )

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `${safeName}.zip`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('Error creating ZIP:', error)
    alert('เกิดข้อผิดพลาดในการดาวน์โหลด')
  } finally {
    isDownloadingZip.value = false
  }
}
</script>

<template>
  <Button
    label="ดาวน์โหลดทั้งหมด (ZIP)"
    icon="pi pi-download"
    severity="success"
    @click="downloadAllAsZip"
    size="small"
    :loading="isDownloadingZip"
    :disabled="isDownloadingZip || selectedMediaItems.length === 0"
  />
</template>

