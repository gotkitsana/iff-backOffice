import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { ref } from 'vue'

export const useMemberStore = defineStore('member', () => {
  const memberStatusOptions = ref<{ label: MemberStatusLabel; value: MemberStatus }[]>([
    { label: 'สอบถาม', value: 'ci' },
    { label: 'ลูกค้าซื้อแล้ว', value: 'cs' },
    { label: 'ลูกค้าสำคัญ', value: 'css' },
  ])

  const getStatusTag = (status: string): 'secondary' | 'success' | 'warn' => {
    switch (status) {
      case 'Ci':
        return 'secondary'
      case 'Cs':
        return 'success'
      case 'Css':
        return 'warn'
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
    memberContactOptions,
    getStatusTag,
    provinceOptions,
    memberExperienceOptions,
    memberFishPreferenceOptions,
  }
})

export interface IMember {
  _id: string
  code: string //รหัสลูกค้า
  status: string //สถานะ
  displayName: string //ชื่อเล่น
  name?: string //ชื่อ/สกุล
  address?: string //ที่อยู่
  province?: string //จังหวัด
  phone?: string //เบอร์โทร
  type: string //ประเภทลูกค้า
  contacts?: { index: number; type: string; value: string }[] //{index:number,type:key ทางติดต่อ,value:ชื่อชองทางติดต่อ} []
  interests?: { index: number; type: string; value: string }[] //{index:number,type:key ความสนใจ,value:ค่าความสนใจ} []

  username?: string //ยูสเซอร์
  password?: string //รหัสผ่าน
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
  status: string
  contacts: { index: number; type: string; value: string }[]
  interests: { index: number; type: string; value: string }[]
  displayName: string
  name?: string
  address?: string
  province?: string
  phone?: string
  type?: string

  username?: string
  password?: string
  bidder?: boolean
}

export interface UpdateMemberPayload extends CreateMemberPayload {
  _id: string
  cat: number
  uat: number
}

export interface ResetPasswordPayload {
  id: string
  password: string
}


export type MemberStatus = 'ci' | 'cs' | 'css'
export type MemberStatusLabel = 'สอบถาม' | 'ลูกค้าซื้อแล้ว' | 'ลูกค้าสำคัญ'
