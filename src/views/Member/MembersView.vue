<script setup lang="ts">
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import { Column, Tag, Button, Card } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import { useMemberStore, type IMember } from '@/stores/member/member'
import ModalAddAndEditMember from '@/components/member/ModalAddAndEditMember.vue'
import ModalDetailMember from '@/components/member/ModalDetailMember.vue'
import ModalDeleteMember from '@/components/member/ModalDeleteMember.vue'
import ModalResetPassword from '@/components/member/ModalResetPassword.vue'
import { orderBy } from 'lodash-es'
import { toast } from 'vue3-toastify'

const memberStore = useMemberStore()
const { data, isLoading } = useQuery<IMember[]>({
  queryKey: ['get_members'],
  queryFn: () => memberStore.onGetMembers(),
})

const showAddAndEditModal = ref(false)
const editCustomer = ref<IMember | null>(null)
const openAddModal = () => {
  showAddAndEditModal.value = true
}
const openEditModal = (customer: IMember) => {
  editCustomer.value = customer
  showAddAndEditModal.value = true
}
const closeAddAndEditModal = () => {
  showAddAndEditModal.value = false
  editCustomer.value = null
}

const showViewModal = ref(false)
const selectedCustomer = ref<string | null>(null)
const openViewModal = (customer: IMember) => {
  selectedCustomer.value = customer._id
  showViewModal.value = true
}
const closeViewModal = () => {
  showViewModal.value = false
  selectedCustomer.value = null
}

const showDeleteModal = ref(false)
const deleteCustomer = ref<{ id: string; name: string } | null>(null)
const openDeleteModal = (customer: IMember) => {
  deleteCustomer.value = { id: customer._id, name: customer.displayName || '' }
  showDeleteModal.value = true
}
const closeDeleteModal = () => {
  deleteCustomer.value = null
  showDeleteModal.value = false
}

const showResetPasswordModal = ref(false)
const resetPasswordCustomer = ref<{ id: string; name: string } | null>(null)
const openResetPasswordModal = (customer: IMember) => {
  resetPasswordCustomer.value = { id: customer._id, name: customer.name || '' }
  showResetPasswordModal.value = true
}
const closeResetPasswordModal = () => {
  resetPasswordCustomer.value = null
  showResetPasswordModal.value = false
}

// ฟังก์ชันสำหรับแสดงรูป logo ของช่องทางติดต่อ
const getContactImage = (contactType: string): string | undefined => {
  switch (contactType) {
    case 'facebook':
      return '/src/assets/images/icon/fb.png'
    case 'line_oa':
      return '/src/assets/images/icon/line-oa.webp'
    case 'line_chat':
      return '/src/assets/images/icon/line.png'
    case 'line_group':
      return '/src/assets/images/icon/line.png'
    case 'tiktok':
      return '/src/assets/images/icon/tiktok.png'
    default:
      return undefined
  }
}

// ฟังก์ชันสำหรับคัดลอกข้อความ
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // แสดง toast notification
    toast.success(`คัดลอก ${text} เรียบร้อย`)
  } catch (err) {
    console.error('ไม่สามารถคัดลอกได้:', err)
    toast.error('ไม่สามารถคัดลอกได้')
  }
}

// ฟังก์ชันสำหรับสร้าง tooltip content
const createContactTooltip = (contactName: string) => {
  return `ชื่อช่องทางติดต่อ\n👤 ${contactName || 'ไม่ระบุชื่อ'}\n\n💡 คลิกเพื่อคัดลอก`
}


</script>

