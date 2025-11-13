<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, Textarea, Select, InputNumber, Button, TreeSelect, Tag } from 'primevue'
import {
  useProductStore,
  type IProduct,
  type IUpdateProductPayload,
} from '@/stores/product/product'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue3-toastify'
import formatCurrency from '@/utils/formatCurrency'
import { useSalesStore } from '@/stores/sales/sales'
import { useCategoryStore, type ICategory } from '@/stores/product/category'
import type {
  ICreateSalesPayload,
  ISales,
  IUpdateSalesPayload,
  StatusWorkflow,
} from '@/types/sales'
import CardProductList from '../CardProductList.vue'
import { type IAdmin } from '@/stores/admin/admin'
import { getProductImageUrl } from '@/utils/imageUrl'
import BankSelectionSection from '../BankSelectionSection.vue'
import SlipUploadSection from '../SlipUploadSection.vue'
import { useFoodSaleStore, type IFoodSale } from '@/stores/product/food_sale'

// Props
const props = defineProps<{
  visible: boolean
  admins: IAdmin[]
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// Stores
const productStore = useProductStore()
const memberStore = useMemberStore()
const salesStore = useSalesStore()
const categoryStore = useCategoryStore()

// Form data
const saleForm = ref<ICreateSalesPayload>({
  item: '',
  status: '',
  user: '',
  products: [{ id: '', category: '', price: 0, quantity: 1 }],
  deposit: 0,
  discount: 0,
  seller: '',
  note: '',
  deliveryNo: 0,
  delivery: '',
})

// Queries
const { data: products, refetch: refetchProducts } = useQuery<IProduct[]>({
  queryKey: ['get_products'],
  queryFn: () => productStore.onGetProducts(),
})

const { data: members, isLoading: membersLoading } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

const { data: categories } = useQuery<ICategory[]>({
  queryKey: ['get_categories'],
  queryFn: () => categoryStore.onGetCategory(0),
})

const handleFindCategory = (id: string | null | undefined): ICategory | undefined => {
  if (!id) return undefined
  return categories.value?.find((category) => category._id === id)
}

// Computed
const availableProducts = computed(() => {
  if (!products.value) return []
  return products.value.filter((p) => p.auctionOnly === 0)
})

const productOptions = computed(() => {
  return availableProducts.value.map((product) => ({
    label: `${product.name} (รหัส: ${product.sku})`,
    value: product._id,
  }))
})

const imageUrlCache = new Map<string, string>()
const getImageUrl = (filename: string): string => {
  if (imageUrlCache.has(filename)) {
    return imageUrlCache.get(filename)!
  }
  const url = getProductImageUrl(filename)
  imageUrlCache.set(filename, url)
  return url
}

const foodSaleStore = useFoodSaleStore()
const { data: foodSales } = useQuery<IFoodSale[]>({
  queryKey: ['get_food_sales'],
  queryFn: () => foodSaleStore.onGetFoodSales(),
})

const getProductOptionsForIndex = (currentIndex: number) => {
  if (!availableProducts.value) return []

  // ดึงรายการ ID ของสินค้าที่เลือกแล้ว (ยกเว้น index ปัจจุบัน)
  const selectedProductIds = saleForm.value.products
    ?.map((p, index) => (index !== currentIndex ? p.id : ''))
    .filter((id) => id !== '')

  // กรองสินค้าที่ยังไม่ได้เลือก
  const unselectedProducts = availableProducts.value.filter(
    (product) => !selectedProductIds?.includes(product._id)
  )

  // กรอง food sales ที่ยังไม่ได้เลือก
  const unselectedFoodSales = (foodSales.value || []).filter(
    (foodSale) => !selectedProductIds?.includes(foodSale.product?._id)
  )

  // group by category._id
  const groupsMap = new Map<
    string,
    {
      label: string
      children: Array<{
        label: string
        value: string
        image?: string
        disabled?: boolean
        sold?: boolean
        balance?: number
        isFish?: boolean
        sku?: string
        isFoodSale?: boolean
        kilo?: number
        customerPriceKilo?: number
      }>
    }
  >()

  unselectedProducts.forEach((product) => {
    const catId = product.category?._id || 'unknown'
    const cat = handleFindCategory(product.category?._id)
    const isFish = cat?.value === 'fish'
    const isFood = cat?.value === 'food'

    const groupLabel = isFood ? 'อาหาร (กระสอบ)' : cat?.name || 'ไม่ระบุหมวดหมู่'
    const group = groupsMap.get(catId) || {
      label: groupLabel,
      children: [],
    }

    // เพิ่มรูปภาพจาก images[0]
    const imageUrl =
      product.images && product.images.length > 0
        ? getImageUrl(product.images[0].filename) // ใช้ function แทน
        : undefined

    const isSold = isFish ? product.sold : product.sold || (product.balance || 0) === 0

    group.children.push({
      label: `${product.name || `${product.species?.name}`}`,
      sku: product.sku || '',
      value: product._id,
      image: imageUrl,
      disabled: isSold, // disable ถ้าขายแล้ว
      sold: product.sold,
      balance: product.balance,
      isFish: isFish,
      isFoodSale: false,
    })

    groupsMap.set(catId, group)
  })

  // unselectedFoodSales.forEach((foodSale) => {
  //   const product = foodSale.product
  //   const catId = 'food_sale'
  //   const cat = handleFindCategory(product?.category)

  //   // สร้าง group สำหรับอาหารแบ่งขาย หรือใช้ category เดิม
  //   const groupLabel = 'อาหาร (แบ่งขาย)'
  //   const group = groupsMap.get(catId) || {
  //     label: groupLabel,
  //     children: [],
  //   }

  //   const imageUrl =
  //     product?.images && product.images.length > 0
  //       ? getImageUrl(product.images[0].filename)
  //       : undefined

  //   // ตรวจสอบว่าขายหมดหรือยัง (ใช้ kilo เป็น balance)
  //   const isSold = (foodSale.kilo || 0) === 0

  //   group.children.push({
  //     label: `${foodSale.name || product?.name || ''}`,
  //     sku: product?.sku || '',
  //     value: foodSale._id, // ใช้ _id ของ food sale
  //     image: imageUrl,
  //     disabled: isSold,
  //     sold: isSold,
  //     balance: foodSale.kilo || 0,
  //     isFish: false,
  //     isFoodSale: true,
  //     kilo: foodSale.kilo,
  //     customerPriceKilo: foodSale.customerPriceKilo,
  //   })

  //   groupsMap.set(catId, group)
  // })

  const treeNodes = Array.from(groupsMap.values()).map((group, groupIndex) => ({
    key: `group-${groupIndex}`,
    label: group.label,
    selectable: false, // ไม่ให้เลือก category
    children: group.children
      .sort((a, b) => {
        // ถ้า a disabled และ b ไม่ disabled -> a ต้องลงล่าง
        if (a.disabled && !b.disabled) return 1
        if (!a.disabled && b.disabled) return -1
        return a.label.localeCompare(b.label)
      })
      .map((item) => ({
        key: item.value,
        label: item.label,
        value: item.value,
        data: item, // เก็บข้อมูลเต็มไว้ใน data
        selectable: !item.disabled,
        disabled: item.disabled,
        sku: item.sku,
        image: item.image,
        sold: item.sold,
        balance: item.balance,
        isFish: item.isFish,
        isFoodSale: item.isFoodSale,
        kilo: item.kilo,
        customerPriceKilo: item.customerPriceKilo,
      })),
  }))

  return treeNodes
}

const selectedProductDetails = computed(() => {
  return saleForm.value.products?.map((product: { id: string; quantity: number; category: string }) => {
    if (!product.id) return null

    // ตรวจสอบว่าเป็น food sale หรือ product ปกติ
    const foodSale = foodSales.value?.find((fs) => fs._id === product.id)

    if (foodSale) {
      // กรณีเป็น food sale
      const productDetail = foodSale.product
      const imageUrl =
        productDetail?.images && productDetail?.images.length > 0
          ? getProductImageUrl(productDetail.images[0].filename)
          : undefined

      return {
        ...productDetail,
        quantity: product.quantity,
        productId: foodSale._id,
        isMissing: false,
        category: handleFindCategory(productDetail?.category),
        image: imageUrl,
        isFoodSale: true,
        kilo: foodSale.kilo,
        customerPriceKilo: foodSale.customerPriceKilo,
        price: foodSale.customerPriceKilo, // ใช้ราคาต่อกิโล
      }
    }

    if (!availableProducts.value) return null
    const productDetail = availableProducts.value?.find((p) => p._id === product.id)

    const category = handleFindCategory(productDetail?.category?._id)
    const imageUrl =
      productDetail?.images && productDetail?.images.length > 0
        ? getProductImageUrl(productDetail?.images[0].filename)
        : undefined

    if (!productDetail) {
      return {
        name: '',
        price: 0,
        productId: product.id,
        quantity: product.quantity,
        isMissing: true,
        category: undefined,
        image: undefined,
        sku: '',
        balance: 0,
      }
    }

    return {
      ...productDetail,
      quantity: product.quantity,
      productId: product.id,
      isMissing: false,
      category: category,
      image: imageUrl,
    }
  })
})

const totalAmount = computed(() => {
  return saleForm.value.products?.reduce((sum, product) => {
    if (!product.id) return 0

    // ตรวจสอบว่าเป็น food sale
    const foodSale = foodSales.value?.find((fs) => fs._id === product.id)
    if (foodSale) {
      return sum + (foodSale.customerPriceKilo || 0) * (product.quantity || 0)
    }

    // กรณี product ปกติ
    const productDetail = availableProducts.value?.find((p) => p._id === product.id)
    if (productDetail && productDetail.price) {
      return sum + (productDetail.price || 0) * product.quantity
    }
    return sum
  }, 0)
})

const netAmount = computed(() => {
  const netAmount =
    (totalAmount.value || 0) - (saleForm.value.deliveryNo || 0) - (saleForm.value.discount || 0)
  return netAmount < 0 ? 0 : netAmount
})

const memberOptions = computed(() => {
  if (!members.value) return []
  return members.value.map((member) => {
    const code = member.code.charAt(0).toUpperCase() + member.code.slice(1)
    return {
      label: `${code} - ${member.displayName}`,
      value: member._id,
    }
  })
})

const selectedMemberDetails = computed(() => {
  if (!saleForm.value.user || !members.value) return null
  return members.value.find((m) => m._id === saleForm.value.user)
})

// Product management functions
const addProduct = () => {
  if (!saleForm.value.products) {
    saleForm.value.products = [{ id: '', category: '', price: 0, quantity: 1 }]
    return
  }

  if (saleForm.value.products.length < 20) {
    saleForm.value.products.push({ id: '', category: '', price: 0, quantity: 1 })
  } else {
    toast.warning('สามารถเพิ่มสินค้าได้สูงสุด 20 รายการ')
  }
}

const removeProduct = (index: number) => {
  if (saleForm.value.products && saleForm.value.products.length > 1) {
    saleForm.value.products?.splice(index, 1)
  } else {
    toast.warning('ต้องมีสินค้าอย่างน้อย 1 รายการ')
  }
}

const isProductValid = (product: { id: string; quantity: number }) => {
  return product.id && product.quantity > 0
}

const requiresSlipUpload = computed(() => {
  const currentStepIndex = getStatusStepIndex(saleForm.value.status)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  return currentStepIndex > waitPaymentStepIndex
})

const requiresBankSelection = computed(() => {
  const currentStepIndex = getStatusStepIndex(saleForm.value.status)
  const waitPaymentStepIndex = getStatusStepIndex('wait_payment')
  return currentStepIndex >= waitPaymentStepIndex
})

// Handlers
const handleSubmit = () => {
  isSubmitting.value = true

  // Validation
  if (!saleForm.value.user) {
    toast.error('กรุณาเลือกลูกค้า')
    return
  }

  if (!saleForm.value.status) {
    toast.error('กรุณาเลือกสถานะรายการขาย')
    return
  }

  if (!saleForm.value.seller) {
    toast.error('กรุณาเลือกผู้ขาย')
    return
  }

  // Check bank selection requirement
  if (requiresBankSelection.value && !bankForm.value.bankCode) {
    toast.error('กรุณาเลือกบัญชีธนาคารสำหรับการชำระเงิน')
    return
  }

  // Check slip upload requirement
  if (requiresSlipUpload.value && !hasSlip.value) {
    toast.error('กรุณาอัปโหลดสลิปการโอนเงิน')
    return
  }

  // Check if all products are valid
  const invalidProducts = saleForm.value.products?.filter((p) => !isProductValid(p)) || []
  if (invalidProducts.length > 0 && saleForm.value.status !== 'wait_product') {
    toast.error('กรุณาเลือกสินค้าและระบุจำนวนให้ครบถ้วน')
    return
  }

  let formattedProducts: {
        id: string
        category: string
        price: number
        quantity: number
        retailID?: string
        name?: string
        unit?: string
      }[] | null = null

  if (saleForm.value.status !== 'wait_product' && saleForm.value.products) {
    formattedProducts = saleForm.value.products.map((product) => {
      const retailSale = foodSales.value?.find((fs) => fs._id === product.id)

      if (retailSale) {
        // ถ้าเป็นอาหารแบ่งขาย: เก็บ foodSale._id ใน retailID และ product._id ใน id
        return {
          id: retailSale.product._id,
          category: retailSale.product.category || '',
          price: retailSale.customerPriceKilo, // ราคาต่อกก.
          quantity: product.quantity, // จำนวนกก.
          retailID: retailSale._id,
          name: retailSale.name || retailSale.product.name || '',
          unit: 'kilo', // ระบุหน่วย
        }
      } else {
        return {
          id: product.id,
          category: product.category,
          price: product.price, // ราคาต่อกระสอบ
          quantity: product.quantity || 1, // จำนวนกระสอบ
          name: product.name || '',
          unit: 'piece', // ระบุหน่วย
        }
      }
    })
  }


  createSale({
    ...saleForm.value,
    products: formattedProducts,
    item: `SALE-${Date.now().toString().slice(-8)}`,
  })
}

const queryClient = useQueryClient()
const { mutate: createSale, isPending: isCreatingSale } = useMutation({
  mutationFn: (sale: ICreateSalesPayload) => salesStore.onCreateSales(sale),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('เพิ่มข้อมูลการขายสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })

      if (requiresBankSelection.value && data.data._id) {
        saleData.value._id = data.data._id
        if (requiresSlipUpload.value) {
          saleData.value.submit = true
        }

        updateSale({
          ...data.data,
          _id: saleData.value._id,
          bankCode: bankForm.value.bankCode,
          bankAccount: bankForm.value.bankAccount,
        })
      } else {
        handleClose()
      }
    } else {
      toast.error('เพิ่มข้อมูลการขายไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เพิ่มข้อมูลการขายไม่สำเร็จ')
  },
})

const { data: allSales } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})
const { mutate: updateSale, isPending: isUpdatingSale } = useMutation({
  mutationFn: (sale: IUpdateSalesPayload) => salesStore.onUpdateSales(sale),
  onSuccess: (data: unknown, variables: IUpdateSalesPayload) => {
    if ((data as { data: { modifiedCount: number } }).data.modifiedCount > 0) {
      if (
        salesStore.statusWorkflow[variables.status as keyof StatusWorkflow]?.stepOrder >=
        salesStore.statusWorkflow['paid_complete'].stepOrder
      ) {
        // A. อัพเดทสถานะสมาชิก
        const member = members.value?.find((m) => m._id === variables.user)

        if (member && member.status !== 'css') {
          // คำนวณยอดซื้อรวมทั้งหมด (รายการปัจจุบัน + ยอดซื้อในอดีต)
          const currentTotal = calculateOrderTotal(variables, products.value || [])
          const previousTotal =
            allSales.value
              ?.filter(
                (s) =>
                  s.user._id === variables.user &&
                  salesStore.statusWorkflow[s.status as keyof StatusWorkflow]?.stepOrder >=
                    salesStore.statusWorkflow['paid_complete'].stepOrder &&
                  s._id !== variables._id
              )
              .reduce((sum, s) => sum + calculateSaleTotal(s, products.value || []), 0) || 0

          const totalSpending = currentTotal + previousTotal

          const shouldBeCss = totalSpending >= 50000
          const shouldBeCs = !shouldBeCss && member.status === 'ci'

          if (shouldBeCss || shouldBeCs) {
            const newStatus = shouldBeCss ? 'css' : 'cs'
            const newCode = member.code.replace('ci', newStatus).replace(/^cs(?!s)/, newStatus)

            updateMember({
              _id: member._id,
              status: newStatus,
              code: newCode,
              contacts: member.contacts || [],
              interests: member.interests || [],
              displayName: member.displayName,
              name: member.name,
              address: member.address,
              province: member.province,
              phone: member.phone,
              type: member.type,
              username: member.username,
              password: member.password,
              bidder: member.bidder,
              cat: member.cat,
              uat: member.uat,
            })
          }
        }

        // B. ตัดสต็อกสินค้า - แยก logic ปลา vs สินค้าทั่วไป
        const productsList = products.value?.filter((p) =>
          variables.products.some((product) => product.id === p._id)
        )

        if (productsList && productsList.length > 0) {
          productsList.forEach((product) => {
            const purchasedItem = variables.products.find((p) => p.id === product._id)
            if (!purchasedItem) return

            const quantity = purchasedItem.quantity
            const isFish = product.category?.name === 'ปลา'

            let newSoldStatus = product.sold
            let newBalance = product.balance || 0

            if (isFish) {
              // === กรณีปลา: ไม่ใช้ balance แค่เปลี่ยน sold ===
              newSoldStatus = true
              newBalance = product.balance || 0
            } else {
              // === กรณีสินค้าทั่วไป: ใช้ทั้ง balance และ sold ===
              const balance = product.balance || 0

              if (balance >= quantity) {
                // กรณีมีสต็อกเพียงพอ
                newBalance = balance - quantity
                newSoldStatus = newBalance === 0 // sold = true ถ้าสินค้าหมด
              } else {
                // กรณีสต็อกไม่พอ (ไม่ควรเกิด แต่เผื่อ)
                newBalance = 0
                newSoldStatus = true
                console.warn(
                  `สินค้า ${product.sku} มีสต็อกไม่เพียงพอ (มี: ${balance}, ขาย: ${quantity})`
                )
              }
            }

            updateProduct({
              ...product,
              fishpond: product.fishpond?._id || undefined,
              species: product.species?._id || undefined,
              farm: product.farm?._id || undefined,
              quality: product.quality?._id || undefined,
              lotNumber: product.lotNumber?._id || undefined,
              seedSize: product.seedSize?._id || undefined,
              foodtype: product.foodtype?._id || undefined,
              brand: product.brand?._id || undefined,
              fishStatus: product.fishStatus?._id || undefined,

              sold: newSoldStatus,
              balance: newBalance,
            })
          })
        }
      }

      refetchProducts()
      queryClient.invalidateQueries({ queryKey: ['get_sales'] })
      handleClose()
    } else {
      toast.error('แก้ไขข้อมูลการขายไม่สำเร็จ')
    }
  },
})

