<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useMemberStore,
  type CreateMemberPayload,
  type IMember,
  type UpdateMemberPayload,
} from '@/stores/member/member'
import { Dialog, Textarea, Select, InputText, InputNumber } from 'primevue'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'
import { useMutation, useQueryClient } from '@tanstack/vue-query'

const props = defineProps<{
  showAddModal: boolean
  data: IMember | null
  memberNo: number
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
const newMember = ref<CreateMemberPayload>({
  status: '',
  code: '',
  contact: '',
  contactName: '',
  contact2: '',
  contactName2: '',
  contact3: '',
  contactName3: '',
  displayName: '',
  name: '',
  password: '',
  bidder: false,
  address: '',
  province: '',
  phone: '',
  type: '',
  interest: '',
  username: '',
  // ข้อมูลพฤติกรรมความสนใจ
  experience: '',
  fishAgeInterest: '',
  pondSize: '',
  hasBudgetLimit: undefined,
  fishQuality: '',
})

const closeAddModal = () => {
  newMember.value = {
    status: '',
    code: '',
    contact: '',
    contactName: '',
    contact2: '',
    contactName2: '',
    contact3: '',
    contactName3: '',
    displayName: '',
    name: '',
    password: '',
    bidder: false,
    address: '',
    province: '',
    phone: '',
    type: '',
    interest: '',
    username: '',
    // ข้อมูลพฤติกรรมความสนใจ
    experience: '',
    fishAgeInterest: '',
    pondSize: '',
    hasBudgetLimit: undefined,
    fishQuality: '',
  }
  emit('onCloseAddModal')
}

const memberStore = useMemberStore()

watch(
  () => props.data,
  (newMemberData) => {
    if (newMemberData) {
      newMember.value = {
        code: newMemberData.code,
        status: newMemberData.status,
        contact: newMemberData.contact,
        contactName: newMemberData.contactName,
        contact2: (newMemberData as any).contact2 || '',
        contactName2: (newMemberData as any).contactName2 || '',
        contact3: (newMemberData as any).contact3 || '',
        contactName3: (newMemberData as any).contactName3 || '',
        displayName: newMemberData.displayName,
        name: newMemberData.name || '',
        password: newMemberData.password || '',
        bidder: newMemberData.bidder || false,
        address: newMemberData.address || '',
        province: newMemberData.province || '',
        phone: newMemberData.phone || '',
        type: newMemberData.type || '',
        interest: newMemberData.interest || '',
        username: newMemberData.username || '',
        // ข้อมูลพฤติกรรมความสนใจ
        experience: newMemberData.experience || '',
        fishAgeInterest: newMemberData.fishAgeInterest || '',
        pondSize: newMemberData.pondSize || '',
        hasBudgetLimit: newMemberData.hasBudgetLimit || undefined,
        fishQuality: newMemberData.fishQuality || '',
      }
    }
  },
  { immediate: true }
)

const handleAddMember = () => {
  isSubmitting.value = true
  if (
    !newMember.value.contact ||
    !newMember.value.contactName ||
    !newMember.value.displayName
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  if (props.data) {
    mutateUpdate({
      ...newMember.value,
      _id: props.data._id,
    })
  } else {
    mutate({
      ...newMember.value,
      code: buildPrefix(),
      status: 'ci',
      username: newMember.value.username || newMember.value.phone,
    })
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
      toast.error('เพิ่มลูกค้าไม่สำเร็จ')
      isSubmitting.value = false
    }
  },
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
  const sequence = String(props.memberNo + 1).padStart(4, '0') // เพิ่ม 1 เพื่อให้เริ่มจาก 0001
  return `ci${sequence}`
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
          <p class="text-xs text-gray-700" v-if="!!props.data">
            รหัสลูกค้า: {{ props.data?.code }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">สถานะ *</label>
            <Select
              v-model="newMember.status"
              :options="memberStore.memberStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกสถานะ"
              :invalid="!newMember.status && isSubmitting"
              fluid
              size="small"
            />
            <small v-if="!newMember.status && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาเลือกสถานะ</small
            >
          </div> -->

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อ 1 *</label>
              <Select
                v-model="newMember.contact"
                :options="memberStore.memberContactOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกช่องทางติดต่อ"
                :invalid="!newMember.contact && isSubmitting"
                fluid
                size="small"
              />
              <small v-if="!newMember.contact && isSubmitting" class="text-red-500 text-xs mt-1"
                >กรุณาเลือกช่องทางติดต่อ</small
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ชื่อช่องทางติดต่อ 1 *</label
              >
              <InputText
                v-model="newMember.contactName"
                placeholder="กรุณาใส่ชื่อช่องทางติดต่อ"
                :invalid="!newMember.contactName && isSubmitting"
                fluid
                size="small"
              />
              <small v-if="!newMember.contactName && isSubmitting" class="text-red-500 text-xs mt-1"
                >กรุณาระบุชื่อช่องทางติดต่อ</small
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อ 2</label>
              <Select
                v-model="newMember.contact2"
                :options="memberStore.memberContactOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกช่องทางติดต่อ"
                fluid
                size="small"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ชื่อช่องทางติดต่อ 2</label
              >
              <InputText
                v-model="newMember.contactName2"
                placeholder="กรุณาใส่ชื่อช่องทางติดต่อ"
                fluid
                size="small"
                :invalid="!!newMember.contact2 && !newMember.contactName2 && isSubmitting"
              />
              <small
                v-if="!!newMember.contact2 && !newMember.contactName2 && isSubmitting"
                class="text-red-500 text-xs mt-1"
                >กรุณาระบุชื่อช่องทางติดต่อ</small
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อ 3</label>
              <Select
                v-model="newMember.contact3"
                :options="memberStore.memberContactOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="เลือกช่องทางติดต่อ"
                fluid
                size="small"
                :invalid="!!newMember.contact3 && !newMember.contactName3 && isSubmitting"
              />
              <small
                v-if="!!newMember.contact3 && !newMember.contactName3 && isSubmitting"
                class="text-red-500 text-xs mt-1"
                >กรุณาระบุชื่อช่องทางติดต่อ</small
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >ชื่อช่องทางติดต่อ 3</label
              >
              <InputText
                v-model="newMember.contactName3"
                placeholder="กรุณาใส่ชื่อช่องทางติดต่อ"
                fluid
                size="small"
              />
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

          <div class="col-span-2">
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

          <!-- <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ประเภทลูกค้า *</label>
            <Select
              v-model="newMember.type"
              :options="memberStore.memberTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกประเภทลูกค้า"
              fluid
              size="small"
              :invalid="!newMember.type && isSubmitting"
            />
            <small v-if="!newMember.type && isSubmitting" class="text-red-500 text-xs mt-1"
              >กรุณาเลือกประเภทลูกค้า</small
            >
          </div> -->

          <!-- <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ความสนใจ</label>
            <Select
              v-model="newMember.interest"
              :options="memberStore.memberInterestOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกความสนใจ"
              fluid
              size="small"
            />
          </div> -->
        </div>
      </div>

      <!-- ข้อมูลพฤติกรรม ความสนใจของลูกค้า -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold! text-gray-900 mb-3 flex items-center gap-2">
          <i class="pi pi-heart text-purple-600"></i>
          ข้อมูลพฤติกรรม ความสนใจของลูกค้า
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ประสบการณ์เลี้ยง</label>
            <Select
              v-model="newMember.experience"
              :options="[
                { label: 'มือใหม่', value: 'newbie' },
                { label: 'นักเลี้ยง', value: 'hobbyist' },
                { label: 'สายประกวด', value: 'competitor' },
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกประสบการณ์เลี้ยง"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >ลูกค้าสนใจปลาอายุที่ปี</label
            >
            <Select
              v-model="newMember.fishAgeInterest"
              :options="[
                { label: '1 ปี', value: '1' },
                { label: '2 ปี', value: '2' },
                { label: '3 ปี', value: '3' },
                { label: '4 ปี', value: '4' },
                { label: '5 ปี', value: '5' },
              ]"
              optionLabel="label"
              optionValue="value"
              placeholder="เลือกอายุปลาที่สนใจ"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ขนาดบ่อที่เลี้ยง</label>
            <InputText
              v-model="newMember.pondSize"
              placeholder="กรุณาใส่ขนาดบ่อที่เลี้ยง"
              fluid
              size="small"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ลูกค้าจำกัดงบ</label>
            <InputNumber
              v-model="newMember.hasBudgetLimit"
              placeholder="กรุณาใส่งบประมาณ"
              fluid
              size="small"
              mode="currency"
              currency="THB"
              locale="th-TH"
              :min="0"
              :max="999999999"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">คุณภาพปลา</label>
            <InputText
              v-model="newMember.fishQuality"
              placeholder="กรุณาใส่คุณภาพปลา"
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