<template>
  <div class="space-y-4">
    <Card class="rounded-2xl bg-white/80">
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2 p-5 pb-0">
          <div>
            <h1 class="text-lg font-semibold! text-gray-900">ข้อมูลลูกค้า</h1>
            <p class="text-gray-600">ระบบจัดการข้อมูลลูกค้า</p>
          </div>

          <div class="flex items-center gap-2">
            <Button
              label="บันทึกข้อมูลลูกค้า"
              icon="pi pi-plus"
              size="small"
              @click="openAddModal"
            />

            <Button label="ประวัติการซื้อ" icon="pi pi-history" size="small" severity="success" />
          </div>
        </div>
      </template>
      <template #content>
        <DataTable
          :value="orderBy(data, 'code', 'asc')"
          dataKey="_id"
          :loading="isLoading"
          paginator
          :rows="50"
          :rowsPerPageOptions="[50, 100, 150, 200]"
        >
          <Column field="code" header="รหัสลูกค้า" :pt="{ columnHeaderContent: 'min-w-[5.5rem]' }">
            <template #body="slotProps">
              <p class="capitalize! text-sm">{{ slotProps.data.code }}</p>
            </template>
          </Column>

          <Column
            field="status"
            header="สถานะลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[6.5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <template v-if="slotProps.data.status">
                <Tag
                  :value="
                    memberStore.memberStatusOptions.find(
                      (option) => option.value === slotProps.data.status
                    )?.label
                  "
                  :severity="memberStore.getStatusLabel(slotProps.data.status)"
                  size="small"
                />
              </template>
              <template v-else></template>
            </template>
          </Column>

          <Column
            field="contacts"
            header="ช่องทางติดต่อ"
            :pt="{ columnHeaderContent: 'min-w-[9rem] justify-center ', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <div class="flex flex-wrap gap-1 justify-center">
                <!-- แสดง contacts array -->
                <template v-if="slotProps.data.contacts && slotProps.data.contacts.length > 0">
                  <div
                    v-for="contact in slotProps.data.contacts"
                    :key="contact.index"
                    class="w-6 h-6 cursor-pointer duration-300 hover:scale-110"
                    @click="copyToClipboard(contact.value)"
                    v-tooltip.top="{
                      value: createContactTooltip(contact.value),
                      showDelay: 300,
                      hideDelay: 100,
                      class: 'custom-tooltip',
                    }"
                  >
                    <img
                      v-if="getContactImage(contact.type)"
                      :src="getContactImage(contact.type)"
                      :alt="contact.type"
                      class="w-6 h-6 object-contain rounded p-0"
                    />
                    <div
                      v-else
                      class="w-6 h-6 bg-gray-200 flex items-center rounded justify-center text-gray-600 text-xs"
                    >
                      ?
                    </div>
                  </div>
                </template>

                <!-- แสดงเมื่อไม่มีช่องทางติดต่อ -->
                <template v-else>
                  <span class="text-gray-400 text-sm">-</span>
                </template>
              </div>
            </template>
          </Column>

          <Column
            field="displayName"
            header="ชื่อเล่น"
            :pt="{ columnHeaderContent: 'min-w-[5rem]', bodyCell: 'text-sm' }"
          >
            <template #body="slotProps">
              <span
                class="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors duration-200"
                @click="openViewModal(slotProps.data)"
                v-tooltip.top="'คลิกเพื่อดูรายละเอียด'"
              >
                {{ slotProps.data.displayName }}
              </span>
            </template>
          </Column>

          <Column
            field="name"
            header="ชื่อ/นามสกุล"
            :pt="{ columnHeaderContent: 'min-w-[6rem]', bodyCell: 'text-sm' }"
          />

          <Column
            field="address"
            header="ที่อยู่"
            :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }"
          />

          <Column
            field="province"
            header="จังหวัด"
            :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }"
          >
            <template #body="slotProps">
              <p>
                {{
                  memberStore.provinceOptions.find(
                    (option) => option.value === slotProps.data.province
                  )?.label || 'ไม่ระบุ'
                }}
              </p>
            </template>
          </Column>

          <Column
            field="phone"
            header="เบอร์โทร"
            :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }"
          />

          <!-- <Column
            field="type"
            header="ประเภทลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[5.5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <template v-if="slotProps.data.type">
                <Tag
                  :value="
                    memberStore.memberTypeOptions.find(
                      (option) => option.value === slotProps.data.type
                    )?.label
                  "
                  severity="warn"
                  size="small"
                />
              </template>
              <template v-else></template>
            </template>
          </Column> -->

          <Column
            header="จัดการ"
            :pt="{ columnTitle: 'font-semibold!', columnHeaderContent: 'justify-end' }"
          >
            <template #body="slotProps">
              <div class="flex space-x-2 justify-end">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="openEditModal(slotProps.data)"
                  severity="warning"
                  v-tooltip.top="'แก้ไขข้อมูล'"
                />
                <Button
                  icon="pi pi-key"
                  size="small"
                  text
                  rounded
                  severity="help"
                  @click="openResetPasswordModal(slotProps.data)"
                  v-tooltip.top="'เปลี่ยนรหัสผ่าน'"
                />

                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  @click="openDeleteModal(slotProps.data)"
                  v-tooltip.top="'ลบข้อมูล'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add Customer Modal -->
    <ModalAddAndEditMember
      :showAddModal="showAddAndEditModal"
      @onCloseAddModal="closeAddAndEditModal"
      :data="editCustomer || null"
      :memberData="data || []"
    />

    <!-- View Customer Modal -->
    <ModalDetailMember
      v-if="!!selectedCustomer"
      :showDetailModal="showViewModal"
      @onCloseDetailModal="closeViewModal"
      :id="selectedCustomer"
    />

    <ModalDeleteMember
      v-if="!!deleteCustomer"
      :showDeleteModal="showDeleteModal"
      @onCloseDeleteModal="closeDeleteModal"
      :id="deleteCustomer.id"
      :customerName="deleteCustomer.name"
    />

    <ModalResetPassword
      v-if="!!resetPasswordCustomer"
      :showResetModal="showResetPasswordModal"
      @onCloseResetModal="closeResetPasswordModal"
      :customerId="resetPasswordCustomer.id"
      :customerName="resetPasswordCustomer.name"
    />
  </div>
</template>

<style scoped>
:deep(.custom-tooltip) {
  background: white !important;
  color: #1f2937 !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
  text-align: center !important;
  min-width: 120px !important;
  white-space: pre-line !important;
}

:deep(.custom-tooltip .p-tooltip-text) {
  color: #1f2937 !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
  text-align: center !important;
  white-space: pre-line !important;
}
</style>


