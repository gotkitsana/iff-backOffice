<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button, InputText, DataTable, Column, Dialog, Tag } from 'primevue'
import { toast } from 'vue3-toastify'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useSpeciesStore,
  type ISpecies,
  type ICreateSpeciesPayload,
  type IUpdateSpeciesPayload,
} from '../../stores/product/species'

// Router & Stores
const router = useRouter()
const speciesStore = useSpeciesStore()
const queryClient = useQueryClient()

// Data
const showAddSpecies = ref(false)
const showEditSpecies = ref(false)
const showDeleteModal = ref(false)
const selectedSpecies = ref<ISpecies | null>(null)

// Form data
const speciesForm = ref<ICreateSpeciesPayload>({
  name: '',
  detail: '',
})

// Queries
const { data: speciesData, isLoading: isLoadingSpecies } = useQuery<ISpecies[]>({
  queryKey: ['get_species'],
  queryFn: () => speciesStore.onGetSpecies(),
})

// Computed
const species = computed(() => speciesData.value || [])
const filteredSpecies = computed(() => species.value)

// Create mutation
const { mutate: createSpecies, isPending: isCreatingSpecies } = useMutation({
  mutationFn: (payload: ICreateSpeciesPayload) => speciesStore.onCreateSpecies(payload),
  onSuccess: (data: any) => {
    if (data.data) {
      toast.success('เพิ่มสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModals()
    } else {
      toast.error(data.error.message || 'เพิ่มสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Create error:', error)
    toast.error(error.response?.data?.message || 'เพิ่มสายพันธุ์ไม่สำเร็จ')
  },
})

// Update mutation
const { mutate: updateSpecies, isPending: isUpdatingSpecies } = useMutation({
  mutationFn: (payload: IUpdateSpeciesPayload) => speciesStore.onUpdateSpecies(payload),
  onSuccess: (data: any) => {
    if (data.data.modifiedCount > 0) {
      toast.success('อัปเดตสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModals()
    } else {
      toast.error(data.error.message || 'อัปเดตสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Update error:', error)
    toast.error(error.response?.data?.message || 'อัปเดตสายพันธุ์ไม่สำเร็จ')
  },
})

// Methods
const goBack = () => {
  router.push('/product')
}

const resetForm = () => {
  speciesForm.value = {
    name: '',
    detail: '',
  }
}

const openAddSpecies = () => {
  resetForm()
  showAddSpecies.value = true
}

const openEditSpecies = (species: ISpecies) => {
  selectedSpecies.value = species
  speciesForm.value = {
    name: species.name,
    detail: species.detail,
  }
  showEditSpecies.value = true
}

const openDeleteModal = (species: ISpecies) => {
  selectedSpecies.value = species
  showDeleteModal.value = true
}

const closeModals = () => {
  showAddSpecies.value = false
  showEditSpecies.value = false
  showDeleteModal.value = false
  selectedSpecies.value = null
  resetForm()
}

const validateForm = () => {
  if (!speciesForm.value.name.trim()) {
    toast.error('กรุณากรอกชื่อสายพันธุ์')
    return false
  }
  if (!speciesForm.value.detail.trim()) {
    toast.error('กรุณากรอกรายละเอียดสายพันธุ์')
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) return

  const payload = {
    name: speciesForm.value.name.trim(),
    detail: speciesForm.value.detail.trim(),
  }

  if (showAddSpecies.value) {
    createSpecies(payload)
  } else if (showEditSpecies.value && selectedSpecies.value) {
    updateSpecies({
      _id: selectedSpecies.value._id,
      name: payload.name,
      detail: payload.detail,
      active: selectedSpecies.value.active,
      cat: selectedSpecies.value.cat,
      uat: selectedSpecies.value.uat,
    })
  }
}

const toggleSpeciesStatus = (species: ISpecies) => {
  updateSpecies({
    _id: species._id,
    name: species.name,
    detail: species.detail,
    active: !species.active,
    cat: species.cat,
    uat: species.uat,
  })
}

const getStatusTag = (active: boolean) => {
  return active
    ? { label: 'เปิดใช้งาน', severity: 'success' }
    : { label: 'ปิดใช้งาน', severity: 'danger' }
}

const isSubmitting = computed(() => isCreatingSpecies.value || isUpdatingSpecies.value)

const { mutate: deleteSpecies, isPending: isDeletingSpecies } = useMutation({
  mutationFn: (speciesId: string) => speciesStore.onDeleteProduct(speciesId),
  onSuccess: (data: any) => {
    if (data.data.deletedCount > 0) {
      toast.success('ลบสายพันธุ์สำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['get_species'] })
      closeModals()
    } else {
      toast.error(data.error.message || 'ลบสายพันธุ์ไม่สำเร็จ')
    }
  },
  onError: (error: any) => {
    console.error('Delete error:', error)
    toast.error(error.response?.data?.message || 'ลบสายพันธุ์ไม่สำเร็จ')
  },
})
</script>

<template>
  <div class="flex items-center justify-between flex-wrap gap-2">
    <div>
      <h1 class="text-xl font-semibold! text-gray-900">จัดการสายพันธุ์ปลา</h1>
      <p class="text-gray-600">เพิ่ม แก้ไข และจัดการสายพันธุ์ปลา</p>
    </div>
  </div>

  <div class="space-y-4 mt-4">
    <!-- Species Table -->
    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm px-2">
      <div class="py-4 px-2 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-lg font-semibold! text-gray-800">รายการสายพันธุ์ปลา</h3>

        <div class="flex items-center gap-2">
          <Button
            label="เพิ่มสายพันธุ์ใหม่"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openAddSpecies"
          />
          <Button
            label="กลับ"
            icon="pi pi-angle-left"
            severity="contrast"
            size="small"
            @click="goBack"
          />
        </div>
      </div>

      <DataTable
        :value="filteredSpecies"
        :loading="isLoadingSpecies"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        :pt="{
          table: '!text-sm',
          header: '!text-sm font-semibold! text-gray-800',
          body: '!text-sm text-gray-700',
          cell: '!text-sm text-gray-700',
          columnHeader: '!text-sm font-semibold! text-gray-800',
          row: '!text-sm text-gray-700',
          rowGroup: '!text-sm text-gray-700',
          rowGroupHeader: '!text-sm font-semibold! text-gray-800',
          rowGroupFooter: '!text-sm font-semibold! text-gray-800',
        }"
      >
        <Column field="name" header="ชื่อสายพันธุ์" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-star text-blue-500 text-sm"></i>
              <span class="font-medium text-gray-900">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="detail" header="รายละเอียด" sortable>
          <template #body="{ data }">
            <span class="text-gray-700">{{ data.detail }}</span>
          </template>
        </Column>

        <Column field="active" header="สถานะ" sortable>
          <template #body="{ data }">
            <Tag
              :value="getStatusTag(data.active).label"
              :severity="getStatusTag(data.active).severity"
              size="small"
            />
          </template>
        </Column>

        <Column header="จัดการ" :pt="{ columnHeaderContent: 'justify-end' }">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button
                icon="pi pi-pencil"
                size="small"
                severity="info"
                text
                rounded
                @click="openEditSpecies(data)"
                v-tooltip.top="'แก้ไขสายพันธุ์'"
              />
              <Button
                :icon="data.active ? 'pi pi-eye-slash' : 'pi pi-eye'"
                size="small"
                :severity="data.active ? 'warning' : 'success'"
                text
                rounded
                @click="toggleSpeciesStatus(data)"
                v-tooltip.top="data.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                text
                rounded
                @click="openDeleteModal(data)"
                v-tooltip.top="'ลบสายพันธุ์'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>

  <!-- Add/Edit Species Modal -->
  <Dialog
    :visible="showAddSpecies || showEditSpecies"
    @update:visible="closeModals"
    modal
    :style="{ width: '40rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-star text-white"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800">
            {{ showAddSpecies ? 'เพิ่มสายพันธุ์ใหม่' : 'แก้ไขข้อมูลสายพันธุ์' }}
          </h3>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Name & Detail -->
      <div class="grid grid-cols-1 gap-3">
        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            ชื่อสายพันธุ์ <span class="text-red-500">*</span>
          </label>
          <InputText v-model="speciesForm.name" placeholder="เช่น ปลาคาร์ฟโคฮากุ" class="w-full" />
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700 mb-1 block">
            รายละเอียด <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="speciesForm.detail"
            placeholder="รายละเอียดเกี่ยวกับสายพันธุ์"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button
          label="ยกเลิก"
          severity="secondary"
          @click="closeModals"
          size="small"
          :disabled="isSubmitting"
        />
        <Button
          :label="showAddSpecies ? 'เพิ่มสายพันธุ์' : 'บันทึก'"
          :loading="isSubmitting"
          @click="handleSubmit"
          size="small"
        />
      </div>
    </template>
  </Dialog>

  <!-- Delete Confirmation Modal -->
  <Dialog
    v-if="selectedSpecies"
    :visible="showDeleteModal"
    @update:visible="closeModals"

    modal
    :style="{ width: '32rem' }"
    :pt="{
      header: 'p-4',
      title: 'text-lg font-semibold!',
    }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center"
        >
          <i class="pi pi-trash text-white text-lg"></i>
        </div>
        <div>
          <h3 class="text-lg font-semibold! text-gray-800">ยืนยันการลบสายพันธุ์</h3>
        </div>
      </div>
    </template>

    <div v-if="selectedSpecies" class="space-y-3">
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-red-600 !text-2xl"></i>
        <p class="text-gray-800 font-medium text-lg">คุณแน่ใจหรือไม่ที่จะลบสายพันธุ์นี้?</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-3 space-y-1">
        <div class="flex justify-between">
          <span class="text-gray-600">ชื่อสายพันธุ์:</span>
          <span class="font-medium text-gray-900">{{ selectedSpecies.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">รายละเอียด:</span>
          <span class="font-medium text-gray-900">{{ selectedSpecies.detail }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">สถานะ:</span>
          <Tag
            :value="getStatusTag(selectedSpecies.active).label"
            :severity="getStatusTag(selectedSpecies.active).severity"
            size="small"
          />
        </div>
      </div>
      <p class="text-sm text-red-600">⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="ยกเลิก"
          icon="pi pi-times"
          @click="closeModals"
          severity="secondary"
          size="small"
        />
        <Button
          label="ลบสายพันธุ์"
          icon="pi pi-trash"
          @click="deleteSpecies(selectedSpecies._id)"
          :loading="isDeletingSpecies"
          severity="danger"
          size="small"
        />
      </div>
    </template>
  </Dialog>
</template>
