import { defineStore } from 'pinia'
import api from '@/utils/axios'
import { ref } from 'vue'

export const useMemberStore = defineStore('member', () => {

  const memberStatusOptions = ref([
    { label: 'CS', value: 'cs' },
    { label: 'LP', value: 'lp' },
    { label: 'EQ', value: 'eq' },
    { label: 'CSS', value: 'css' },
  ])

  const memberContactOptions = ref([
    { label: 'Facebook', value: 'facebook' },
    { label: 'Line Official', value: 'line_official' },
    { label: 'Line พี่เบิท', value: 'line_pibet' },
    { label: 'Line กลุ่ม', value: 'line_group' },
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

  async function onUpdateMember(payload: CreateMemberPayload) {
    const { data } = await api.put(`/user`, payload)
    return data
  }

  async function onResetPassword(payload: ResetPasswordPayload) {
    const { data } = await api.put(`/user/reset/password`, payload)
    return data
  }

  return {
    onGetMembers,
    onGetMemberID,
    onDeleteMember,
    onCreateMember,
    onUpdateMember,

    onResetPassword,

    memberStatusOptions,
    memberContactOptions,
  }
})

export interface IMember {
  _id: string
  code: string //รหัสลูกค้า
  status: string //สถานะ
  contact: string //ช่องทางติดต่อ
  contactName: string //ชื่อติดต่อ
  displayName: string //ชื่อเล่น
  name?: string //ชื่อ/สกุล
  address?: string //ที่อยู่
  province?: string //จังหวัด
  phone?: string //เบอร์โทร
  type: string //ประเภทลูกค้า
  interest?: string // ความสนใจ
  username?: string //ยูสเซอร์
  password?: string //รหัสผ่าน
  bidder?: boolean //สถานะยูสเซอร์

  cat: number
  uat: number
}

export interface CreateMemberPayload {
  status: string
  contact: string
  contactName: string
  displayName: string
  name: string
  address: string
  province: string
  phone: string
  type: string
  interest: string
  username: string
  password: string
  bidder: boolean
}


export interface ResetPasswordPayload {
  id: string
  password: string
}
