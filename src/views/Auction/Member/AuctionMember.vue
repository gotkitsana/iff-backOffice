<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import formatDate from '@/utils/formatDate'
import { useCustomerStore, type Customer } from '@/stores/customer/customer'
import ModalAddMember from '@/components/member/ModalAddMember.vue'
import ModalDetailMember from '@/components/member/ModalDetailMember.vue'
import ModalEditMember from '@/components/member/ModalEditMember.vue'
import ModalResetPassword from '@/components/member/ModalResetPassword.vue'
import ModalDeleteMember from '@/components/member/ModalDeleteMember.vue'
import { useQuery } from '@tanstack/vue-query'

const customerStore = useCustomerStore()
const { data, isLoading } = useQuery<Customer[]>({
  queryKey: ['get_customers'],
  queryFn: () => customerStore.onGetCustomers(),
})

const showAddModal = ref(false)
const openAddModal = () => {
  showAddModal.value = true
}

const showViewModal = ref(false)
const selectedCustomer = ref<string | null>(null)
const openViewModal = (customer: Customer) => {
  selectedCustomer.value = customer._id
  showViewModal.value = true
}
const closeViewModal = () => {
  showViewModal.value = false
  selectedCustomer.value = null
}

const showEditModal = ref(false)
const editCustomer = ref<Customer | null>(null)
const openEditModal = (customer: Customer) => {
  editCustomer.value = customer
  showEditModal.value = true
}
const closeEditModal = () => {
  showEditModal.value = false
  editCustomer.value = null
}

const showResetPasswordModal = ref(false)
const resetPasswordCustomer = ref<{ id: string; name: string } | null>(null)
const openResetPasswordModal = (customer: Customer) => {
  showResetPasswordModal.value = true
  resetPasswordCustomer.value = { id: customer._id, name: customer.name }
}
const closeResetPasswordModal = () => {
  showResetPasswordModal.value = false
  resetPasswordCustomer.value = null
}

const showDeleteModal = ref(false)
const deleteCustomer = ref<{ id: string; name: string } | null>(null)
const openDeleteModal = (customer: Customer) => {
  deleteCustomer.value = { id: customer._id, name: customer.name }
  showDeleteModal.value = true
}
const closeDeleteModal = () => {
  deleteCustomer.value = null
  showDeleteModal.value = false
}
</script>

<template>
  <div class="space-y-4">
    <Card class="rounded-2xl bg-white/80">
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2 p-5 pb-0">
          <div>
            <h1 class="text-lg font-semibold! text-gray-900">จัดการสมาชิก</h1>
            <p class="text-gray-600">ระบบจัดการข้อมูลลูกค้าสำหรับประมูลปลาคราฟ</p>
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
        <DataTable
          :value="data"
          :paginator="true"
          :rows="100"
          :loading="isLoading"
          class="p-datatable-sm"
        >
         <Column
            field="no"
            header="รหัสลูกค้า"
            sortable
          />
          <Column
            field="status"
            header="สถานะลูกค้า"
            sortable
          />
          <Column
            field="contact"
            header="ช่องทางติดต่อ"
            sortable
          />

          <Column
            field="social"
            header="ชื่อโซเชียล"
            sortable
          />

          <Column
            field="nickname"
            header="ชื่อเล่น"
            sortable
          />

          <Column
            field="fullname"
            header="ชื่อ/นามสกุล"
            sortable
          />

          <Column
            field="address"
            header="ที่อยู่"
            sortable
          />

          <Column
            field="province"
            header="จังหวัด"
            sortable
          />

          <Column
            field="phone"
            header="เบอร์โทร"
            sortable
          />

          <Column
            field="statusType"
            header="ประเภทลูกค้า"
            sortable
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
    <ModalAddMember :showAddModal="showAddModal" @onCloseAddModal="showAddModal = false" />

    <!-- View Customer Modal -->
    <ModalDetailMember
      v-if="!!selectedCustomer"
      :showDetailModal="showViewModal"
      @onCloseDetailModal="closeViewModal"
      :id="selectedCustomer"
    />

    <!-- Edit Customer Modal -->
    <ModalEditMember
      v-if="!!editCustomer"
      :showEditModal="showEditModal"
      @onCloseEditModal="closeEditModal"
      :customerData="editCustomer"
    />

    <ModalResetPassword
      v-if="!!resetPasswordCustomer"
      :showResetModal="showResetPasswordModal"
      @onCloseResetModal="closeResetPasswordModal"
      :customerId="resetPasswordCustomer.id"
      :customerName="resetPasswordCustomer.name"
    />

    <ModalDeleteMember
      v-if="!!deleteCustomer"
      :showDeleteModal="showDeleteModal"
      @onCloseDeleteModal="closeDeleteModal"
      :id="deleteCustomer.id"
      :customerName="deleteCustomer.name"
    />
  </div>
</template>