const calculateOrderTotal = (order: IUpdateSalesPayload, allProducts: IProduct[]): number => {
  const productsTotal = order.products.reduce((sum, item) => {
    const product = allProducts.find((p) => p._id === item.id)
    if (!product) return sum

    if (product.category?.name === 'ปลา') {
      const price = product.price || 0
      return sum + price
    } else {
      const price = product.food?.customerPrice || 0
      return sum + price * item.quantity
    }
  }, 0)

  // ยอดสุทธิ = ยอดสินค้า - ส่วนลด
  return productsTotal - (order.discount || 0)
}

const calculateSaleTotal = (sale: ISales, allProducts: IProduct[]): number => {
  const productsTotal = sale.products?.reduce((sum, item) => {
    const product = allProducts.find((p) => p._id === item.id)
    if (!product) return sum

    if (product.category?.name === 'ปลา') {
      const price = product.price || 0
      return sum + price
    } else {
      const price = product.food?.customerPrice || 0
      return sum + price * item.quantity
    }
  }, 0)

  return productsTotal ? productsTotal - (sale.discount || 0) : 0
}

const { mutate: updateMember } = useMutation({
  mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
})

const { mutate: updateProduct } = useMutation({
  mutationFn: (payload: IUpdateProductPayload) => productStore.onUpdateProduct(payload),
})

