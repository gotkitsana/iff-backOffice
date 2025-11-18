<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, Tag, Button } from 'primevue'
import { useSalesStore } from '../../../stores/sales/sales'
import type { ISales } from '../../../types/sales'
import { convertStatusNumberToString } from '../../../types/sales'
import dayjs from 'dayjs'
import { useMemberStore, type IMember } from '../../../stores/member/member'
import { useQuery } from '@tanstack/vue-query'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import type { IAdmin } from '@/stores/admin/admin'
import { useAdminStore } from '../../../stores/admin/admin'
import { useProductStore, type IProduct } from '@/stores/product/product'
import logoIcon from '@/assets/images/icon/icon.png'
import jsPDF from 'jspdf'
import BankData from '@/config/BankData'
// Props
const props = defineProps<{
  visible: boolean
  saleData: ISales
}>()

// Emits
const emit = defineEmits<{
  'close-detail-modal': []
}>()

const salesStore = useSalesStore()
const memberStore = useMemberStore()

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(Math.round(value))
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

const formatDateForInvoice = (date: Date) => {
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Computed properties
const currentStatusInfo = computed(() => {
  const statusString =
    typeof props.saleData.sellingStatus === 'number'
      ? convertStatusNumberToString(props.saleData.sellingStatus)
      : props.saleData.sellingStatus
  return salesStore.statusWorkflow[statusString as keyof typeof salesStore.statusWorkflow]
})

const totalAmount = computed(() => {
  return props.saleData.products
    ? props.saleData.products.reduce((total, product) => {
        return total + (product.price || 0) * (product.quantity || 1)
      }, 0)
    : 0
})

const finalAmount = computed(() => {
  return (
    (totalAmount.value || 0) - (props.saleData.discount || 0) - (props.saleData.deliveryNo || 0)
  )
})

const paymentMethodLabel = computed(() => {
  const methods = {
    cash: 'เงินสด',
    transfer: 'โอนเงิน',
    credit: 'เครดิต',
    promptpay: 'พร้อมเพย์',
    other: 'อื่นๆ',
  }
  return methods[props.saleData.payment] || 'ไม่ระบุ'
})

// Handlers
const handleClose = () => {
  emit('close-detail-modal')
}

const handlePrintInvoice = () => {
  // สร้างหน้าต่างใหม่สำหรับพิมพ์
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const invoiceContent = generateInvoiceHTML()
  printWindow.document.write(invoiceContent)
  printWindow.document.close()
  printWindow.print()
}

const handleDownloadPDF = async () => {
  try {
    const invoiceContent = generateInvoiceHTML()

    // สร้าง iframe แบบซ่อนเพื่อ render HTML
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    iframe.style.border = 'none'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      throw new Error('Cannot access iframe document')
    }

    // เขียน HTML ลงใน iframe
    iframeDoc.open()
    iframeDoc.write(invoiceContent)
    iframeDoc.close()

    // รอให้ content และ images โหลดเสร็จ
    await new Promise((resolve) => {
      iframe.onload = resolve
      setTimeout(resolve, 1000) // รอให้ images โหลด
    })

    // รอให้ images โหลดเสร็จ
    const images = iframeDoc.querySelectorAll('img')
    const imagePromises = Array.from(images).map((img) => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true)
        } else {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(true) // continue even if image fails
          setTimeout(() => resolve(true), 2000) // timeout after 2s
        }
      })
    })
    await Promise.all(imagePromises)

    // ใช้ html2canvas ถ้ามี หรือใช้ jsPDF html() method
    try {
      // Dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 800,
        height: iframeDoc.body.scrollHeight,
      })

      // สร้าง PDF จาก canvas
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // ดาวน์โหลด PDF
      pdf.save(`Invoice-${props.saleData.item}.pdf`)

      // Cleanup
      document.body.removeChild(iframe)
    } catch {
      // Fallback: ใช้ jsPDF html() method ถ้า html2canvas ไม่มี
      const pdf = new jsPDF('p', 'mm', 'a4')
      await pdf.html(iframeDoc.body, {
        callback: (doc) => {
          doc.save(`Invoice-${props.saleData.item}.pdf`)
          document.body.removeChild(iframe)
        },
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 800,
        html2canvas: {
          scale: 0.5,
          useCORS: true,
        },
      })
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback: เปิดหน้าต่างใหม่แล้วให้ user print manually
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const invoiceContent = generateInvoiceHTML()
      printWindow.document.write(invoiceContent)
      printWindow.document.close()
      printWindow.print()
    }
  }
}

