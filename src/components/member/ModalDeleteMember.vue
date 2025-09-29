<template>
  Delete
   <!-- <Dialog
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
    </Dialog> -->
</template>
