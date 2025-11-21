<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useMemberStore,
  type CreateMemberPayload,
  type IMember,
  type UpdateMemberPayload,
  type ResetPasswordPayload,
} from '@/stores/member/member'
import { useMemberInterests } from '@/composables/useMemberInterests'
import { Dialog, Textarea, Select, InputText, Panel } from 'primevue'
import Password from 'primevue/password'
import Button from 'primevue/button'
import PurchaseHistoryPanel from './PurchaseHistoryPanel.vue'
import { toast } from 'vue3-toastify'
import fbImg from '@/assets/images/icon/fb.png'
import lineOaImg from '@/assets/images/icon/line-oa.webp'
import lineImg from '@/assets/images/icon/line.png'
import groupImg from '@/assets/images/icon/icon-group.png'
import tiktokImg from '@/assets/images/icon/tiktok.png'
import { useMutation, useQueryClient, useQuery } from '@tanstack/vue-query'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales } from '@/types/sales'
import { convertStatusStringToNumber, SellingStatus as SellingStatusEnum } from '@/types/sales'
import dayjs from 'dayjs'

const props = defineProps<{
  showAddModal: boolean
  data: IMember | null
  memberData: IMember[]
}>()

const emit = defineEmits<{
  (e: 'onCloseAddModal'): void
}>()

const showAddModal = computed({
  get: () => props.showAddModal,
  set: (value: boolean) => {
    if (!value) {
      closeAddModal()
    }
  },
})

const isSubmitting = ref(false)
const newMember = ref<
  CreateMemberPayload & {
    // Legacy fields (เก็บไว้เพื่อ backward compatibility)
    experience?: string
    fishPreference?: string
    pondSize?: string
    bacteriaBrand?: string
    foodBrand?: string
    // New fields
    breedingBehavior?: string
    gosanke?: string
    nonGosanke?: string
    variety?: string
    fishAge?: string
    budgetLevel?: string
    bacteriaUsage?: string
    filterCleaning?: string
    filterCleaningCompany?: string
    feedingMethod?: string
    contestParticipation?: string
    contestParticipationReason?: string
    competitionParticipation?: string
    competitionFarm?: string
    competitionReason?: string
    onlineAuction?: string
    auctionFarm?: string
    auctionReason?: string
    japanPurchase?: string
    japanFarm?: string
    japanReason?: string
    lastPurchaseDate?: string
    totalPurchaseAmount?: number
    purchaseCount?: number
  }
>({
  status: null,
  code: '',
  customerLevel: null,
  contacts: [{ index: 0, type: '', value: '' }],
  interests: [],
  displayName: '',
  name: '',
  password: undefined,
  bidder: false,
  address: '',
  province: '',
  phone: '',
  type: '',
  username: undefined,
  // Legacy fields
  experience: '',
  fishPreference: '',
  pondSize: '',
  bacteriaBrand: '',
  foodBrand: '',
  // New fields
  breedingBehavior: '',
  gosanke: '',
  nonGosanke: '',
  variety: '',
  fishAge: '',
  budgetLevel: '',
  bacteriaUsage: '',
  filterCleaning: '',
  filterCleaningCompany: '',
  feedingMethod: '',
  behaviorNotes: '',
  purchaseHistory: [],
  requirements: '',
  lastPurchaseDate: undefined,
  totalPurchaseAmount: undefined,
  purchaseCount: undefined,
})

const closeAddModal = () => {
  newMember.value = {
    status: null,
    code: '',
    customerLevel: null,
    contacts: [{ index: 0, type: '', value: '' }],
    interests: [],
    displayName: '',
    name: '',
    password: undefined,
    bidder: false,
    username: undefined,
    address: '',
    province: '',
    phone: '',
    type: '',
    // Legacy fields
    experience: '',
    fishPreference: '',
    pondSize: '',
    bacteriaBrand: '',
    foodBrand: '',
    // New fields
    breedingBehavior: '',
    gosanke: '',
    nonGosanke: '',
    variety: '',
    fishAge: '',
    budgetLevel: '',
    bacteriaUsage: '',
    filterCleaning: '',
    filterCleaningCompany: '',
    feedingMethod: '',
    contestParticipation: '',
    contestParticipationReason: '',
    competitionParticipation: '',
    competitionFarm: '',
    competitionReason: '',
    onlineAuction: '',
    auctionFarm: '',
    auctionReason: '',
    japanPurchase: '',
    japanFarm: '',
    japanReason: '',
    behaviorNotes: '',
    purchaseHistory: [],
    requirements: '',
    lastPurchaseDate: undefined,
    totalPurchaseAmount: undefined,
    purchaseCount: undefined,
  }
  // Reset state รายการใหม่
  newlyAddedPurchaseHistory.value = []
  originalPurchaseHistory.value = []
  editingSaleIds.value.clear()
  // Reset password fields
  resetPasswordFields()
  emit('onCloseAddModal')
}

const memberStore = useMemberStore()
const salesStore = useSalesStore()
const { toFlatObject, toInterestsArray } = useMemberInterests()

// Helper functions for contact icons
const getContactIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'fb.png': fbImg,
    'line-oa.webp': lineOaImg,
    'line.png': lineImg,
    'icon-group.png': groupImg,
    'tiktok.png': tiktokImg,
  }
  return iconMap[iconName] || ''
}

const getSelectedContactIcon = (value: string) => {
  const option = memberStore.memberContactOptions.find((opt) => opt.value === value)
  return option?.icon ? getContactIcon(option.icon) : ''
}

const getSelectedContactLabel = (value: string) => {
  const option = memberStore.memberContactOptions.find((opt) => opt.value === value)
  return option?.label || ''
}

// ดึงข้อมูล sales
const { data: salesData } = useQuery<ISales[]>({
  queryKey: ['get_sales'],
  queryFn: () => salesStore.onGetSales(),
})

// สำหรับจัดการประวัติซื้อสินค้า
const selectedSaleId = ref<string | null>(null)
const itemFilter = ref('')

// Helper function คำนวณยอดรวม
const calculateSaleTotal = (sale: ISales | undefined): number => {
  if (!sale) return 0
  const productsTotal = sale.products
    ? sale.products.reduce((total, product) => {
        return total + (product.price || 0) * (product.quantity || 1)
      }, 0)
    : 0
  return productsTotal - sale.discount - (sale.deliveryNo || 0)
}

