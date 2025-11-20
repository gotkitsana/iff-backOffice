import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { ref } from 'vue'

export const useMemberStore = defineStore('member', () => {
  // สถานะลูกค้าใหม่: สอบถาม, ซื้อแล้ว, Hot/Warm/Cold Active
  const memberStatusOptions = ref<{ label: MemberStatusLabel; value: MemberStatus }[]>([
    { label: 'สอบถาม', value: 'ci' },
    { label: 'ซื้อแล้ว', value: 'cs' },
    { label: 'ลูกค้า Hot Active', value: 'hot_active' },
    { label: 'ลูกค้า Warm Active', value: 'warm_active' },
    { label: 'ลูกค้า Cold Active', value: 'cold_active' },
  ])

  // ระดับลูกค้า
  const customerLevelOptions = ref<{ label: CustomerLevelLabel; value: CustomerLevel }[]>([
    { label: 'ทั่วไป', value: 'general' },
    { label: 'สำคัญ', value: 'vip' },
    { label: 'สำคัญมาก', value: 'vvip' },
  ])

  const customerTypeOptions = ref<{ label: CustomerTypeLabel; value: CustomerType }[]>([
    { label: 'ลูกค้า', value: 'customer' },
    { label: 'พ่อค้าฟาร์ม', value: 'dealer' },
  ])

  const getStatusTag = (status: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' => {
    switch (status) {
      case 'ci':
        return 'secondary'
      case 'cs':
        return 'success'
      case 'hot_active':
        return 'danger'
      case 'warm_active':
        return 'warn'
      case 'cold_active':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const memberContactOptions = ref([
    { label: 'Facebook', value: 'facebook' },
    { label: 'Line Official', value: 'line_oa' },
    { label: 'Line พี่เบิท', value: 'line_chat' },
    { label: 'Line กลุ่ม', value: 'line_group' },
    { label: 'TikTok', value: 'tiktok' },
  ])

  async function onGetMembers() {
    const { data } = await api.get(`/user`)
    return data.data
  }

  async function onGetMemberID(id: string) {
    const { data } = await api.get(`/user?id=${id}`)
    return data.data
  }

  async function onDeleteMember(id: string) {
    const { data } = await api.delete(`/user?id=${id}`)
    return data
  }

  async function onCreateMember(payload: CreateMemberPayload) {
    const { data } = await api.post(`/user`, payload)
    return data
  }

  async function onUpdateMember(payload: UpdateMemberPayload) {
    const { data } = await api.put(`/user`, payload)
    return data
  }

  async function onResetPassword(payload: ResetPasswordPayload) {
    const { data } = await api.put(`/user/reset/password`, payload)
    return data
  }

  const provinceOptions = [
    { label: 'กรุงเทพมหานคร', value: 'bangkok' },
    { label: 'กระบี่', value: 'krabi' },
    { label: 'กาญจนบุรี', value: 'kanchanaburi' },
    { label: 'กาฬสินธุ์', value: 'kalasin' },
    { label: 'กำแพงเพชร', value: 'kamphaengphet' },
    { label: 'ขอนแก่น', value: 'khonkaen' },
    { label: 'จันทบุรี', value: 'chanthaburi' },
    { label: 'ฉะเชิงเทรา', value: 'chachoengsao' },
    { label: 'ชลบุรี', value: 'chonburi' },
    { label: 'ชัยนาท', value: 'chainat' },
    { label: 'ชัยภูมิ', value: 'chaiyaphum' },
    { label: 'ชุมพร', value: 'chumphon' },
    { label: 'เชียงราย', value: 'chiangrai' },
    { label: 'เชียงใหม่', value: 'chiangmai' },
    { label: 'ตรัง', value: 'trang' },
    { label: 'ตราด', value: 'trat' },
    { label: 'ตาก', value: 'tak' },
    { label: 'นครนายก', value: 'nakhonnayok' },
    { label: 'นครปฐม', value: 'nakhonpathom' },
    { label: 'นครพนม', value: 'nakhonphanom' },
    { label: 'นครราชสีมา', value: 'nakhonratchasima' },
    { label: 'นครศรีธรรมราช', value: 'nakhonsithammarat' },
    { label: 'นครสวรรค์', value: 'nakhonsawan' },
    { label: 'นนทบุรี', value: 'nonthaburi' },
    { label: 'นราธิวาส', value: 'narathiwat' },
    { label: 'น่าน', value: 'nan' },
    { label: 'บึงกาฬ', value: 'buengkan' },
    { label: 'บุรีรัมย์', value: 'buriram' },
    { label: 'ปทุมธานี', value: 'pathumthani' },
    { label: 'ประจวบคีรีขันธ์', value: 'prachuapkhirikhan' },
    { label: 'ปราจีนบุรี', value: 'prachinburi' },
    { label: 'ปัตตานี', value: 'pattani' },
    { label: 'พระนครศรีอยุธยา', value: 'phranakhonsiayutthaya' },
    { label: 'พะเยา', value: 'phayao' },
    { label: 'พังงา', value: 'phangnga' },
    { label: 'พัทลุง', value: 'phatthalung' },
    { label: 'พิจิตร', value: 'phichit' },
    { label: 'พิษณุโลก', value: 'phitsanulok' },
    { label: 'เพชรบุรี', value: 'phetchaburi' },
    { label: 'เพชรบูรณ์', value: 'phetchabun' },
    { label: 'แพร่', value: 'phrae' },
    { label: 'ภูเก็ต', value: 'phuket' },
    { label: 'มหาสารคาม', value: 'mahasarakham' },
    { label: 'มุกดาหาร', value: 'mukdahan' },
    { label: 'แม่ฮ่องสอน', value: 'maehongson' },
    { label: 'ยโสธร', value: 'yasothon' },
    { label: 'ยะลา', value: 'yala' },
    { label: 'ร้อยเอ็ด', value: 'roiet' },
    { label: 'ระนอง', value: 'ranong' },
    { label: 'ระยอง', value: 'rayong' },
    { label: 'ราชบุรี', value: 'ratchaburi' },
    { label: 'ลพบุรี', value: 'lopburi' },
    { label: 'ลำปาง', value: 'lampang' },
    { label: 'ลำพูน', value: 'lamphun' },
    { label: 'เลย', value: 'loei' },
    { label: 'ศรีสะเกษ', value: 'sisaket' },
    { label: 'สกลนคร', value: 'sakonnakhon' },
    { label: 'สงขลา', value: 'songkhla' },
    { label: 'สตูล', value: 'satun' },
    { label: 'สมุทรปราการ', value: 'samutprakan' },
    { label: 'สมุทรสงคราม', value: 'samutsongkhram' },
    { label: 'สมุทรสาคร', value: 'samutsakhon' },
    { label: 'สระแก้ว', value: 'sakaeo' },
    { label: 'สระบุรี', value: 'saraburi' },
    { label: 'สิงห์บุรี', value: 'singburi' },
    { label: 'สุโขทัย', value: 'sukhothai' },
    { label: 'สุพรรณบุรี', value: 'suphanburi' },
    { label: 'สุราษฎร์ธานี', value: 'suratthani' },
    { label: 'สุรินทร์', value: 'surin' },
    { label: 'หนองคาย', value: 'nongkhai' },
    { label: 'หนองบัวลำภู', value: 'nongbualamphu' },
    { label: 'อ่างทอง', value: 'angthong' },
    { label: 'อำนาจเจริญ', value: 'amnatcharoen' },
    { label: 'อุดรธานี', value: 'udonthani' },
    { label: 'อุตรดิตถ์', value: 'uttaradit' },
    { label: 'อุทัยธานี', value: 'uthaithani' },
    { label: 'อุบลราชธานี', value: 'ubonratchathani' },
  ]

  const memberTypeOptions = ref([
    { label: 'ลูกค้า', value: 'customer' },
    { label: 'ฟาร์ม', value: 'farm' },
    { label: 'คาเฟ่', value: 'cafe' },
  ])

  // ประเภทนักเลี้ยง (สำหรับ CRM)
  const breederTypeOptions = ref([
    { label: 'นักเลี้ยงมือใหม่', value: 'newbie' },
    { label: 'เลี้ยงดูพัฒนาการ', value: 'development' },
    { label: 'เลี้ยงประกวด', value: 'competition' },
  ])

  // เป้าหมายการเลี้ยง (สำหรับ CRM)
  const breedingGoalOptions = ref([
    { label: 'เลี้ยงสวยงาม', value: 'beauty' },
    { label: 'พัฒนาการเติบโต', value: 'growth' },
    { label: 'เลี้ยงประกวด', value: 'competition' },
    { label: 'ทำฟาร์มขาย', value: 'farm_sale' },
  ])

  // ระดับงบประมาณ (สำหรับ CRM)
  const budgetLevelOptions = ref([
    { label: 'งบน้อย (ไม่เกิน 5,000฿)', value: 'low' },
    { label: 'งบปานกลาง (ไม่เกิน 30,000฿)', value: 'medium' },
    { label: 'งบมาก (ไม่จำกัดถ้าถูกใจ)', value: 'high' },
  ])

  // พฤติกรรมการเลี้ยง
  const breedingBehaviorOptions = ref([
    {
      label: 'นักเลี้ยงมือใหม่ สนใจปลาขนาดเล็ก ราคาไม่สูง ต้องการคำแนะนำเยอะ',
      title: 'นักเลี้ยงมือใหม่',
      description: 'สนใจปลาขนาดเล็ก ราคาไม่สูง ต้องการคำแนะนำเยอะ',
      value: 'newbie',
    },
    {
      label: 'เลี้ยงพัฒนาการ ซื้อปลาไปเลี้ยงโต เน้นคุณภาพโครงสร้าง อาหาร น้ำ',
      title: 'เลี้ยงพัฒนาการ',
      description: 'ซื้อปลาไปเลี้ยงโต เน้นคุณภาพโครงสร้าง อาหาร น้ำ',
      value: 'development',
    },
    {
      label: 'เลี้ยงประกวด เน้นสายพันธุ์ การันตีลวดลาย เกรดสูง ต้องการบริการ After-sale',
      title: 'เลี้ยงประกวด',
      description: 'เน้นสายพันธุ์ การันตีลวดลาย เกรดสูง ต้องการบริการ After-sale',
      value: 'competition',
    },
    {
      label: 'นักสะสม เน้นลวดลายหายาก คุณภาพพิเศษ ตัวสวยไม่ซ้ำใคร',
      title: 'นักสะสม',
      description: 'เน้นลวดลายหายาก คุณภาพพิเศษ ตัวสวยไม่ซ้ำใคร',
      value: 'collector',
    },
  ])

  // Gosanke
  const gosankeOptions = ref([
    { label: 'Kohaku', value: 'kohaku' },
    { label: 'Sanke', value: 'sanke' },
    { label: 'Showa', value: 'showa' },
  ])

  // Non-Gosanke
  const nonGosankeOptions = ref([
    { label: 'Tancho', value: 'tancho' },
    { label: 'Susui', value: 'susui' },
    { label: 'Hi Utsuri', value: 'hi_utsuri' },
  ])

  // Variety สีล้วน
  const varietyOptions = ref([
    { label: 'Karashi', value: 'karashi' },
    { label: 'Benigoi', value: 'benigoi' },
    { label: 'Chagoi', value: 'chagoi' },
    { label: 'Yamabuki Ogon', value: 'yamabuki_ogon' },
  ])

  // ชอบเลี้ยงปลาอายุเท่าไร
  const fishAgeOptions = ref([
    { label: 'โตไซต์ Tosai เข้า 1ปี', value: 'tosai' },
    { label: 'นิไซท์ Ake Nisai 1ปี เข้า 2ปี', value: 'nisai' },
    { label: 'ซันไซท์ Sansai 3ปี', value: 'sansai' },
    { label: 'ยอนไซท์ Yonsai 4ปี', value: 'yonsai' },
    { label: 'โกไซท์ Gosai 5ปี', value: 'gosai' },
    { label: 'มากกว่า 5ปี', value: 'over_5' },
  ])

  // ใช้จุลินทรีย์
  const bacteriaUsageOptions = ref([
    { label: 'ไม่ใช้', value: 'no' },
    { label: 'ใช้', value: 'yes' },
  ])

  // ล้างกรอง
  const filterCleaningOptions = ref([
    { label: 'ล้างเอง', value: 'self' },
    { label: 'มีบริษัทรับล้าง', value: 'company' },
  ])

  // วิธีการให้อาหาร
  const feedingMethodOptions = ref([
    { label: 'ใช้เครื่องฟีด', value: 'feeder' },
    { label: 'ให้ด้วยตัวเอง', value: 'manual' },
  ])

  // Legacy options (เก็บไว้เพื่อ backward compatibility)
  const memberExperienceOptions = ref([
    { label: 'เป็นมือใหม่', value: 'newbie' },
    { label: 'เลี้ยงสวยงามที่บ้าน', value: 'hobbyist' },
    { label: 'สายประกวด', value: 'competitor' },
  ])

  const memberFishPreferenceOptions = ref([
    { label: 'ชอบเลี้ยงปลาใหญ่เลย', value: 'large' },
    { label: 'เลี้ยงTosai', value: 'tosai' },
    { label: 'Nisai ดูพัฒนาการ', value: 'nisai' },
  ])

  return {
    onGetMembers,
    onGetMemberID,
    onDeleteMember,
    onCreateMember,
    onUpdateMember,

    onResetPassword,

    memberStatusOptions,
    customerLevelOptions,
    customerTypeOptions,
    memberContactOptions,
    getStatusTag,
    provinceOptions,
    memberExperienceOptions,
    memberFishPreferenceOptions,
    breederTypeOptions,
    breedingGoalOptions,
    budgetLevelOptions,
    breedingBehaviorOptions,
    gosankeOptions,
    nonGosankeOptions,
    varietyOptions,
    fishAgeOptions,
    bacteriaUsageOptions,
    filterCleaningOptions,
    feedingMethodOptions,
  }
})

export interface IMember {
  _id: string
  code: string //รหัสลูกค้า (Cs เท่านั้น)
  status: MemberStatus //สถานะลูกค้า (ci, cs, hot_active, warm_active, cold_active)
  customerLevel: CustomerLevel //ระดับลูกค้า (general, important, very_important)
  displayName: string //ชื่อเล่น
  name?: string //ชื่อ/สกุล
  address?: string //ที่อยู่
  province?: string //จังหวัด
  phone?: string //เบอร์โทร
  type: string //ประเภทลูกค้า
  contacts?: { index: number; type: string; value: string }[] //{index:number,type:key ทางติดต่อ,value:ชื่อชองทางติดต่อ} []
  interests?: { index: number; type: InterestType; value: string }[] //{index:number,type:key ความสนใจ,value:ค่าความสนใจ} []
  behaviorNotes?: string //โน้ตพฤติกรรมลูกค้า
  purchaseHistory?: string[] //ประวัติซื้อสินค้า (array of sale IDs)
  requirements?: string //ความต้องการ (เช่น เน้นลาย, เน้นขนาด, เน้นบ่อดิน)

  // CRM fields (อาจจะเก็บใน interests หรือเป็นฟิลด์แยก)
  // lastContactDate?: string //วันที่ติดต่อล่าสุด
  // lastVisitDate?: string //วันที่มาฟาร์มล่าสุด
  lastPurchaseDate?: string //วันที่ซื้อล่าสุด
  totalPurchaseAmount?: number //ยอดซื้อรวม
  purchaseCount?: number //จำนวนครั้งที่ซื้อ

  username?: string | null //ยูสเซอร์
  password?: string | null //รหัสผ่าน
  bidder?: boolean //สถานะยูสเซอร์
  info?: string //ข้อมูล
  isVerify?: boolean
  image?: string
  email: string

  interest?: string
  contact?: string
  contactName?: string
  cat: number
  uat: number
}

export interface CreateMemberPayload {
  code: string
  status: MemberStatus | null
  customerLevel: CustomerLevel | null
  contacts: { index: number; type: string; value: string }[]
  interests: { index: number; type: InterestType; value: string }[]
  displayName: string
  name?: string
  address?: string
  province?: string
  phone?: string
  type?: string
  behaviorNotes?: string
  purchaseHistory?: string[]
  requirements?: string

  username?: string | null
  password?: string | null
  bidder?: boolean
}

export interface UpdateMemberPayload extends CreateMemberPayload {
  _id: string
  cat: number
  uat: number
  lastPurchaseDate?: string
  totalPurchaseAmount?: number
  purchaseCount?: number
}

export interface ResetPasswordPayload {
  id: string
  password: string
}

export type MemberStatus = 'ci' | 'cs' | 'hot_active' | 'warm_active' | 'cold_active'
export type MemberStatusLabel =
  | 'สอบถาม'
  | 'ซื้อแล้ว'
  | 'ลูกค้า Hot Active'
  | 'ลูกค้า Warm Active'
  | 'ลูกค้า Cold Active'

export type CustomerLevel = 'general' | 'vip' | 'vvip'
export type CustomerLevelLabel = 'ทั่วไป' | 'สำคัญ' | 'สำคัญมาก'

export type CustomerType = 'customer' | 'dealer'
export type CustomerTypeLabel = 'ลูกค้า' | 'พ่อค้าฟาร์ม'

/**
 * Types สำหรับ interests array
 * ใช้เก็บข้อมูลพฤติกรรมและความสนใจของลูกค้า
 */
export type InterestType =
  | 'breeding_behavior' // พฤติกรรมการเลี้ยง (newbie, development, competition, collector)
  | 'gosanke' // Gosanke (kohaku, sanke, showa)
  | 'non_gosanke' // Non-Gosanke (tancho, susui, hi_utsuri)
  | 'variety' // Variety สีล้วน (karashi, benigoi, chagoi, yamabuki_ogon)
  | 'fish_age' // ชอบเลี้ยงปลาอายุเท่าไร (tosai, nisai, sansai, yonsai, gosai, over_5)
  | 'budget_level' // ระดับงบประมาณ (low, medium, high)
  | 'bacteria_usage' // ใช้จุลินทรีย์หรือไม่ (no, yes)
  | 'bacteria_brand' // ยี่ห้อจุลินทรีย์ (text)
  | 'food_brand' // ยี่ห้ออาหาร (text)
  | 'filter_cleaning' // ล้างกรอง (self, company)
  | 'filter_cleaning_company' // บริษัทรับล้างกรอง (text)
  | 'pond_size' // ขนาดบ่อเลี้ยง (text)
  | 'feeding_method' // วิธีการให้อาหาร (feeder, manual)
  | 'experience' // Legacy: ความชำนาญในการเลี้ยง (deprecated)
  | 'fish_preference' // Legacy: ชอบปลาเล็กหรือปลาใหญ่ (deprecated)
