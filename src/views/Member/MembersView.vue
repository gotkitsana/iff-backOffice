<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import DataTable from 'primevue/datatable'
import { Column, Tag, Button, Card } from 'primevue'
import { useQuery } from '@tanstack/vue-query'
import { useMemberStore, type IMember } from '@/stores/member/member'
import ModalAddAndEditMember from '@/components/member/ModalAddAndEditMember.vue'
import ModalDetailMember from '@/components/member/ModalDetailMember.vue'
import ModalDeleteMember from '@/components/member/ModalDeleteMember.vue'
import ModalResetPassword from '@/components/member/ModalResetPassword.vue'

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
  deleteCustomer.value = { id: customer._id, name: customer.name || '' }
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

const products = ref<IMember[]>([])
watch(data, () => {
  products.value = data.value?.map((item,index) => ({
    ...item,
    idx: index + 1,
  })) || []
}, { immediate: true })


onMounted(() => {
  products.value = [
    {
      _id: '1',
      code: '1',
      status: 'cs',
      contact: '0812345678',
      contactName: 'Facebook',
      displayName: 'John Doe',
      name: 'John Doe',
      address: '1234567890',
      province: 'กรุงเทพมหานคร',
      phone: '0812345678',
      type: 'ลูกค้า',
      interest: 'กล้องถ่ายรูป',
      username: 'john.doe',
      password: '1234567890',
      bidder: true,
      cat: 1,
      uat: 1,
    },
  ]
})
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
          <Button
            label="บันทึกข้อมูลลูกค้า"
            icon="pi pi-plus"
            size="small"
            @click="openAddModal"
            class="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </template>
      <template #content>
        <DataTable :value="products" dataKey="_id" :loading="isLoading" paginator :rows="50" :rowsPerPageOptions="[50, 100, 150, 200]">
          <Column
            field="idx"
            header="รหัสลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }"
          />

          <Column
            field="status"
            header="สถานะลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[5rem] justify-center', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
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
          </Column>

          <Column
            field="contact"
            header="ช่องทางติดต่อ"
            :pt="{ columnHeaderContent: 'min-w-[6rem] justify-center ', bodyCell: 'text-center' }"
          >
            <template #body="slotProps">
              <Tag
                :value="
                  memberStore.memberContactOptions.find(
                    (option) => option.value === slotProps.data.contact
                  )?.label
                "
                severity="info"
                size="small"
              />
            </template>
          </Column>

          <Column
            field="contactName"
            header="ชื่อโซเชียล"
            :pt="{ columnHeaderContent: 'min-w-[5rem]', bodyCell: 'text-sm' }"
          />

          <Column
            field="displayName"
            header="ชื่อเล่น"
            :pt="{ columnHeaderContent: 'min-w-[5rem]', bodyCell: 'text-sm' }"
          />

          <Column
            field="name"
            header="ชื่อ/นามสกุล"
            :pt="{ columnHeaderContent: 'min-w-[6rem]', bodyCell: 'text-sm' }"
          />

          <Column field="address" header="ที่อยู่" :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }" />

          <Column field="province" header="จังหวัด" :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }" />

          <Column field="phone" header="เบอร์โทร" :pt="{ columnHeaderContent: 'min-w-[4rem]', bodyCell: 'text-sm' }" />

          <Column
            field="type"
            header="ประเภทลูกค้า"
            :pt="{ columnHeaderContent: 'min-w-[5.5rem]', bodyCell: 'text-sm' }"
          />

          <Column
            field="interest"
            header="ความสนใจ"
            :pt="{ columnHeaderContent: 'min-w-[5rem]', bodyCell: 'text-sm' }"
          />

          <Column
            header="จัดการ"
            :pt="{ columnTitle: 'font-semibold!', columnHeaderContent: 'justify-end' }"
          >
            <template #body="slotProps">
              <div class="flex space-x-2 justify-end">
                <Button
                  icon="pi pi-eye"
                  size="small"
                  text
                  rounded
                  @click="openViewModal(slotProps.data)"
                  severity="info"
                  v-tooltip.top="'ข้อมูลลูกค้า'"
                />
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
      :id="editCustomer?._id || null"
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