// Helper function หา sale จาก _id
const getSaleById = (id: string): ISales | undefined => {
  return salesData.value?.find((sale) => sale._id === id)
}

// Filter sales ที่สามารถเลือกได้
const availableSales = computed(() => {
  if (!salesData.value || !props.data?._id) return []

  return salesData.value.filter((sale) => {
    // ตรวจสอบ user id ตรงกัน
    if (sale.user !== props.data?._id) return false

    // ตรวจสอบว่าไม่มีใน purchaseHistory แล้ว
    if (newMember.value.purchaseHistory?.includes(sale._id)) return false

    // ตรวจสอบสถานะ >= preparing (shipping, received, damaged)
    const statusNumber =
      typeof sale.sellingStatus === 'number'
        ? sale.sellingStatus
        : convertStatusStringToNumber(sale.sellingStatus)
    if (statusNumber < SellingStatusEnum.preparing) return false

    return true
  })
})

// Filter sales ตาม item filter
const filteredSales = computed(() => {
  if (!itemFilter.value.trim()) return availableSales.value

  const filterLower = itemFilter.value.toLowerCase().trim()
  return availableSales.value.filter((sale) => sale.item.toLowerCase().includes(filterLower))
})

// Computed สำหรับ Select options
const saleOptions = computed(() => {
  return filteredSales.value.map((sale) => ({
    label: `เลขรายการขาย: ${sale.item}`,
    value: sale._id,
    sale: sale,
  }))
})

// ฟังก์ชันคำนวณ CRM statistics จาก purchaseHistory
// รวมทั้งรายการเก่าและรายการใหม่
const calculatePurchaseStats = () => {
  // รวมรายการเก่าและรายการใหม่เข้าด้วยกัน
  const allPurchaseHistory = [
    ...(newMember.value.purchaseHistory || []),
    ...newlyAddedPurchaseHistory.value,
  ]

  if (!salesData.value || allPurchaseHistory.length === 0) {
    newMember.value.totalPurchaseAmount = 0
    newMember.value.purchaseCount = 0
    newMember.value.lastPurchaseDate = undefined
    return
  }

  const memberSales = salesData.value.filter((sale) => allPurchaseHistory.includes(sale._id))

  // คำนวณยอดซื้อรวม
  const totalAmount = memberSales.reduce((sum, sale) => {
    return sum + calculateSaleTotal(sale)
  }, 0)

  // หาวันที่ซื้อล่าสุด
  const purchaseDates = memberSales
    .map((sale) => sale.cat)
    .filter((date) => date)
    .sort((a, b) => b - a)

  const lastPurchaseDate =
    purchaseDates.length > 0 ? dayjs(purchaseDates[0]).toISOString() : undefined

  // จำนวนครั้งที่ซื้อ
  const count = memberSales.length

  newMember.value.totalPurchaseAmount = totalAmount
  newMember.value.purchaseCount = count
  newMember.value.lastPurchaseDate = lastPurchaseDate
}

const addPurchaseHistory = () => {
  if (selectedSaleId.value) {
    // ตรวจสอบว่า saleId นี้มีอยู่แล้วหรือไม่ (ทั้งในรายการใหม่และรายการเก่า)
    const alreadyExists =
      newlyAddedPurchaseHistory.value.includes(selectedSaleId.value) ||
      newMember.value.purchaseHistory?.includes(selectedSaleId.value)

    if (!alreadyExists) {
      // เพิ่มเข้า state รายการใหม่
      newlyAddedPurchaseHistory.value.push(selectedSaleId.value)
      selectedSaleId.value = null
      itemFilter.value = ''
      // คำนวณ CRM statistics ใหม่
      calculatePurchaseStats()
    } else {
      toast.warning('Sale ID นี้มีอยู่แล้ว')
    }
  }
}

const removePurchaseHistory = (saleId: string) => {
  // ลบจากรายการใหม่
  const newIndex = newlyAddedPurchaseHistory.value.indexOf(saleId)
  if (newIndex > -1) {
    newlyAddedPurchaseHistory.value.splice(newIndex, 1)
  }

  // ลบจากรายการเก่า (ถ้ามี)
  if (newMember.value.purchaseHistory) {
    const index = newMember.value.purchaseHistory.indexOf(saleId)
    if (index > -1) {
      newMember.value.purchaseHistory.splice(index, 1)
    }
  }

  // ลบ saleId ออกจาก editingSaleIds ถ้ามี
  editingSaleIds.value.delete(saleId)
  // คำนวณ CRM statistics ใหม่
  calculatePurchaseStats()
}

// ฟังก์ชันสำหรับจัดการ contacts
const addContact = () => {
  if (newMember.value.contacts.length < 5) {
    const newIndex = Math.max(...newMember.value.contacts.map((c) => c.index), -1) + 1
    newMember.value.contacts = [
      ...newMember.value.contacts,
      { index: newIndex, type: '', value: '' },
    ]
  }
}

const removeContact = (index: number) => {
  if (newMember.value.contacts.length > 1) {
    newMember.value.contacts = newMember.value.contacts.filter((c) => c.index !== index)
  }
}

const updateContact = (index: number, field: 'type' | 'value', value: string | undefined) => {
  newMember.value.contacts = newMember.value.contacts.map((contact) =>
    contact.index === index ? { ...contact, [field]: value || '' } : contact
  )
}

// State สำหรับเปลี่ยนรหัสผ่าน
const newPassword = ref('')
const confirmPassword = ref('')

// Validation functions สำหรับรหัสผ่าน
const validatePassword = (password: string) => {
  const minLength = 8
  const hasNumbers = /\d/.test(password)

  return {
    isValid: password.length >= minLength && hasNumbers,
    minLength: password.length >= minLength,
    hasNumbers,
  }
}

const passwordValidation = computed(() => {
  if (!newPassword.value) return null
  return validatePassword(newPassword.value)
})

const isPasswordFormValid = computed(() => {
  return passwordValidation.value?.isValid && newPassword.value === confirmPassword.value
})

// Reset password fields
const resetPasswordFields = () => {
  newPassword.value = ''
  confirmPassword.value = ''
}