const isSubmitting = ref(false)
const handleClose = () => {
  resetForm()
  isSubmitting.value = false
  emit('update:visible', false)
}

const resetForm = () => {
  saleForm.value = {
    item: '',
    status: '',
    user: '',
    products: [{ id: '', category: '', price: 0, quantity: 1 }],
    deposit: 0,
    discount: 0,
    seller: '',
    note: '',
    deliveryNo: 0,
    delivery: '',
  }
  saleData.value = {
    _id: '',
    submit: false,
  }
  hasSlip.value = false
  bankForm.value = {
    bankCode: '',
    bankAccount: '',
  }
}

const sellers = computed(() => {
  if (!props.admins) return []
  return props.admins
    ?.filter((admin) => admin.role === 1)
    .map((admin) => ({
      label: admin.name,
      value: admin._id,
    }))
})

const getStatusStepIndex = (status: string) => {
  return salesStore.sellingStatusOptions.findIndex((option) => option.value === status)
}

const hasSlip = ref(false)
const bankForm = ref({
  bankCode: '',
  bankAccount: '',
})
const saleData = ref({
  _id: '',
  submit: false,
})
const handleSlipStatusChanged = (status: boolean) => {
  hasSlip.value = status
}
const updateBankCode = (bankCode: string) => {
  bankForm.value.bankCode = bankCode
}

