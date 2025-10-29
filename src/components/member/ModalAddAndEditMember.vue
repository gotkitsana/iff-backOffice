<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useMemberStore,
  type CreateMemberPayload,
  type IMember,
  type UpdateMemberPayload,
} from '@/stores/member/member'
import { Dialog, Textarea, Select, InputText } from 'primevue'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

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
    experience?: string
    fishPreference?: string
    pondSize?: string
    bacteriaBrand?: string
    foodBrand?: string
  }
>({
  status: '',
  code: '',
  contacts: [{ index: 0, type: '', value: '' }],
  interests: [],
  displayName: '',
  name: '',
  password: null,
  bidder: false,
  address: '',
  province: '',
  phone: '',
  type: '',
  username: null,
  experience: '',
  fishPreference: '',
  pondSize: '',
  bacteriaBrand: '',
  foodBrand: '',
})

const closeAddModal = () => {
  newMember.value = {
    status: '',
    code: '',
    contacts: [{ index: 0, type: '', value: '' }],
    interests: [],
    displayName: '',
    name: '',
    password: null,
    bidder: false,
    username: null,
    address: '',
    province: '',
    phone: '',
    type: '',
    experience: '',
    fishPreference: '',
    pondSize: '',
    bacteriaBrand: '',
    foodBrand: '',
  }
  emit('onCloseAddModal')
}

const memberStore = useMemberStore()

// ฟังก์ชันสำหรับจัดการ contacts
const addContact = () => {
  if (newMember.value.contacts.length < 5) {
    const newIndex = Math.max(...newMember.value.contacts.map((c) => c.index), -1) + 1
    newMember.value.contacts = [
      ...newMember.value.contacts,
      { index: newIndex, type: '', value: '' }
    ]
  }
}

const removeContact = (index: number) => {
  if (newMember.value.contacts.length > 1) {
    newMember.value.contacts = newMember.value.contacts.filter((c) => c.index !== index)
  }
}

const updateContact = (index: number, field: 'type' | 'value', value: string | undefined) => {
  newMember.value.contacts = newMember.value.contacts.map(contact =>
    contact.index === index
      ? { ...contact, [field]: value || '' }
      : contact
  )
}

watch(
  () => props.data,
  (newMemberData) => {
    if (newMemberData) {
      const experience = newMemberData.interests?.find(i => i.type === 'experience')?.value || ''
      const fishPreference = newMemberData.interests?.find(i => i.type === 'fish_preference')?.value || ''
      const pondSize = newMemberData.interests?.find(i => i.type === 'pond_size')?.value || ''
      const bacteriaBrand = newMemberData.interests?.find(i => i.type === 'bacteria_brand')?.value || ''
      const foodBrand = newMemberData.interests?.find(i => i.type === 'food_brand')?.value || ''

      newMember.value = {
        code: newMemberData.code,
        status: newMemberData.status,
        contacts: newMemberData.contacts && newMemberData.contacts.length > 0
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
        experience: experience,
        fishPreference: fishPreference,
        pondSize: pondSize,
        bacteriaBrand: bacteriaBrand,
        foodBrand: foodBrand,
      }
    }
  },
  { immediate: true }
)

const handleAddMember = () => {
  console.log(buildPrefix())
  isSubmitting.value = true

  // ตรวจสอบ contacts
  const hasValidContacts = newMember.value.contacts.some(
    (contact) =>
      contact.type && contact.value && contact.type.trim() !== '' && contact.value.trim() !== ''
  )

  const requiredInterests = [
    { type: 'experience', value: newMember.value.experience },
    { type: 'fish_preference', value: newMember.value.fishPreference },
    { type: 'pond_size', value: newMember.value.pondSize }
  ]
  const hasValidInterests = requiredInterests.every(interest =>
    interest.value && interest.value.trim() !== ''
  )

  if (!hasValidContacts) {
    toast.error('กรุณาระบุช่องทางติดต่ออย่างน้อย 1 ช่องทาง')
    return
  }

  if (!hasValidInterests) {
    toast.error('กรุณากรอกข้อมูลพฤติกรรมและความสนใจให้ครบถ้วน')
    return
  }

  if (!newMember.value.displayName) {
    toast.error('กรุณาระบุชื่อเล่น')
    return
  }

  const interestsArray = [
    { index: 0, type: 'experience', value: newMember.value.experience || '' },
    { index: 1, type: 'fish_preference', value: newMember.value.fishPreference || '' },
    { index: 2, type: 'pond_size', value: newMember.value.pondSize || '' },
    ...(newMember.value.bacteriaBrand ? [{ index: 3, type: 'bacteria_brand', value: newMember.value.bacteriaBrand }] : []),
    ...(newMember.value.foodBrand ? [{ index: 4, type: 'food_brand', value: newMember.value.foodBrand }] : [])
  ]

  const payload = {
    ...newMember.value,
    interests: interestsArray,
    code: props.data ? newMember.value.code : buildPrefix(),
    status: props.data ? newMember.value.status : 'ci',
    username: newMember.value.username || null,
  }

  if (props.data) {
    mutateUpdate({
      ...payload,
      _id: props.data._id,
      cat: props.data.cat,
      uat: props.data.uat,
    })
  } else {
    mutate(payload)
  }
}

