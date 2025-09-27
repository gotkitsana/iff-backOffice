<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import { toast } from 'vue3-toastify'
import formatDate from '@/utils/formatDate'
import type {
  CreateCustomerPayload,
  Customer,
  EditCustomerPayload,
} from '@/stores/customer/customer'
import ModalAddMember from '@/components/member/ModalAddMember.vue'

// Types

// Sample data for customers
const customers = ref<Customer[]>([])

// Modal states

const showViewModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isSubmitting = ref(false)
const selectedCustomer = ref<Customer | null>(null)

const editCustomer = ref<EditCustomerPayload>({
  _id: '',
  displayName: '',
  name: '',
  email: '',
  phone: '',
  bidder: false,
})

const showAddModal = ref(false)
const openAddModal = () => {
  showAddModal.value = true
}

const openViewModal = (customer: Customer) => {
  selectedCustomer.value = customer
  showViewModal.value = true
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedCustomer.value = null
}

const openEditModal = (customer: Customer) => {
  selectedCustomer.value = customer
  editCustomer.value = {
    _id: customer._id,
    displayName: customer.displayName,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    bidder: customer.bidder,
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedCustomer.value = null
  isSubmitting.value = false
}

const openDeleteModal = (customer: Customer) => {
  selectedCustomer.value = customer
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedCustomer.value = null
  isSubmitting.value = false
}

// Form handlers


const handleEditCustomer = async () => {
  isSubmitting.value = true

  if (!editCustomer.value.username || !editCustomer.value.displayName || !editCustomer.value.name) {
    toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    isSubmitting.value = false
    return
  }

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (selectedCustomer.value) {
      const index = customers.value.findIndex((c) => c._id === selectedCustomer.value!._id)
      if (index !== -1) {
        customers.value[index] = {
          ...customers.value[index],
          username: editCustomer.value.username,
          displayName: editCustomer.value.displayName,
          name: editCustomer.value.name,
          email: editCustomer.value.email,
          bidder: editCustomer.value.bidder,
          uat: Date.now(),
          ...(editCustomer.value.password && { password: editCustomer.value.password }),
        }
      }
    }

    toast.success('แก้ไขข้อมูลลูกค้าสำเร็จ')
    closeEditModal()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
    isSubmitting.value = false
  }
}