watch(
  () => props.data,
  (newMemberData) => {
    if (newMemberData) {
      // เก็บ purchaseHistory เดิมไว้
      originalPurchaseHistory.value = newMemberData.purchaseHistory || []
      // Reset state รายการใหม่เมื่อโหลดข้อมูลใหม่
      newlyAddedPurchaseHistory.value = []
      editingSaleIds.value.clear()

      // แปลง interests array เป็น flat object
      const interestsFlat = toFlatObject(newMemberData.interests)

      newMember.value = {
        code: newMemberData.code,
        status: newMemberData.status,
        customerLevel: newMemberData.customerLevel || '',
        contacts:
          newMemberData.contacts && newMemberData.contacts.length > 0
            ? newMemberData.contacts
            : [{ index: 0, type: '', value: '' }],
        interests: newMemberData.interests || [],
        displayName: newMemberData.displayName,
        name: newMemberData.name || '',
        password: newMemberData.password || null,
        bidder: newMemberData.bidder || false,
        address: newMemberData.address || '',
        province: newMemberData.province || '',
        phone: newMemberData.phone || '',
        type: newMemberData.type || '',
        username: newMemberData.username || null,
        // Legacy fields
        experience: interestsFlat.experience || '',
        fishPreference: interestsFlat.fishPreference || '',
        pondSize: interestsFlat.pondSize || '',
        bacteriaBrand: interestsFlat.bacteriaBrand || '',
        foodBrand: interestsFlat.foodBrand || '',
        // New fields
        breedingBehavior: interestsFlat.breedingBehavior || '',
        gosanke: interestsFlat.gosanke || '',
        nonGosanke: interestsFlat.nonGosanke || '',
        variety: interestsFlat.variety || '',
        fishAge: interestsFlat.fishAge || '',
        budgetLevel: interestsFlat.budgetLevel || '',
        bacteriaUsage: interestsFlat.bacteriaUsage || '',
        filterCleaning: interestsFlat.filterCleaning || '',
        filterCleaningCompany: interestsFlat.filterCleaningCompany || '',
        feedingMethod: interestsFlat.feedingMethod || '',
        contestParticipation: interestsFlat.contestParticipation || '',
        contestParticipationReason: interestsFlat.contestParticipationReason || '',
        competitionParticipation: interestsFlat.competitionParticipation || '',
        competitionFarm: interestsFlat.competitionFarm || '',
        competitionReason: interestsFlat.competitionReason || '',
        onlineAuction: interestsFlat.onlineAuction || '',
        auctionFarm: interestsFlat.auctionFarm || '',
        auctionReason: interestsFlat.auctionReason || '',
        japanPurchase: interestsFlat.japanPurchase || '',
        japanFarm: interestsFlat.japanFarm || '',
        japanReason: interestsFlat.japanReason || '',
        behaviorNotes: newMemberData.behaviorNotes || '',
        purchaseHistory: newMemberData.purchaseHistory || [],
        requirements: newMemberData.requirements || '',
        lastPurchaseDate: newMemberData.lastPurchaseDate,
        totalPurchaseAmount: newMemberData.totalPurchaseAmount,
        purchaseCount: newMemberData.purchaseCount,
      }
      // คำนวณ CRM statistics เมื่อโหลดข้อมูล
      // ใช้ nextTick เพื่อให้แน่ใจว่า salesData โหลดเสร็จแล้ว
      setTimeout(() => {
        calculatePurchaseStats()
      }, 100)
    }
  },
  { immediate: true }
)

// Watch salesData เพื่อคำนวณใหม่เมื่อข้อมูล sales โหลดเสร็จ
watch(
  () => salesData.value,
  () => {
    if (
      props.data &&
      newMember.value.purchaseHistory &&
      newMember.value.purchaseHistory.length > 0
    ) {
      calculatePurchaseStats()
    }
  }
)