const queryClient = useQueryClient()
const { mutate, isPending } = useMutation({
  mutationFn: (payload: CreateMemberPayload) => memberStore.onCreateMember(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('เพิ่มลูกค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_members'] })
      closeAddModal()
      isSubmitting.value = false
    } else {
      toast.error(data.error.keyPattern.username == 1 ? 'กรุณาระบุชื่อผู้ใช้งานใหม่' : 'เพิ่มลูกค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  }
})

const { mutate: mutateUpdate, isPending: isPendingUpdate } = useMutation({
  mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('แก้ไขข้อมูลลูกค้าสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_members'] })
      closeAddModal()
      isSubmitting.value = false
    } else {
      toast.error('แก้ไขข้อมูลลูกค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
})

function buildPrefix() {
  const maxNumber = props.memberData
    .map(member => member.code)
    .filter(code => code?.startsWith('ci'))
    .map(code => parseInt(code.replace('ci', ''), 10) || 0)
    .reduce((max, num) => Math.max(max, num), 0)
  return `ci${String(maxNumber + 1).padStart(4, '0')}`
}
</script>

<template>
  <Dialog
    v-model:visible="showAddModal"
    @update:visible="closeAddModal"
    modal
    :header="props.data ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <div class="space-y-6">
      <!-- Basic Information Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold! text-gray-900 flex items-center gap-2">
            <i class="pi pi-user text-blue-600"></i>
            ข้อมูลลูกค้า
          </h3>
          <p class="text-xs text-gray-700 capitalize" v-if="!!props.data">
            รหัสลูกค้า: {{ props.data?.code }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Dynamic Contacts -->
          <div
            v-for="(contact, contactIndex) in newMember.contacts"
            :key="contact.index"
            class="border border-gray-200 rounded-lg p-3 md:col-span-2"
          >
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-medium text-gray-700">
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
                />
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
            <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อเล่น *</label>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <InputText
              v-model="newMember.name"
              placeholder="กรุณาใส่ชื่อ-นามสกุล"
              fluid
              size="small"
            />
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <Textarea
              v-model="newMember.address"
              placeholder="กรุณาใส่ที่อยู่"
              rows="3"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <InputText
              v-model="newMember.phone"
              placeholder="กรุณาใส่เบอร์โทรศัพท์"
              fluid
              size="small"
            />
          </div>

        </div>
      </div>

      <!-- ข้อมูลพฤติกรรม ความสนใจของลูกค้า -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold! text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-heart text-purple-600"></i>
          ข้อมูลพฤติกรรมความสนใจของลูกค้า
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >ความชำนาญในการเลี้ยง *</label
            >
            <Select
              v-model="newMember.experience"
              :options="memberStore.memberExperienceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกความชำนาญในการเลี้ยง"
              fluid
              size="small"
              :invalid="!newMember.experience && isSubmitting"
            />
            <small v-if="!newMember.experience && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาเลือกความชำนาญในการเลี้ยง</small
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >ชอบปลาเล็กหรือปลาใหญ่ *</label
            >
            <Select
              v-model="newMember.fishPreference"
              :options="memberStore.memberFishPreferenceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกความชอบปลาเล็กหรือปลาใหญ่"
              fluid
              size="small"
              :invalid="!newMember.fishPreference && isSubmitting"
            />
            <small
              v-if="!newMember.fishPreference && isSubmitting"
              class="text-red-500 text-xs mt-1"
              >กรุณาเลือกความชอบปลาเล็กหรือปลาใหญ่</small
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ขนาดบ่อที่เลี้ยง *</label>
            <InputText
              v-model="newMember.pondSize"
              placeholder="ขนาดบ่อที่เลี้ยง"
              fluid
              size="small"
              :invalid="!newMember.pondSize && isSubmitting"
            />
            <small v-if="!newMember.pondSize && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาใส่ขนาดบ่อที่เลี้ยง</small
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ใช้จุลินทรีย์มั้ย ยี่ห้ออะไร</label>
            <InputText
              v-model="newMember.bacteriaBrand"
              placeholder="ยี่ห้อจุลินทรีย์"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ใช้อาหารยี่ห้ออะไร</label>
            <InputText
              v-model="newMember.foodBrand"
              placeholder="ยี่ห้ออาหาร"
              fluid
              size="small"
            />
          </div>
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold! text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-shield text-green-600"></i>
          ข้อมูลบัญชีประมูล
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
            <InputText
              v-model="newMember.username"
              placeholder="กรุณาใส่ชื่อผู้ใช้"
              fluid
              size="small"
            />
          </div>

          <!-- แสดงรหัสผ่านเฉพาะเมื่อสร้างใหม่ และยังไม่มีประวัติการซื้อ -->
          <div v-if="!props.data">
            <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <Password
              v-model="newMember.password"
              placeholder="กรุณาใส่รหัสผ่าน"
              :feedback="false"
              toggleMask
              fluid
              size="small"
            />
          </div>

          <!-- แสดงสถานะยูสเซอร์เฉพาะเมื่อสร้างใหม่ -->
          <div v-if="!props.data">
            <label class="block text-sm font-medium text-gray-700 mb-1">สถานะยูสเซอร์</label>
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
      </div>
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
