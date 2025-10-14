<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMemberStore, type CreateMemberPayload, type IMember } from '@/stores/member/member'
import { Dialog, Textarea, Select, InputText } from 'primevue'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

const props = defineProps<{
  showAddModal: boolean
  id: string | null
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
  contact: '',
  contactName: '',
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
})

const closeAddModal = () => {
  newMember.value = {
    status: '',
    contact: '',
    contactName: '',
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
  }
  emit('onCloseAddModal')
}

const memberStore = useMemberStore()
const { data: memberData } = useQuery<IMember>({
  queryKey: ['get_member_ID', props.id],
  queryFn: () => memberStore.onGetMemberID(props.id || ''),
  enabled: computed(() => !!props.id),
})
watch(
  memberData,
  (newVal) => {
    if (newVal) {
      newMember.value = {
        status: newVal.status,
        contact: newVal.contact,
        contactName: newVal.contactName,
        displayName: newVal.displayName,
        name: newVal.name || '',
        password: newVal.password || '',
        bidder: newVal.bidder || false,
        address: newVal.address || '',
        province: newVal.province || '',
        phone: newVal.phone || '',
        type: newVal.type || '',
        interest: newVal.interest || '',
        username: newVal.username || '',
      }
    }
  },
  { immediate: true }
)

const handleAddMember = () => {
  isSubmitting.value = true

  if (
    !newMember.value.status ||
    !newMember.value.contact ||
    !newMember.value.contactName ||
    !newMember.value.displayName ||
    !newMember.value.type
  ) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  if (props.id) {
    mutateUpdate(newMember.value)
  } else {
    mutate(newMember.value)
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
  mutationFn: (payload: CreateMemberPayload) => memberStore.onUpdateMember(payload),
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


</script>

<template>

  <Dialog
    v-model:visible="showAddModal"
    @update:visible="closeAddModal"
    modal
    :header="props.id ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
  >
    <div class="space-y-6">
      <!-- Basic Information Section -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h3 class="font-semibold! text-gray-900 mb-4 flex items-center gap-2">
          <i class="pi pi-user text-blue-600"></i>
          ข้อมูลลูกค้า
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ช่องทางติดต่อ *</label>
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
            <label class="block text-sm font-medium text-gray-700 mb-1">ชื่อช่องทางติดต่อ *</label>
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

          <div class="md:col-span-2">
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

          <div>
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
          </div>

          <div>
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
          <div v-if="!props.id">
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

          <div>
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