const updateProducts = (index: number, value: string) => {
  // TreeSelect ส่ง value เป็น string (id)
  const selectedId = Object.keys(value)[0]

  if (!selectedId) return

  // ตรวจสอบว่าเป็น foodSale หรือ product ปกติ
  const foodSale = foodSales.value?.find((fs) => fs._id === selectedId)

  if (foodSale) {
    // กรณีอาหารแบ่งขาย
    const productData = foodSale.product
    saleForm.value.products![index] = {
      id: productData._id, // เก็บ product._id
      category: productData.category || '',
      price: foodSale.customerPriceKilo, // ราคาต่อกก.
      quantity: saleForm.value.products![index].quantity || 1, // คงค่า quantity เดิม
      retailID: foodSale._id, // เก็บ foodSale._id
      name: foodSale.name || productData.name || '',
      unit: 'kilo'
    }
  } else {
    // กรณีสินค้าปกติ
    const product = availableProducts.value?.find((p) => p._id === selectedId)

    if (!product) return

    // หาราคาตาม category
    let price = product.price || 0
    if (product.category?.name != 'ปลา' && product.food?.customerPrice) {
      price = product.food.customerPrice
    }

    saleForm.value.products![index] = {
      id: product._id,
      category: product.category?._id || '',
      price: price, // ราคาต่อกระสอบ
      quantity: saleForm.value.products![index].quantity || 1, // คงค่า quantity เดิม
      // ไม่มี retailID
      name: product.name || '',
      unit: 'piece'
    }
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="handleClose"
    modal
    :style="{ width: '70rem' }"
    :breakpoints="{ '1199px': '90vw', '575px': '95vw' }"
    :pt="{
      header: 'p-4',
      footer: 'p-4',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-plus text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">เพิ่มข้อมูลการขาย</h3>
          <p class="text-sm text-gray-600">กรอกข้อมูลการขายให้ครบถ้วน</p>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Customer Information -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              v-model="saleForm.user"
              :options="memberOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกลูกค้า"
              fluid
              size="small"
              :loading="membersLoading"
              :invalid="!saleForm.user && isSubmitting"
              filter
            />
            <small v-if="!saleForm.user && isSubmitting" class="text-red-500"
              >กรุณาเลือกลูกค้า</small
            >
          </div>

          <div>
            <Select
              v-model="saleForm.status"
              :options="salesStore.sellingStatusOptions"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกสถานะรายการขาย"
              :invalid="!saleForm.status && isSubmitting"
            />
            <small v-if="!saleForm.status && isSubmitting" class="text-red-500"
              >กรุณาเลือกสถานะรายการขาย</small
            >
          </div>

          <div>
            <Select
              v-model="saleForm.seller"
              :options="sellers"
              optionLabel="label"
              optionValue="value"
              fluid
              size="small"
              placeholder="เลือกผู้ขาย"
              :invalid="!saleForm.seller && isSubmitting"
            />
            <small v-if="!saleForm.seller && isSubmitting" class="text-red-500"
              >กรุณาเลือกผู้ขาย</small
            >
          </div>
        </div>

        <!-- Selected Member Details -->
        <div
          v-if="selectedMemberDetails"
          class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div
              class="md:flex hidden w-14 h-14 bg-green-100 rounded-lg items-center justify-center"
            >
              <i class="pi pi-user text-green-600 text-xl"></i>
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-gray-900">
                {{ selectedMemberDetails.name || selectedMemberDetails.displayName }}
              </h5>
              <p class="text-sm text-gray-600">
                รหัส: <span class="capitalize">{{ selectedMemberDetails.code }}</span> | ชื่อเล่น:
                {{ selectedMemberDetails.displayName || '-' }} | เบอร์:
                {{ selectedMemberDetails.phone || '-' }}
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                ที่อยู่: {{ selectedMemberDetails.address || '-' }},
                {{
                  selectedMemberDetails.province
                    ? memberStore.provinceOptions.find(
                        (option) => option.value === selectedMemberDetails?.province
                      )?.label
                    : '-'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Bank Selection (if required) -->
        <BankSelectionSection
          v-if="requiresBankSelection"
          :selected-bank-code="bankForm.bankCode || ''"
          :is-submitting="isSubmitting"
          :is-current-bank="''"
          :is-current-status="''"
          @update:selected-bank-code="updateBankCode"
        />

        <!-- Slip Upload Section -->
        <SlipUploadSection
          :sale-id="saleData._id || ''"
          :upload-to-submit="saleData.submit"
          :is-add-sale="true"
          :selected-status="saleForm.status"
          :is-current-status="''"
          :is-submitting="isSubmitting"
          @slip-status-changed="handleSlipStatusChanged"
        />
      </div>

      <!-- Product Information -->
      <div
        v-if="saleForm.status !== 'wait_product'"
        class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <i class="pi pi-box text-blue-600"></i>
            รายการสินค้า
          </h4>
          <Button
            label="เพิ่มสินค้า"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="addProduct"
          />
        </div>

        <div class="space-y-4">
          <div
            v-for="(product, index) in saleForm.products"
            :key="index"
            class="p-3 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <div class="flex items-center justify-between mb-2">
              <h5 class="text-sm font-semibold text-gray-700">สินค้า {{ index + 1 }}</h5>
              <Button
                v-if="saleForm.products && saleForm.products.length > 1"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                text
                rounded
                @click="removeProduct(index)"
                v-tooltip.top="'ลบสินค้านี้'"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>

                <TreeSelect
                  v-model="product.id"
                  @update:modelValue="(value) => updateProducts(index, value)"
                  :options="getProductOptionsForIndex(index)"
                  placeholder="เลือกสินค้าที่ต้องการขาย"
                  fluid
                  size="small"
                  filter
                  filterBy="label,sku"
                  :filterPlaceholder="`ค้นหาจากชื่อหรือรหัสสินค้า`"
                  :invalid="!product.id && isSubmitting"
                  selectionMode="single"
                  :pt="{
                    label: 'flex items-center gap-2',
                  }"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value.length > 0" class="flex items-center gap-2">
                      <img
                        v-if="
                          availableProducts?.find((p) => p._id === slotProps.value)?.images?.[0]
                        "
                        :src="
                          getImageUrl(
                            availableProducts?.find((p) => p._id === slotProps.value)?.images?.[0]
                              .filename || ''
                          )
                        "
                        alt="product"
                        class="w-6 h-6 object-cover rounded"
                        loading="lazy"
                        fetchpriority="low"
                        crossorigin="anonymous"
                      />
                      <span>
                        {{ availableProducts?.find((p) => p._id === slotProps.value)?.name }}
                        <span class="text-xs text-gray-500 pl-1">
                          รหัส ({{
                            availableProducts?.find((p) => p._id === slotProps.value)?.sku
                          }})
                        </span>
                      </span>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>

                  <template #option="{ node }">
                    <div class="flex items-center justify-between gap-2 w-full">
                      <div class="flex items-center gap-2">
                        <img
                          v-if="node.image"
                          :src="node.image"
                          alt="product"
                          class="w-6 h-6 object-cover rounded"
                          loading="lazy"
                          fetchpriority="low"
                          crossorigin="anonymous"
                        />
                        <span :class="{ 'opacity-50': node.disabled }">
                          {{ node.label }}
                          <span v-if="node.sku" class="text-xs text-gray-500 pl-1">
                            รหัส ({{ node.sku }})
                          </span>
                        </span>
                      </div>

                      <!-- Badge สถานะ -->
                      <div v-if="node.value" class="flex-shrink-0">
                        <!-- ปลา -->
                        <Tag
                          v-if="node.isFish && node.sold"
                          value="ขายแล้ว"
                          severity="danger"
                          size="small"
                          class="text-xs"
                        />
                        <Tag
                          v-else-if="node.isFish && !node.sold"
                          value="พร้อมขาย"
                          severity="success"
                          size="small"
                          class="text-xs"
                        />

                        <!-- สินค้าทั่วไป (อาหารกระสอบ) -->
                        <Tag
                          v-else-if="
                            !node.isFish && !node.isFoodSale && (node.sold || node.balance === 0)
                          "
                          :value="`คงเหลือ: ${node.balance || 0}`"
                          severity="danger"
                          size="small"
                          class="text-xs"
                        />
                        <Tag
                          v-else-if="!node.isFish && !node.isFoodSale"
                          :value="`คงเหลือ: ${node.balance || 0}`"
                          severity="success"
                          size="small"
                          class="text-xs"
                        />

                        <!-- อาหารแบ่งขาย -->
                        <Tag
                          v-else-if="node.isFoodSale && (node.sold || node.balance === 0)"
                          :value="`คงเหลือ: ${node.balance || 0} กก.`"
                          severity="danger"
                          size="small"
                          class="text-xs"
                        />
                        <Tag
                          v-else-if="node.isFoodSale"
                          :value="`คงเหลือ: ${node.balance || 0} กก.`"
                          severity="success"
                          size="small"
                          class="text-xs"
                        />
                      </div>
                    </div>
                  </template>
                </TreeSelect>

                <small v-if="!product.id && isSubmitting" class="text-red-500"
                  >กรุณาเลือกสินค้า</small
                >
              </div>

              <div>
                <InputNumber
                  v-model="product.quantity"
                  :min="1"
                  :max="products?.find((p) => p._id === product.id)?.balance || 100"
                  fluid
                  size="small"
                  placeholder="ระบุจำนวนสินค้า"
                  :invalid="!product.quantity && isSubmitting"
                  :disabled="
                    handleFindCategory(products?.find((p) => p._id === product.id)?.category?._id)
                      ?.value === 'fish'
                  "
                />
                <small v-if="!product.quantity && isSubmitting" class="text-red-500"
                  >กรุณากรอกจำนวนสินค้า
                </small>
              </div>
            </div>

            <CardProductList
              v-if="selectedProductDetails && selectedProductDetails[index]"
              :name="selectedProductDetails[index]?.name"
              :quantity="selectedProductDetails[index]?.quantity || product.quantity"
              :price="selectedProductDetails[index]?.price"
              :detail="''"
              :category="selectedProductDetails[index]?.category"
              :is-missing="!selectedProductDetails[index]"
              :image="selectedProductDetails[index]?.image"
              :sku="selectedProductDetails[index]?.sku"
              :balance="selectedProductDetails[index]?.balance"
            />
          </div>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              มัดจำ (บาท)
            </label>
            <InputNumber
              v-model="saleForm.deposit"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุยอดมัดจำ"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              ส่วนลด (บาท)
            </label>
            <InputNumber
              v-model="saleForm.discount"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุส่วนลด"
            />
          </div>

          <div>
            <label class="text-sm font-[500]! text-gray-700 mb-1 flex items-center">
              ค่าจัดส่ง (บาท)
            </label>
            <InputNumber
              v-model="saleForm.deliveryNo"
              :min="0"
              mode="currency"
              currency="THB"
              locale="th-TH"
              fluid
              size="small"
              placeholder="ระบุค่าจัดส่ง"
            />
          </div>
        </div>

        <!-- Summary -->
        <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">มูลค่าสินค้า:</span>
              <span class="text-sm font-medium text-gray-800">{{
                formatCurrency(totalAmount || 0)
              }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-red-600">ส่วนลด:</span>
              <span class="text-sm font-medium text-red-600">{{
                formatCurrency(saleForm.discount || 0)
              }}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-blue-600">ค่าจัดส่ง:</span>
              <span class="text-sm font-medium text-blue-600">{{
                formatCurrency(saleForm.deliveryNo || 0)
              }}</span>
            </div>

            <div v-if="saleForm.deposit > 0" class="flex items-center justify-between">
              <span class="text-sm text-blue-600">มัดจำ:</span>
              <span class="text-sm font-medium text-blue-600">{{
                formatCurrency(saleForm.deposit || 0)
              }}</span>
            </div>

            <div class="border-t border-green-300 pt-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-green-600">ยอดสุทธิ:</span>
                <span class="font-bold text-lg text-green-600">{{
                  formatCurrency(netAmount)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div class="flex items-center gap-2 mb-3">
          <i class="pi pi-file-edit text-purple-600"></i>
          <h4 class="text-lg font-[500]! text-gray-800">หมายเหตุ</h4>
        </div>

        <Textarea
          v-model="saleForm.note"
          placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
          rows="3"
          fluid
          size="small"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="handleClose"
          size="small"
        />
        <Button
          label="บันทึกข้อมูล"
          icon="pi pi-check"
          @click="handleSubmit"
          :loading="isCreatingSale || isUpdatingSale"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-select-option[aria-disabled='true']) {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

:deep(.p-treeselect-option[aria-disabled='true']) {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

:deep(.p-tree-node-content[aria-disabled='true']) {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>

<style>
.p-tree-node-toggle-button[data-p-leaf='true'] {
  display: none !important;
  visibility: hidden !important;
}
</style>