const { data: members } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})
const findMemberData = (id: string) => {
  if (!members.value) return null
  return members.value.find((member) => member._id === id)
}

const generateInvoiceHTML = () => {
  const currentDate = formatDateForInvoice(new Date())
  // ใช้ logo ที่ import มา (Vite จะแปลงเป็น URL)
  const logoPath = logoIcon

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบแจ้งหนี้ - ${props.saleData.item}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Sarabun', sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          font-size: 14px;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #007bff;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-img {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-text .company-name-en {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }
        .logo-text .company-name-th {
          font-size: 12px;
          color: #666;
        }
        .invoice-title {
          background: #e3f2fd;
          padding: 8px 16px;
          border-radius: 4px;
          text-align: center;
          font-weight: 600;
          color: #1976d2;
          font-size: 16px;
          margin: 0 auto;
        }
        .invoice-info {
          text-align: right;
          font-size: 13px;
        }
        .invoice-info .company-name {
          font-weight: 600;
          margin-bottom: 3px;
        }
        .invoice-info .company-name-en {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
        }
        .invoice-info .invoice-number {
          margin-top: 10px;
          font-size: 13px;
        }
        .invoice-info .invoice-date {
          font-size: 13px;
        }
        .customer-section {
          margin-bottom: 20px;
          background: #f8f9fa;
          padding: 12px 15px;
          border-radius: 4px;
        }
        .customer-title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
          font-size: 14px;
        }
        .customer-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 15px;
          font-size: 13px;
        }
        .customer-details div {
          color: #555;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .items-table th,
        .items-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .items-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }
        .items-table .text-center {
          text-align: center;
        }
         .items-table .text-right {
           text-align: right;
         }
         .product-detail {
           line-height: 1.6;
         }
         .product-name {
           font-weight: 600;
           color: #333;
           margin-bottom: 4px;
           font-size: 14px;
         }
         .product-info {
           font-size: 12px;
           color: #666;
           margin-top: 4px;
           line-height: 1.5;
         }
         .product-info-item {
           display: inline-block;
           margin-right: 12px;
           margin-bottom: 2px;
         }
         .product-info-label {
           color: #888;
           margin-right: 4px;
         }
         .product-info-value {
           color: #333;
           font-weight: 500;
         }
         .summary-section {
          text-align: right;
          font-size: 14px;
          width: 240px;
          margin-left: auto;
          padding: 12px;
          background: #fff;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          padding: 0 5px;
        }
        .summary-row.deposit-row {
          margin-bottom: 5px;
        }
        .summary-total {
          font-weight: 600;
          font-size: 16px;
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .footer {
          margin-top: 20px;
        }
        .footer-notes {
          margin-bottom: 25px;
          font-size: 13px;
          font-weight: 600;
        }
        .signature-section {
          display: flex;
          justify-content: space-around;
          margin-top: 20px;
          align-items: flex-end;
        }
        .signature-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 200px;
        }
        .signature-line {
          border-bottom: 1px dotted #333;
          width: 100%;
          height: 20px;
          margin-bottom: 5px;
        }
        .signature-label {
          font-weight: 600;
          color: #333;
          font-size: 13px;
          margin-top: 5px;
        }
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
          .invoice-container {
            border: none;
            padding: 0;
          }
        }
        .product-image {
          width: auto;
          height: 40px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <img src="${logoPath}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
            <div class="logo-text">
              <div class="company-name-en">INTER FISH FARM</div>
              <div class="company-name-th">อินเตอร์ ฟิชฟาร์ม</div>
            </div>
          </div>
          <div class="invoice-title">INVOICE/ใบแจ้งหนี้</div>
          <div class="invoice-info">
            <div class="company-name">ห้างหุ้นส่วนจำกัด อินเตอร์ ฟิช ฟาร์ม</div>
            <div class="company-name-en">Inter Fish Farm Part., Ltd (HEAD OFFICE)</div>
            <div class="invoice-number">รหัสใบแจ้งหนี้: <strong>${
              props.saleData.item
            }</strong></div>
            <div class="invoice-date">วันที่ออกใบแจ้งหนี้: <strong>${currentDate}</strong></div>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="customer-section">
          <div class="customer-title">ข้อมูลลูกค้า</div>
          <div class="customer-details">
            <div><strong>ชื่อลูกค้า:</strong> ${
              findMemberData(props.saleData.user)?.name ||
              findMemberData(props.saleData.user)?.displayName ||
              '-'
            }</div>
            <div><strong>ที่อยู่:</strong> ${props.saleData?.shippingAddress || '-'}, ${
    memberStore.provinceOptions.find((option) => option.value === props.saleData?.shippingProvince)
      ?.label || '-'
  }</div>

            <div><strong>เลขประจำตัวผู้เสียภาษี / Tax ID.:</strong> -</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px;">ลำดับที่</th>
              <th style="text-align: center; width: 80px;">รูปสินค้า</th>
              <th>รายการ</th>
              <th class="text-center" style="width: 80px;">จำนวน</th>
              <th class="text-right" style="width: 120px;">ราคา/หน่วย</th>
              <th class="text-right" style="width: 120px;">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${props.saleData.products
              ?.map((product, index) => {
                const productImage = getProductImage(product.id)
                const productData = products.value?.find((p) => p._id === product.id)
                const category = handleFindCategory(product.category)
                const isFish = category?.value === 'fish'
                const isFood = category?.value === 'food'
                const isMicroorganism = category?.value === 'microorganism'

                // สร้างรายละเอียดสินค้า
                const productDetails: string[] = []

                if (isFish && productData) {
                  // สำหรับปลา: แสดง สายพันธุ์, น้ำหนัก, ขนาด, อายุ
                  if (productData.species?.name) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">สายพันธุ์:</span><span class="product-info-value">${productData.species.name}</span></span>`
                    )
                  }
                  if (productData.weight) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">น้ำหนัก:</span><span class="product-info-value">${productData.weight} กก.</span></span>`
                    )
                  }
                  if (productData.size) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">ขนาด:</span><span class="product-info-value">${productData.size} ซม.</span></span>`
                    )
                  }
                  if (productData.age) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">อายุ:</span><span class="product-info-value">${productData.age.toUpperCase()}</span></span>`
                    )
                  }
                }
                if (productData && isFood) {
                  // สำหรับสินค้าอื่นๆ: แสดง รหัส, หมวดหมู่, ยี่ห้อ, ประเภทอาหาร (ถ้ามี)
                  if (productData.sku) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">รหัส:</span><span class="product-info-value">${productData.sku}</span></span>`
                    )
                  }
                  if (category?.name) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">หมวดหมู่:</span><span class="product-info-value">${category.name}</span></span>`
                    )
                  }
                  if (productData.brand?.name) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">ยี่ห้อ:</span><span class="product-info-value">${productData.brand.name}</span></span>`
                    )
                  }
                  if (productData.foodtype?.name) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">ประเภท:</span><span class="product-info-value">${productData.foodtype.name}</span></span>`
                    )
                  }
                  if (productData.seedType) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">ชนิดเม็ด:</span><span class="product-info-value">${productData.seedType}</span></span>`
                    )
                  }
                  if (productData.seedSize) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">ขนาดเม็ด:</span><span class="product-info-value">${productData.seedSize.name}</span></span>`
                    )
                  }
                }
                if (isMicroorganism && productData) {
                  // ถ้าไม่พบข้อมูล product ให้แสดงรหัสจาก products array
                  const sku = products.value?.find((p) => p._id === product.id)?.sku
                  if (sku) {
                    productDetails.push(
                      `<span class="product-info-item"><span class="product-info-label">รหัส:</span><span class="product-info-value">${sku}</span></span>`
                    )
                  }
                }

                const unit = product.retailID ? 'กก.' : 'กระสอบ'

                return `
              <tr>
                <td>${index + 1}</td>
                <td style="text-align: center;">
                 ${
                   productImage
                     ? `<img src="${productImage}" alt="product image" class="product-image">`
                     : ``
                 }
                </td>
                <td>
                  <div class="product-detail">

                    ${
                      productDetails.length > 0
                        ? `<div class="product-info">${productDetails.join('')}</div>`
                        : ''
                    }
                  </div>
                </td>
                <td class="text-center">${product.quantity || 1} ${unit}</td>
                <td class="text-right">${formatCurrency(product.price || 0)}</td>
                <td class="text-right">${formatCurrency(
                  (product.price || 0) * (product.quantity || 1)
                )}</td>
              </tr>
            `
              })
              .join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display: grid; grid-template-columns: 1fr 240px;">
        <div style="padding-top: 10px;">
          <strong >หมายเหตุ: เงื่อนไขการสั่งซื้อและชำระเงิน</strong>
        </div>
        <div class="summary-section">
          <div class="summary-row">
            <span>ยอดรวม:</span>
            <span>${formatCurrency(totalAmount.value)}</span>
          </div>
          <div class="summary-row deposit-row">
            <span>มัดจำ:</span>
            <span> ${formatCurrency(props.saleData.deposit || 0)}</span>
          </div>
          <div class="summary-row">
            <span>ค่าส่ง:</span>
            <span>${formatCurrency(props.saleData?.deliveryNo || 0)}</span>
          </div>
          <div class="summary-row">
            <span>ส่วนลด:</span>
            <span>${formatCurrency(props.saleData.discount || 0)}</span>
          </div>
          <div class="summary-row" style="font-weight: 600;margin-bottom: 0px;">
            <span>จำนวนเงินรวมทั้งสิ้น:</span>
            <span>${formatCurrency(finalAmount.value)}</span>
          </div>
        </div>

        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div >(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
              <div class="signature-label">ผู้รับสินค้า</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div >(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
              <div class="signature-label">ผู้ชำระเงิน</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div >(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
              <div class="signature-label">ผู้รับเงิน</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

const findMemberStatusTag = (status: string) => {
  return memberStore.memberStatusOptions.find((option) => option.value === status)
}
const findMemberStatusSeverity = (status: string) => {
  return memberStore.getStatusTag(status)
}
const categoryStore = useCategoryStore()
const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})
const handleFindCategory = (id: string | null | undefined): ICategory | undefined => {
  if (!id) return undefined
  return categories.value?.find((category) => category._id === id)
}

const adminStore = useAdminStore()
const { data: admins } = useQuery<IAdmin[]>({
  queryKey: ['get_admins'],
  queryFn: () => adminStore.onGetAdmins(),
})
const handleFindAdmin = (id: string): IAdmin | undefined => {
  if (!id) return undefined
  return admins.value?.find((admin) => admin._id === id)
}

const productStore = useProductStore()
const { data: products } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})
const getProductImage = (productId: string): string | undefined => {
  const product = products.value?.find((p) => p._id === productId)
  const image = product?.images[0]?.filename
  return image
    ? `${(import.meta as any).env.VITE_API_URL}/erp/download/product?name=${image}`
    : undefined
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '95vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-eye text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">รายละเอียดการขาย</h3>
          <p class="text-sm text-gray-600">เลขที่: {{ saleData?.item }}</p>
        </div>
      </div>
    </template>

    <div v-if="saleData" class="space-y-6">
      <!-- Sale Header -->
      <div class="text-center border-b border-gray-200 pb-4">
        <h2 class="text-2xl font-bold text-gray-900">รายละเอียดการขาย</h2>
        <p class="text-gray-600">เลขที่: {{ saleData.item }}</p>
        <p class="text-gray-600">วันที่: {{ formatDate(dayjs(saleData.cat).toDate()) }}</p>
      </div>

      <!-- Customer and Order Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50/95 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-user text-green-600"></i>
            ข้อมูลลูกค้า
          </h4>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">รหัสลูกค้า:</span>
              <span class="font-medium capitalize">{{
                findMemberData(saleData.user)?.code || '-'
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อ-สกุล:</span>
              <span class="font-medium">{{
                findMemberData(saleData.user)?.name ||
                findMemberData(saleData.user)?.displayName ||
                '-'
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ชื่อเล่น:</span>
              <span class="font-medium">{{
                findMemberData(saleData.user)?.displayName || '-'
              }}</span>
            </div>

            <!-- <div class="flex justify-between">
              <span class="text-gray-600">ประเภทลูกค้า:</span>
              <Tag :value="saleData.user.type" severity="info" size="small" />
            </div> -->
            <div class="flex justify-between items-center">
              <span class="text-gray-600">สถานะ:</span>
              <Tag
                :value="findMemberStatusTag(findMemberData(saleData.user)?.status || '')?.label"
                :severity="findMemberStatusSeverity(findMemberData(saleData.user)?.status || '')"
                size="small"
              />
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-gray-600">ที่อยู่:</span>
              <span class="font-medium! text-xs"
                >{{ saleData.shippingAddress || '-' }},
                {{
                  memberStore.provinceOptions.find(
                    (option) => option.value === saleData.shippingProvince
                  )?.label
                }}</span
              >
            </div>
          </div>
        </div>

        <div class="bg-gray-50/95 rounded-lg p-4">
          <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <i class="pi pi-shopping-cart text-blue-600"></i>
            ข้อมูลการสั่งซื้อ
          </h4>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">ผู้ขาย:</span>
              <span class="font-medium">{{ handleFindAdmin(saleData.seller)?.name || '-' }}</span>
            </div>
            <!-- <div class="flex justify-between">
              <span class="text-gray-600">วิธีการชำระเงิน:</span>
              <Tag :value="paymentMethodLabel" severity="success" size="small" />
            </div> -->
            <div class="flex justify-between">
              <span class="text-gray-600">สถานะการขาย:</span>
              <Tag
                :value="currentStatusInfo?.label"
                :severity="currentStatusInfo?.color"
                size="small"
              />
            </div>
            <!-- <div class="flex justify-between">
              <span class="text-gray-600">สถานะการจัดส่ง:</span>
              <Tag :value="saleData.deliveryStatus" severity="warning" size="small" />
            </div> -->
          </div>
        </div>
      </div>

      <!-- Products Details -->
      <div class="bg-gray-50/95 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-box text-purple-600"></i>
          รายการสินค้า
        </h4>
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">ลำดับ</th>
                <th class="px-4 py-2 text-left text-sm font-medium text-gray-900">รายการ</th>
                <th class="px-4 py-2 text-center text-sm font-medium text-gray-900">จำนวน</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">ราคา/หน่วย</th>
                <th class="px-4 py-2 text-right text-sm font-medium text-gray-900">รวม</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(product, index) in saleData.products"
                :key="product.id"
                class="border-t border-gray-200"
              >
                <td class="px-4 py-2 text-sm text-gray-900">{{ index + 1 }}</td>
                <td class="px-4 py-2 text-sm text-gray-900">
                  <div v-if="!product.category && !product.name">
                    <p class="font-[500]! text-sm text-red-600 mb-0.5">ไม่พบข้อมูลสินค้า</p>
                    <p class="text-xs text-gray-500">
                      รายการนี้อาจถูกลบออกจากระบบ โปรดเลือกสินค้าใหม่
                    </p>
                  </div>
                  <div v-else class="flex items-center gap-1.5">
                    <img
                      v-if="getProductImage(product.id)"
                      :src="getProductImage(product.id)"
                      alt="product image"
                      class="w-auto h-10 object-contain"
                    />
                    <div>
                      <p class="font-[500]!">
                        {{ product.name }} รหัส ({{
                          products?.find((p) => p._id === product.id)?.sku || '-'
                        }})
                      </p>
                      <p class="text-xs text-gray-600">
                        หมวดหมู่:
                        {{ handleFindCategory(product?.category)?.name || '-' }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-2 text-center text-sm text-gray-900">
                  {{ product.quantity || 1 }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-gray-900">
                  {{ product.price ? formatCurrency(product.price || 0) : '-' }}
                </td>
                <td class="px-4 py-2 text-right text-sm text-gray-900">
                  {{
                    product.price
                      ? formatCurrency((product.price || 0) * (product.quantity || 1))
                      : '-'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pricing Summary -->
      <div class="bg-gray-50/95 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-calculator text-yellow-600"></i>
          สรุปราคา
        </h4>
        <div class="grid grid-cols-1 gap-4">
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">ยอดรวมสินค้า:</span>
              <span class="font-medium text-lg">{{ formatCurrency(totalAmount) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600">มัดจำ:</span>
              <span class="font-medium text-blue-600">{{ formatCurrency(saleData.deposit) }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-600">ค่าจัดส่ง:</span>
              <span class="font-medium text-green-600">{{
                formatCurrency(saleData?.deliveryNo || 0)
              }}</span>
            </div>

            <div class="flex justify-between items-center">
              <span class="text-gray-600">ส่วนลด:</span>
              <span class="font-medium text-red-600">{{ formatCurrency(saleData.discount) }}</span>
            </div>
            <div class="border-t border-gray-300 pt-3">
              <div class="flex justify-between items-center">
                <span class="text-gray-900 font-semibold text-lg">ยอดสุทธิ:</span>
                <span class="font-bold text-green-600 text-xl">{{
                  formatCurrency(finalAmount)
                }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <span class="text-gray-500">วันที่สร้าง:</span>
              <span class="font-medium! text-gray-500">{{
                formatDate(dayjs(saleData.cat).toDate())
              }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">วันที่อัปเดต:</span>
              <span class="font-medium! text-gray-500">{{
                formatDate(dayjs(saleData.uat).toDate())
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Information -->
      <div v-if="saleData.payment === 'transfer'" class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-credit-card text-indigo-600"></i>
          ข้อมูลการโอนเงิน
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex gap-3 items-center">
            <span class="text-gray-600 ">ธนาคาร:</span>
            <div class="flex items-center gap-1.5">
              <img
                v-if="BankData[saleData.bankCode as keyof typeof BankData]?.icon"
                :src="BankData[saleData.bankCode as keyof typeof BankData]?.icon as string"
                :alt="BankData[saleData.bankCode as keyof typeof BankData]?.fullname"
                class="w-4 h-4 object-contain"
              />
              <span class="font-[500]!">
                {{ BankData[saleData.bankCode as keyof typeof BankData]?.fullname || '-' }}
              </span>
            </div>
          </div>
          <div class="flex gap-3 items-center">
            <span class="text-gray-600">บัญชีธนาคาร:</span>
            <span class="font-medium">{{ saleData.bankAccount || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="saleData.note" class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <i class="pi pi-file-edit text-purple-600"></i>
          หมายเหตุ
        </h4>
        <p class="text-sm text-gray-700 bg-white p-3 rounded">{{ saleData.note }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center gap-3">
        <Button
          label="ดาวน์โหลดไฟล์"
          icon="pi pi-file-pdf"
          @click="handleDownloadPDF"
          severity="info"
          size="small"
          :disabled="!saleData.products || saleData.products.length === 0"
        />

        <Button
          label="พิมพ์ใบแจ้งหนี้"
          icon="pi pi-print"
          @click="handlePrintInvoice"
          severity="success"
          size="small"
          :disabled="!saleData.products || saleData.products.length === 0"
        />

        <div class="flex gap-3">
          <Button
            label="ปิด"
            icon="pi pi-times"
            severity="secondary"
            @click="handleClose"
            size="small"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