const handleDeleteCustomer = async () => {
  isSubmitting.value = true

  try {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (selectedCustomer.value) {
      const index = customers.value.findIndex((c) => c._id === selectedCustomer.value!._id)
      if (index !== -1) {
        customers.value.splice(index, 1)
      }
    }

    toast.success('ลบข้อมูลลูกค้าสำเร็จ')
    closeDeleteModal()
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card class="rounded-2xl bg-white/80">
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2 p-5 pb-0">
          <div>
            <h1 class="text-lg font-semibold! text-gray-900">จัดการลูกค้า</h1>
            <p class="text-gray-600">ระบบจัดการข้อมูลลูกค้าสำหรับประมูลปลาคราฟ</p>
          </div>
          <Button
            label="เพิ่มสมาชิก"
            icon="pi pi-plus"
            size="small"
            @click="openAddModal"
            class="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </template>
      <template #content>
        <DataTable :value="customers" :paginator="true" :rows="100" class="p-datatable-sm">
          <Column
            field="username"
            header="ชื่อผู้ใช้"
            sortable
            :pt="{ columnTitle: 'font-semibold! ', columnHeaderContent: 'min-w-[7rem]' }"
          ></Column>
          <Column
            field="name"
            header="ชื่อ-นามสกุล"
            sortable
            p-ripple
            :pt="{ columnTitle: 'font-semibold!', columnHeaderContent: 'min-w-[10rem]' }"
          ></Column>
          <Column
            field="email"
            header="อีเมล"
            sortable
            p-ripple
            :pt="{ columnTitle: 'font-semibold!' }"
          ></Column>
          <Column
            field="bidder"
            header="สถานะประมูล"
            sortable
            p-ripple
            :pt="{
              columnTitle: 'font-semibold! ',
              columnHeaderContent: 'justify-center min-w-[7rem]',
              bodyCell: 'text-center',
            }"
          >
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.bidder ? 'ประมูล' : 'ไม่ประมูล'"
                :severity="slotProps.data.bidder ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column
            field="cat"
            header="วันที่สร้าง"
            sortable
            :pt="{ columnTitle: 'font-semibold!', columnHeaderContent: 'min-w-[9rem]' }"
          >
            <template #body="slotProps">
              <span>{{ formatDate(slotProps.data.cat) }}</span>
            </template>
          </Column>
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
                />
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="openEditModal(slotProps.data)"
                  severity="warning"
                />
                <Button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="danger"
                  @click="openDeleteModal(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add Customer Modal -->
    <ModalAddMember
      :showAddModal="showAddModal"
      @onCloseAddModal="showAddModal = false"
    />
    <!-- <Dialog
      v-model:visible="showAddModal"
      modal
      header="เพิ่มลูกค้าใหม่"
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      :pt="{ header: 'p-4', title: 'text-lg font-semibold!' }"
    >
      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-700">ชื่อผู้ใช้ *</label>
            <InputText
              v-model="newCustomer.username"
              placeholder="กรุณาใส่ชื่อผู้ใช้"
              :invalid="!newCustomer.username && isSubmitting"
              fluid
              size="small"
            />
            <small v-if="!newCustomer.username && isSubmitting" class="text-red-500"
              >กรุณาระบุชื่อผู้ใช้</small
            >
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium! text-gray-700">ชื่อแสดง *</label>
            <InputText
              v-model="newCustomer.displayName"
              placeholder="กรุณาใส่ชื่อแสดง"
              :invalid="!newCustomer.displayName && isSubmitting"
              fluid
              size="small"
            />
            <small v-if="!newCustomer.displayName && isSubmitting" class="text-red-500"
              >กรุณาระบุชื่อแสดง</small
            >
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium! text-gray-700">ชื่อ-นามสกุล *</label>
          <InputText
            v-model="newCustomer.name"
            placeholder="กรุณาใส่ชื่อ-นามสกุล"
            :invalid="!newCustomer.name && isSubmitting"
            fluid
            size="small"
          />
          <small v-if="!newCustomer.name && isSubmitting" class="text-red-500"
            >กรุณาระบุชื่อ-นามสกุล</small
          >
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium! text-gray-700">รหัสผ่าน *</label>
          <Password
            v-model="newCustomer.password"
            placeholder="กรุณาใส่รหัสผ่าน"
            :feedback="false"
            :invalid="!newCustomer.password && isSubmitting"
            toggleMask
            fluid
            size="small"
          />
          <small v-if="!newCustomer.password && isSubmitting" class="text-red-500"
            >กรุณาระบุรหัสผ่าน</small
          >
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium! text-gray-700">อีเมล</label>
          <InputText
            v-model="newCustomer.email"
            placeholder="กรุณาใส่อีเมล"
            type="email"
            fluid
            size="small"
          />
        </div>

        <div class="flex items-center space-x-2">
          <Checkbox v-model="newCustomer.bidder" :binary="true" inputId="bidder" size="small" />
          <label for="bidder" class="text-sm font-medium! text-gray-700">ลูกค้าประมูล</label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <Button
            label="ยกเลิก"
            icon="pi pi-times"
            severity="danger"
            @click="closeAddModal"
            size="small"
          />
          <Button
            label="เพิ่มสมาชิก"
            icon="pi pi-check"
            @click="handleAddCustomer"
            :loading="isSubmitting"
            severity="success"
            size="small"
          />
        </div>
      </template>
    </Dialog> -->

    <!-- View Customer Modal -->
    <Dialog
      v-model:visible="showViewModal"
      modal
      header="ดูข้อมูลลูกค้า"
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <div v-if="selectedCustomer" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium! text-gray-500">ชื่อผู้ใช้</label>
            <p class="text-lg font-semibold! text-gray-900">{{ selectedCustomer.username }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium! text-gray-500">ชื่อแสดง</label>
            <p class="text-lg font-semibold! text-gray-900">{{ selectedCustomer.displayName }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium! text-gray-500">ชื่อ-นามสกุล</label>
          <p class="text-lg font-semibold! text-gray-900">{{ selectedCustomer.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium! text-gray-500">อีเมล</label>
          <p class="text-lg font-semibold! text-gray-900">
            {{ selectedCustomer.email || 'ไม่ระบุ' }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium! text-gray-500">สถานะประมูล</label>
          <Tag
            :value="selectedCustomer.bidder ? 'ประมูล' : 'ไม่ประมูล'"
            :severity="selectedCustomer.bidder ? 'success' : 'secondary'"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium! text-gray-500">วันที่สร้าง</label>
            <p class="text-sm text-gray-900">{{ formatDate(selectedCustomer.cat) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium! text-gray-500">วันที่แก้ไขล่าสุด</label>
            <p class="text-sm text-gray-900">{{ formatDate(selectedCustomer.uat) }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <Button label="ปิด" icon="pi pi-times" @click="closeViewModal" text />
        </div>
      </template>
    </Dialog>

    <!-- Edit Customer Modal -->
    <Dialog
      v-model:visible="showEditModal"
      modal
      header="แก้ไขข้อมูลลูกค้า"
      :style="{ width: '50rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <form @submit.prevent="handleEditCustomer" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium! text-gray-700">ชื่อผู้ใช้ *</label>
            <InputText
              v-model="editCustomer.username"
              placeholder="กรุณาใส่ชื่อผู้ใช้"
              :invalid="!editCustomer.username && isSubmitting"
              fluid
            />
            <small v-if="!editCustomer.username && isSubmitting" class="text-red-500"
              >กรุณาระบุชื่อผู้ใช้</small
            >
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium! text-gray-700">ชื่อแสดง *</label>
            <InputText
              v-model="editCustomer.displayName"
              placeholder="กรุณาใส่ชื่อแสดง"
              :invalid="!editCustomer.displayName && isSubmitting"
              fluid
            />
            <small v-if="!editCustomer.displayName && isSubmitting" class="text-red-500"
              >กรุณาระบุชื่อแสดง</small
            >
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium! text-gray-700">ชื่อ-นามสกุล *</label>
          <InputText
            v-model="editCustomer.name"
            placeholder="กรุณาใส่ชื่อ-นามสกุล"
            :invalid="!editCustomer.name && isSubmitting"
            fluid
          />
          <small v-if="!editCustomer.name && isSubmitting" class="text-red-500"
            >กรุณาระบุชื่อ-นามสกุล</small
          >
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium! text-gray-700">รหัสผ่าน</label>
          <Password
            v-model="editCustomer.password"
            placeholder="กรุณาใส่รหัสผ่านใหม่ (เว้นว่างเพื่อไม่เปลี่ยน)"
            :feedback="false"
            toggleMask
            fluid
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium! text-gray-700">อีเมล</label>
          <InputText v-model="editCustomer.email" placeholder="กรุณาใส่อีเมล" type="email" fluid />
        </div>

        <div class="flex items-center space-x-2">
          <Checkbox v-model="editCustomer.bidder" :binary="true" inputId="editBidder" />
          <label for="editBidder" class="text-sm font-medium! text-gray-700">ลูกค้าประมูล</label>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <Button label="ยกเลิก" icon="pi pi-times" @click="closeEditModal" text />
          <Button
            label="บันทึกการแก้ไข"
            icon="pi pi-check"
            @click="handleEditCustomer"
            :loading="isSubmitting"
            class="bg-green-600 hover:bg-green-700"
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog
      v-model:visible="showDeleteModal"
      modal
      header="ยืนยันการลบข้อมูล"
      :style="{ width: '25rem' }"
    >
      <div class="flex items-center space-x-3">
        <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
        <div>
          <p class="font-semibold! text-gray-900">คุณต้องการลบข้อมูลลูกค้านี้หรือไม่?</p>
          <p class="text-sm text-gray-600 mt-1">
            {{ selectedCustomer?.name }} ({{ selectedCustomer?.username }})
          </p>
          <p class="text-sm text-red-600 mt-2 font-medium!">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <Button label="ยกเลิก" icon="pi pi-times" @click="closeDeleteModal" text />
          <Button
            label="ลบข้อมูล"
            icon="pi pi-trash"
            @click="handleDeleteCustomer"
            :loading="isSubmitting"
            severity="danger"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>