const handleAddMember = () => {
  isSubmitting.value = true

  // ตรวจสอบ contacts
  const hasValidContacts = newMember.value.contacts.some(
    (contact) =>
      contact.type && contact.value && contact.type.trim() !== '' && contact.value.trim() !== ''
  )

  if (!hasValidContacts) {
    toast.error('กรุณาระบุช่องทางติดต่ออย่างน้อย 1 ช่องทาง')
    return
  }

  if (!newMember.value.displayName) {
    toast.error('กรุณาระบุชื่อเล่น')
    return
  }

  if (!newMember.value.status) {
    toast.error('กรุณาเลือกสถานะลูกค้า')
    return
  }

  if (!newMember.value.customerLevel) {
    toast.error('กรุณาเลือกระดับลูกค้า')
    return
  }

  // Validation: ถ้าเลือกใช้จุลินทรีย์ ต้องกรอกยี่ห้อ
  if (newMember.value.bacteriaUsage === 'yes' && !newMember.value.bacteriaBrand?.trim()) {
    toast.error('กรุณากรอกยี่ห้อจุลินทรีย์')
    return
  }

  // Validation: ถ้าเลือกมีบริษัทรับล้าง ต้องกรอกชื่อบริษัท
  if (
    newMember.value.filterCleaning === 'company' &&
    !newMember.value.filterCleaningCompany?.trim()
  ) {
    toast.error('กรุณากรอกชื่อบริษัทรับล้างกรอง')
    return
  }

  // Validation และ auto-fill "-" สำหรับฟิลด์บังคับ
  // ถ้าเลือกไม่ชอบส่งปลางานประกวด ต้องกรอกเหตุผล (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.contestParticipation === 'no') {
    if (!newMember.value.contestParticipationReason?.trim()) {
      newMember.value.contestParticipationReason = '-'
    }
  }

  // ถ้าเลือกเคยร่วมกิจกรรมแข่งเลี้ยง ต้องกรอกฟาร์ม (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.competitionParticipation === 'yes') {
    if (!newMember.value.competitionFarm?.trim()) {
      newMember.value.competitionFarm = '-'
    }
  }

  // ถ้าเลือกไม่เคยร่วมกิจกรรมแข่งเลี้ยง ต้องกรอกเหตุผล (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.competitionParticipation === 'no') {
    if (!newMember.value.competitionReason?.trim()) {
      newMember.value.competitionReason = '-'
    }
  }

  // ถ้าเลือกเคยประมูลปลาออนไลน์ ต้องกรอกฟาร์ม (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.onlineAuction === 'yes') {
    if (!newMember.value.auctionFarm?.trim()) {
      newMember.value.auctionFarm = '-'
    }
  }

  // ถ้าเลือกไม่เคยประมูลปลาออนไลน์ ต้องกรอกเหตุผล (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.onlineAuction === 'no') {
    if (!newMember.value.auctionReason?.trim()) {
      newMember.value.auctionReason = '-'
    }
  }

  // ถ้าเลือกเคยไปซื้อปลาคาร์ฟที่ญี่ปุ่น ต้องกรอกฟาร์ม (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.japanPurchase === 'yes') {
    if (!newMember.value.japanFarm?.trim()) {
      newMember.value.japanFarm = '-'
    }
  }

  // ถ้าเลือกไม่เคยไปซื้อปลาคาร์ฟที่ญี่ปุ่น ต้องกรอกเหตุผล (ถ้าไม่กรอกให้ใส่ "-")
  if (newMember.value.japanPurchase === 'no') {
    if (!newMember.value.japanReason?.trim()) {
      newMember.value.japanReason = '-'
    }
  }

  // Build interests array from flat fields using composable
  const flatFields: Record<string, string> = {
    breedingBehavior: newMember.value.breedingBehavior || '',
    gosanke: newMember.value.gosanke || '',
    nonGosanke: newMember.value.nonGosanke || '',
    variety: newMember.value.variety || '',
    fishAge: newMember.value.fishAge || '',
    budgetLevel: newMember.value.budgetLevel || '',
    bacteriaUsage: newMember.value.bacteriaUsage || '',
    bacteriaBrand: newMember.value.bacteriaBrand || '',
    foodBrand: newMember.value.foodBrand || '',
    filterCleaning: newMember.value.filterCleaning || '',
    filterCleaningCompany: newMember.value.filterCleaningCompany || '',
    pondSize: newMember.value.pondSize || '',
    feedingMethod: newMember.value.feedingMethod || '',
    contestParticipation: newMember.value.contestParticipation || '',
    contestParticipationReason:
      newMember.value.contestParticipation === 'no'
        ? newMember.value.contestParticipationReason || '-'
        : newMember.value.contestParticipationReason || '',
    competitionParticipation: newMember.value.competitionParticipation || '',
    competitionFarm:
      newMember.value.competitionParticipation === 'yes'
        ? newMember.value.competitionFarm || '-'
        : newMember.value.competitionFarm || '',
    competitionReason:
      newMember.value.competitionParticipation === 'no'
        ? newMember.value.competitionReason || '-'
        : newMember.value.competitionReason || '',
    onlineAuction: newMember.value.onlineAuction || '',
    auctionFarm:
      newMember.value.onlineAuction === 'yes'
        ? newMember.value.auctionFarm || '-'
        : newMember.value.auctionFarm || '',
    auctionReason:
      newMember.value.onlineAuction === 'no'
        ? newMember.value.auctionReason || '-'
        : newMember.value.auctionReason || '',
    japanPurchase: newMember.value.japanPurchase || '',
    japanFarm:
      newMember.value.japanPurchase === 'yes'
        ? newMember.value.japanFarm || '-'
        : newMember.value.japanFarm || '',
    japanReason:
      newMember.value.japanPurchase === 'no'
        ? newMember.value.japanReason || '-'
        : newMember.value.japanReason || '',
    experience: newMember.value.experience || '',
    fishPreference: newMember.value.fishPreference || '',
  }
  const interestsArray = toInterestsArray(flatFields)

  // รวมรายการใหม่เข้ากับ purchaseHistory ก่อนบันทึก
  const finalPurchaseHistory = [
    ...(newMember.value.purchaseHistory || []),
    ...newlyAddedPurchaseHistory.value,
  ]

  const payload = {
    ...newMember.value,
    interests: interestsArray,
    purchaseHistory: finalPurchaseHistory,
    requirements: newMember.value.requirements || '',
    code: props.data ? newMember.value.code : buildPrefix(),
    username: newMember.value.username || undefined,
  }

  if (props.data) {
    mutateUpdate({
      ...payload,
      _id: props.data._id,
      cat: props.data.cat,
      uat: props.data.uat,
    })
  } else {
    mutate({
      ...payload,
    })
  }
}

const queryClient = useQueryClient()
const { mutate, isPending } = useMutation({
  mutationFn: (payload: CreateMemberPayload) => memberStore.onCreateMember(payload),
  onSuccess: (data: { data?: unknown; error?: { keyPattern?: { username?: number } } }) => {
    if (data.data) {
      toast.success('เพิ่มลูกค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_members'] })
      closeAddModal()
      isSubmitting.value = false
    } else {
      toast.error(
        data.error?.keyPattern?.username === 1
          ? 'กรุณาระบุชื่อผู้ใช้งานใหม่'
          : 'เพิ่มลูกค้าไม่สำเร็จ'
      )
      isSubmitting.value = false
    }
  },
})

