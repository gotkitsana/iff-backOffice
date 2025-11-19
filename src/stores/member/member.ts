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
    { label: 'สำคัญ', value: 'important' },
    { label: 'สำคัญมาก', value: 'very_important' },
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
    { label: 'งบน้อย', value: 'low' },
    { label: 'งบปานกลาง', value: 'medium' },
    { label: 'งบมาก', value: 'high' },
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
    memberContactOptions,
    getStatusTag,
    provinceOptions,
    memberExperienceOptions,
    memberFishPreferenceOptions,
    breederTypeOptions,
    breedingGoalOptions,
    budgetLevelOptions,
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
  interests?: { index: number; type: string; value: string }[] //{index:number,type:key ความสนใจ,value:ค่าความสนใจ} []
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
  interests: { index: number; type: string; value: string }[]
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

export type CustomerLevel = 'general' | 'important' | 'very_important'
export type CustomerLevelLabel = 'ทั่วไป' | 'สำคัญ' | 'สำคัญมาก'