const { mutate: mutateUpdate, isPending: isPendingUpdate } = useMutation({
  mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
  onSuccess: (data: { data?: unknown; error?: unknown }) => {
    if (data.data) {
      toast.success('แก้ไขข้อมูลลูกค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_members'] })
      queryClient.invalidateQueries({ queryKey: ['get_member_id', props.data?._id] })
      closeAddModal()
      isSubmitting.value = false
    } else {
      toast.error('แก้ไขข้อมูลลูกค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
})

// Mutation สำหรับเปลี่ยนรหัสผ่าน
const { mutate: mutateResetPassword, isPending: isPendingResetPassword } = useMutation({
  mutationFn: (payload: ResetPasswordPayload) => memberStore.onResetPassword(payload),
  onSuccess: (data: { data?: { modifiedCount?: number }; error?: unknown }) => {
    if (data.data?.modifiedCount && data.data.modifiedCount > 0) {
      toast.success('รีเซ็ตรหัสผ่านสำเร็จ')
      // Reset password fields
      resetPasswordFields()
    } else {
      toast.error('รีเซ็ตรหัสผ่านไม่สำเร็จ')
    }
  },
  onError: () => {
    toast.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
  },
})

// Handler สำหรับเปลี่ยนรหัสผ่าน
const handleResetPassword = () => {
  if (!newPassword.value || !confirmPassword.value) {
    toast.error('กรุณากรอกรหัสผ่านให้ครบถ้วน')
    return
  }

  if (!passwordValidation.value?.isValid) {
    toast.error('รหัสผ่านไม่ตรงตามเงื่อนไข')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('รหัสผ่านไม่ตรงกัน')
    return
  }

  if (!props.data?._id) {
    toast.error('เกิดข้อผิดพลาดกรุณาลองใหม่อีกครั้ง')
    return
  }

  mutateResetPassword({ id: props.data._id, password: newPassword.value })
}

function buildPrefix() {
  // รหัสลูกค้าใช้ Cs เท่านั้น ไม่เปลี่ยนตามสถานะ
  const maxNumber = props.memberData
    .map((member) => member.code)
    .filter((code) => code?.toLowerCase().startsWith('cs'))
    .map((code) => {
      // รองรับทั้ง Cs และ cs (case insensitive)
      const numStr = code.replace(/^cs/i, '')
      return parseInt(numStr, 10) || 0
    })
    .reduce((max, num) => Math.max(max, num), 0)
  return `Cs${String(maxNumber + 1).padStart(4, '0')}`
}

const originalPurchaseHistory = ref<string[]>([])

// State สำหรับเก็บรายการใหม่ที่เพิ่มใน session นี้ (ยังไม่ได้บันทึก)
const newlyAddedPurchaseHistory = ref<string[]>([])

// State สำหรับ tracking รายการที่อยู่ในโหมดแก้ไข
const editingSaleIds = ref<Set<string>>(new Set())

// สร้าง computed property สำหรับรายการเก่าที่บันทึกแล้ว
// แสดงเฉพาะรายการที่อยู่ใน originalPurchaseHistory และยังอยู่ใน newMember.purchaseHistory
const existingPurchaseHistory = computed(() => {
  if (!originalPurchaseHistory.value || originalPurchaseHistory.value.length === 0) {
    return []
  }

  // แสดงเฉพาะรายการที่อยู่ใน originalPurchaseHistory (บันทึกแล้ว)
  // และยังอยู่ใน newMember.purchaseHistory (ยังไม่ถูกลบ)
  return originalPurchaseHistory.value.filter((saleId) =>
    newMember.value.purchaseHistory?.includes(saleId)
  )
})
</script>

<template>
  <Dialog
    v-model:visible="showAddModal"
    @update:visible="closeAddModal"
    modal
    :header="props.data ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'"
    :style="{ width: '65rem' }"
    :breakpoints="{ '1199px': '85vw', '575px': '90vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <div class="space-y-4">
      <!-- ข้อมูลลูกค้า - Panel -->
      <Panel toggleable collapsed>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-user text-blue-600"></i>
            <span class="font-semibold! text-gray-900">ข้อมูลลูกค้า</span>
            <span v-if="!!props.data" class="text-xs text-gray-500 ml-auto">
              รหัสลูกค้า: {{ props.data?.code }}
            </span>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- ข้อมูลส่วนตัว -->
          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">ชื่อเล่น *</label>
            <InputText
              v-model="newMember.displayName"
              placeholder="กรุณาใส่ชื่อเล่น"
              :invalid="!newMember.displayName && isSubmitting"
              fluid
              size="small"
            />
            <small v-if="!newMember.displayName && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาระบุชื่อเล่น</small
            >
          </div>

          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <InputText
              v-model="newMember.name"
              placeholder="กรุณาใส่ชื่อ-นามสกุล"
              fluid
              size="small"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-semibold! text-gray-700 mb-1">ที่อยู่</label>
            <Textarea
              v-model="newMember.address"
              placeholder="กรุณาใส่ที่อยู่"
              rows="3"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">จังหวัด</label>
            <Select
              v-model="newMember.province"
              :options="memberStore.provinceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกจังหวัด"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <InputText
              v-model="newMember.phone"
              placeholder="กรุณาใส่เบอร์โทรศัพท์"
              fluid
              size="small"
            />
          </div>
          <!-- Dynamic Contacts -->
          <div
            v-for="(contact, contactIndex) in newMember.contacts"
            :key="contact.index"
            class="border border-gray-200 rounded-lg p-3 md:col-span-2"
          >
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-semibold! text-gray-700">
                ช่องทางติดต่อ {{ contactIndex + 1 }}
                <span v-if="contactIndex === 0" class="text-red-500">*</span>
              </h4>
              <Button
                v-if="newMember.contacts.length > 1 && contactIndex !== 0"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                @click="removeContact(contact.index)"
                v-tooltip.top="'ลบช่องทางติดต่อ'"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <Select
                  :modelValue="contact.type"
                  @update:modelValue="(value) => updateContact(contact.index, 'type', value)"
                  :options="memberStore.memberContactOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกช่องทางติดต่อ"
                  :invalid="isSubmitting && contactIndex === 0 && !contact.type"
                  fluid
                  size="small"
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <img
                        v-if="slotProps.option.icon"
                        :src="getContactIcon(slotProps.option.icon)"
                        :alt="slotProps.option.label"
                        class="w-5 h-5 object-contain"
                      />
                      <span>{{ slotProps.option.label }}</span>
                    </div>
                  </template>
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="flex items-center gap-2">
                      <img
                        v-if="getSelectedContactIcon(slotProps.value)"
                        :src="getSelectedContactIcon(slotProps.value)"
                        :alt="getSelectedContactLabel(slotProps.value)"
                        class="w-5 h-5 object-contain"
                      />
                      <span>{{ getSelectedContactLabel(slotProps.value) }}</span>
                    </div>
                    <span v-else>{{ slotProps.placeholder }}</span>
                  </template>
                </Select>
                <small
                  v-if="isSubmitting && contactIndex === 0 && !contact.type"
                  class="text-red-500 text-xs mt-1"
                >
                  กรุณาเลือกช่องทางติดต่อ
                </small>
              </div>

              <div>
                <InputText
                  :modelValue="contact.value"
                  @update:modelValue="(value) => updateContact(contact.index, 'value', value)"
                  placeholder="กรุณาใส่ชื่อช่องทางติดต่อ"
                  :invalid="isSubmitting && contactIndex === 0 && !contact.value"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && contactIndex === 0 && !contact.value"
                  class="text-red-500 text-xs mt-1"
                >
                  กรุณาระบุชื่อช่องทางติดต่อ
                </small>
              </div>
            </div>
          </div>

          <!-- Add Contact Button -->
          <div class="flex justify-center md:col-span-2">
            <Button
              v-if="newMember.contacts.length < 5"
              label="เพิ่มช่องทางติดต่อ"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              outlined
              @click="addContact"
            />
            <div v-else class="text-sm text-gray-500 text-center">
              เพิ่มช่องทางติดต่อได้สูงสุด 5 ช่องทาง
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">สถานะลูกค้า *</label>
            <Select
              v-model="newMember.status"
              :options="memberStore.memberStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสถานะลูกค้า"
              :invalid="!newMember.status && isSubmitting"
              fluid
              size="small"
            />
            <small v-if="!newMember.status && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาเลือกสถานะลูกค้า</small
            >
          </div>

          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">ระดับลูกค้า *</label>
            <Select
              v-model="newMember.customerLevel"
              :options="memberStore.customerLevelOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกระดับลูกค้า"
              :invalid="!newMember.customerLevel && isSubmitting"
              fluid
              size="small"
            />
            <small v-if="!newMember.customerLevel && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาเลือกระดับลูกค้า</small
            >
          </div>

          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">ประเภทลูกค้า</label>
            <Select
              v-model="newMember.type"
              :options="memberStore.customerTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกประเภทลูกค้า"
              fluid
              size="small"
            />
          </div>
        </div>
      </Panel>

      <!-- ข้อมูลพฤติกรรม ความสนใจของลูกค้า - Panel -->
      <Panel toggleable collapsed>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-heart text-purple-600"></i>
            <span class="font-semibold! text-gray-900">ข้อมูลพฤติกรรมความสนใจของลูกค้า</span>
          </div>
        </template>

        <div class="space-y-6">
          <!-- พฤติกรรมการเลี้ยง -->
          <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">ระดับในการเลี้ยง</label>
            <Select
              v-model="newMember.breedingBehavior"
              :options="memberStore.breedingBehaviorOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกพฤติกรรมการเลี้ยง"
              fluid
              size="small"
            >
              <template #option="slotProps">
                <div class="flex flex-col">
                  <span class="font-bold text-gray-900">{{ slotProps.option.title }}</span>
                  <span class="text-sm text-gray-500">{{ slotProps.option.description }}</span>
                </div>
              </template>
            </Select>
          </div>

          <!-- สายพันธุ์ที่ชอบ -->
          <div>
            <h4 class="font-semibold! text-gray-800 mb-1.5">สายพันธุ์ที่ชอบ</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >Gosanke ลูกค้าชอบปลาสายพันธุ์อะไรมากที่สุด</label
                >
                <Select
                  v-model="newMember.gosanke"
                  :options="memberStore.gosankeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก Gosanke"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >Non-Gosanke ลูกค้าชอบสายพันธุ์อะไร</label
                >
                <Select
                  v-model="newMember.nonGosanke"
                  :options="memberStore.nonGosankeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก Non-Gosanke"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >Variety สีล้วน ลูกค้าชอบสายพันธุ์อะไรมากที่สุด</label
                >
                <Select
                  v-model="newMember.variety"
                  :options="memberStore.varietyOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก Variety สีล้วน"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ชอบเลี้ยงปลาอายุเท่าไร</label
                >
                <Select
                  v-model="newMember.fishAge"
                  :options="memberStore.fishAgeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกอายุปลา"
                  fluid
                  size="small"
                />
              </div>
            </div>
          </div>

          <!-- ข้อมูลการเลี้ยง -->
          <div>
            <h4 class="font-semibold! text-gray-800 mb-1.5">ข้อมูลการเลี้ยง</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1">ระดับงบประมาณ</label>
                <Select
                  v-model="newMember.budgetLevel"
                  :options="memberStore.budgetLevelOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกระดับงบประมาณ"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ใช้จุลินทรีย์ยี่ห้ออะไร</label
                >
                <Select
                  v-model="newMember.bacteriaUsage"
                  :options="memberStore.bacteriaUsageOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกใช้จุลินทรีย์หรือไม่"
                  fluid
                  size="small"
                />
              </div>

              <div v-if="newMember.bacteriaUsage === 'yes'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ยี่ห้อจุลินทรีย์</label
                >
                <InputText
                  v-model="newMember.bacteriaBrand"
                  placeholder="กรอกยี่ห้อจุลินทรีย์"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ใช้อาหารยี่ห้ออะไร</label
                >
                <InputText
                  v-model="newMember.foodBrand"
                  placeholder="กรอกยี่ห้ออาหาร"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ล้างกรองเองหรือมีบริษัทล้างให้</label
                >
                <Select
                  v-model="newMember.filterCleaning"
                  :options="memberStore.filterCleaningOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกวิธีการล้างกรอง"
                  fluid
                  size="small"
                />
              </div>

              <div v-if="newMember.filterCleaning === 'company'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1">บริษัทรับล้าง</label>
                <InputText
                  v-model="newMember.filterCleaningCompany"
                  placeholder="กรอกชื่อบริษัท"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1">ขนาดบ่อเลี้ยง</label>
                <InputText
                  v-model="newMember.pondSize"
                  placeholder="กรอกขนาดบ่อเลี้ยง"
                  fluid
                  size="small"
                />
              </div>

              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >วิธีการให้อาหาร</label
                >
                <Select
                  v-model="newMember.feedingMethod"
                  :options="memberStore.feedingMethodOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือกวิธีการให้อาหาร"
                  fluid
                  size="small"
                />
              </div>
            </div>
          </div>

          <!-- โน้ตพฤติกรรมลูกค้า -->
          <!-- <div>
            <label class="block text-sm font-semibold! text-gray-700 mb-1">โน้ตพฤติกรรมลูกค้า</label>
            <Textarea
              v-model="newMember.behaviorNotes"
              placeholder="บันทึกโน้ตพฤติกรรมลูกค้า..."
              rows="3"
              fluid
              size="small"
            />
          </div> -->

          <!-- กิจกรรมและประสบการณ์ -->
          <div>
            <h4 class="font-semibold! text-gray-800 mb-1.5">กิจกรรมและประสบการณ์</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <!-- ชอบส่งปลางานประกวดหรือไม่ -->
              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ชอบส่งปลางานประกวดหรือไม่</label
                >
                <Select
                  v-model="newMember.contestParticipation"
                  :options="memberStore.contestParticipationOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก"
                  fluid
                  size="small"
                />
              </div>

              <div v-if="newMember.contestParticipation === 'no'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เหตุผล <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.contestParticipationReason"
                  placeholder="กรอกเหตุผล"
                  :invalid="isSubmitting && !newMember.contestParticipationReason?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.contestParticipationReason?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกเหตุผล</small
                >
              </div>

              <!-- เคยร่วมกิจกรรมแข่งเลี้ยง รับเงินรางวัล หรือไม่ -->
              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เคยร่วมกิจกรรมแข่งเลี้ยง รับเงินรางวัล หรือไม่</label
                >
                <Select
                  v-model="newMember.competitionParticipation"
                  :options="memberStore.competitionParticipationOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก"
                  fluid
                  size="small"
                />
              </div>

              <div v-if="newMember.competitionParticipation === 'yes'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ฟาร์มไหน <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.competitionFarm"
                  placeholder="กรอกฟาร์ม"
                  :invalid="isSubmitting && !newMember.competitionFarm?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.competitionFarm?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกฟาร์ม</small
                >
              </div>

              <div v-if="newMember.competitionParticipation === 'no'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เหตุผล <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.competitionReason"
                  placeholder="กรอกเหตุผล"
                  :invalid="isSubmitting && !newMember.competitionReason?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.competitionReason?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกเหตุผล</small
                >
              </div>

              <!-- เคยประมูลปลาออนไลน์หรือไม่ -->
              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เคยประมูลปลาออนไลน์หรือไม่ เช่น Sakai Auction Online , Dainishi Auction Online
                  เป็นต้นฯ</label
                >
                <Select
                  v-model="newMember.onlineAuction"
                  :options="memberStore.onlineAuctionOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก"
                  fluid
                  size="small"
                />
              </div>

              <div v-if="newMember.onlineAuction === 'yes'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ประมูลกับฟาร์มไหน <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.auctionFarm"
                  placeholder="กรอกฟาร์ม"
                  :invalid="isSubmitting && !newMember.auctionFarm?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.auctionFarm?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกฟาร์ม</small
                >
              </div>

              <div v-if="newMember.onlineAuction === 'no'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เหตุผล <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.auctionReason"
                  placeholder="กรอกเหตุผล"
                  :invalid="isSubmitting && !newMember.auctionReason?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.auctionReason?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกเหตุผล</small
                >
              </div>

              <!-- เคยไปซื้อปลาคาร์ฟที่ญี่ปุ่นหรือไม่ -->
              <div>
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เคยไปซื้อปลาคาร์ฟที่ญี่ปุ่นหรือไม่</label
                >
                <Select
                  v-model="newMember.japanPurchase"
                  :options="memberStore.japanPurchaseOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="เลือก"
                  fluid
                  size="small"
                />
              </div>

              <div v-if="newMember.japanPurchase === 'yes'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >ไปกับฟาร์มไหน <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.japanFarm"
                  placeholder="กรอกฟาร์ม"
                  :invalid="isSubmitting && !newMember.japanFarm?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.japanFarm?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกฟาร์ม</small
                >
              </div>

              <div v-if="newMember.japanPurchase === 'no'">
                <label class="block text-sm font-semibold! text-gray-700 mb-1"
                  >เหตุผล <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="newMember.japanReason"
                  placeholder="กรอกเหตุผล"
                  :invalid="isSubmitting && !newMember.japanReason?.trim()"
                  fluid
                  size="small"
                />
                <small
                  v-if="isSubmitting && !newMember.japanReason?.trim()"
                  class="text-red-500 text-xs mt-1"
                  >กรุณากรอกเหตุผล</small
                >
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <!-- ข้อมูลการซื้อสินค้า - Panel (แสดงเฉพาะเมื่อแก้ไข) -->
      <Panel v-if="props.data" toggleable collapsed>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-shopping-bag text-green-600"></i>
            <span class="font-semibold! text-gray-900">ประวัติการซื้อสินค้า</span>
          </div>
        </template>

        <div class="space-y-6">
          <!-- ประวัติซื้อสินค้า (แสดงเฉพาะเมื่อแก้ไข) -->
          <div>
            <label class="block text-sm font-[600]! text-gray-700 mb-1">เพิ่มรายการซื้อ</label>
            <!-- Select dropdown สำหรับเลือกรายการขาย -->
            <div class="flex gap-2 mb-3">
              <Select
                v-model="selectedSaleId"
                :options="saleOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกรายการขาย"
                fluid
                filter
                filterBy="sale.item"
                size="small"
                :disabled="!saleOptions.length"
              />
              <Button
                icon="pi pi-plus"
                size="small"
                severity="success"
                v-tooltip.top="'เพิ่มรายการซื้อ'"
                @click="addPurchaseHistory"
                :disabled="!selectedSaleId"
              />
            </div>

            <!-- แสดง card สรุปข้อมูลรายการซื้อใหม่ (ยังไม่ได้บันทึก) -->
            <div v-if="newlyAddedPurchaseHistory.length > 0" class="space-y-3">
              <label class="block text-sm font-[600]! text-gray-700 mb-2">
                รายการใหม่ (ยังไม่ได้บันทึก) ({{ newlyAddedPurchaseHistory.length }})
              </label>
              <PurchaseHistoryPanel
                v-for="saleId in newlyAddedPurchaseHistory"
                :key="`new-${saleId}`"
                :sale-id="saleId"
                :sale="getSaleById(saleId)"
                :is-setting="true"
                :is-new="true"
                @on-delete="removePurchaseHistory"
              />
            </div>
          </div>

          <!-- แสดงรายการที่บันทึกแล้ว (แยกจากรายการใหม่) -->
          <div v-if="existingPurchaseHistory.length > 0" class="mt-4">
            <label class="block text-sm font-[600]! text-gray-700 mb-2">
              รายการที่บันทึกแล้ว ({{ existingPurchaseHistory.length }})
            </label>

            <div class="space-y-3">
              <PurchaseHistoryPanel
                v-for="saleId in existingPurchaseHistory"
                :key="`existing-${saleId}`"
                :sale-id="saleId"
                :sale="getSaleById(saleId)"
                :is-setting="true"
                :is-new="false"
                @on-delete="removePurchaseHistory"
              />
            </div>
          </div>
        </div>
      </Panel>

      <!-- ข้อมูลบัญชีประมูล - Panel -->
      <Panel toggleable collapsed>
        <template #header>
          <div class="flex items-center gap-2">
            <i class="pi pi-shield text-amber-600"></i>
            <span class="font-semibold! text-gray-900">จัดการบัญชีประมูล</span>
          </div>
        </template>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold! text-gray-700 mb-1">ชื่อผู้ใช้</label>
              <InputText
                v-model="newMember.username"
                placeholder="กรุณาใส่ชื่อผู้ใช้"
                fluid
                size="small"
                autocomplete="off"
              />
            </div>

            <!-- แสดงรหัสผ่านเฉพาะเมื่อสร้างใหม่ และยังไม่มีประวัติการซื้อ -->
            <div v-if="!props.data">
              <label class="block text-sm font-semibold! text-gray-700 mb-1">รหัสผ่าน</label>
              <Password
                v-model="newMember.password"
                placeholder="กรุณาใส่รหัสผ่าน"
                :feedback="false"
                toggleMask
                fluid
                size="small"
                autocomplete="new-password"
              />
            </div>

            <!-- แสดงสถานะยูสเซอร์เฉพาะเมื่อสร้างใหม่ -->
            <div v-if="!props.data">
              <label class="block text-sm font-semibold! text-gray-700 mb-1">สถานะยูสเซอร์</label>
              <Select
                v-model="newMember.bidder"
                :options="[
                  { label: 'เปิดใช้งาน', value: true },
                  { label: 'ล็อค', value: false },
                ]"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกสถานะยูสเซอร์"
                fluid
                size="small"
              />
            </div>
          </div>

          <!-- ส่วนเปลี่ยนรหัสผ่าน (แสดงเฉพาะเมื่อแก้ไข) -->
          <div v-if="props.data" class="border-t border-gray-200 pt-6">
            <div class="space-y-4">
              <!-- Header Section -->
              <div
                class="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100"
              >
                <div
                  class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center"
                >
                  <i class="pi pi-key text-white text-lg"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-base font-semibold! text-gray-800">รีเซ็ตรหัสผ่าน</h3>
                  <p class="text-sm text-gray-600">
                    {{ props.data.displayName || props.data.name }}
                  </p>
                </div>
              </div>

              <!-- Password Form -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="block text-sm font-semibold! text-gray-700">รหัสผ่านใหม่ *</label>
                  <Password
                    v-model="newPassword"
                    placeholder="กรุณาใส่รหัสผ่านใหม่"
                    :feedback="true"
                    :invalid="!passwordValidation?.isValid && newPassword.length > 0"
                    toggleMask
                    fluid
                    size="small"
                    :pt="{
                      input: 'w-full',
                      panel: 'mt-2',
                    }"
                  />

                  <!-- Password Requirements -->
                  <div v-if="newPassword" class="mt-3 space-y-2">
                    <p class="text-xs font-medium text-gray-600 mb-2">เงื่อนไขรหัสผ่าน:</p>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div class="flex items-center space-x-2">
                        <i
                          :class="
                            passwordValidation?.minLength
                              ? 'pi pi-check text-green-500'
                              : 'pi pi-times text-red-500'
                          "
                        ></i>
                        <span
                          :class="passwordValidation?.minLength ? 'text-green-600' : 'text-red-600'"
                        >
                          อย่างน้อย 8 ตัวอักษร
                        </span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <i
                          :class="
                            passwordValidation?.hasNumbers
                              ? 'pi pi-check text-green-500'
                              : 'pi pi-times text-red-500'
                          "
                        ></i>
                        <span
                          :class="
                            passwordValidation?.hasNumbers ? 'text-green-600' : 'text-red-600'
                          "
                        >
                          ตัวเลข 1 ตัวขึ้นไป
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-semibold! text-gray-700">ยืนยันรหัสผ่าน *</label>
                  <Password
                    v-model="confirmPassword"
                    placeholder="กรุณายืนยันรหัสผ่าน"
                    :feedback="false"
                    :invalid="!!(confirmPassword && newPassword !== confirmPassword)"
                    toggleMask
                    fluid
                    size="small"
                  />
                  <small
                    v-if="confirmPassword && newPassword !== confirmPassword"
                    class="text-red-500 text-xs"
                  >
                    รหัสผ่านไม่ตรงกัน
                  </small>
                </div>
              </div>

              <!-- Warning Message -->
              <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-start space-x-3">
                  <i class="pi pi-exclamation-triangle text-yellow-600 text-lg mt-0.5"></i>
                  <div>
                    <h4 class="text-sm font-medium text-yellow-800">คำเตือน</h4>
                    <p class="text-xs text-yellow-700 mt-1">
                      การรีเซ็ตรหัสผ่านจะทำให้ผู้ใช้ไม่สามารถเข้าสู่ระบบด้วยรหัสผ่านเดิมได้
                      กรุณาแจ้งให้ผู้ใช้ทราบถึงรหัสผ่านใหม่
                    </p>
                  </div>
                </div>
              </div>

              <!-- Reset Password Button -->
              <div class="flex justify-end">
                <Button
                  label="รีเซ็ตรหัสผ่าน"
                  icon="pi pi-key"
                  @click="handleResetPassword"
                  :loading="isPendingResetPassword"
                  :disabled="!isPasswordFormValid"
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>

    <template #footer>
      <div class="pt-2 flex gap-3">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          severity="secondary"
          @click="closeAddModal"
          size="small"
          outlined
        />
        <Button
          label="ยืนยัน"
          icon="pi pi-check"
          @click="handleAddMember"
          :loading="isPending || isPendingUpdate"
          severity="success"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
