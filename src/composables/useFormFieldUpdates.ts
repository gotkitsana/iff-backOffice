import { type Ref } from 'vue'
import type { IUpdateSalesPayload, ICreateSalesPayload } from '@/types/sales'
import type { IMember } from '@/stores/member/member'

export interface UseFormFieldUpdatesOptions {
  saleForm: Ref<IUpdateSalesPayload | ICreateSalesPayload>
  selectedMemberDetails?: Ref<IMember | null>
}

export function useFormFieldUpdates(options: UseFormFieldUpdatesOptions) {
  const { saleForm, selectedMemberDetails } = options

  const updateDeposit = (deposit: number) => {
    saleForm.value.deposit = deposit
  }

  const updateDiscount = (discount: number) => {
    saleForm.value.discount = discount
  }

  const updateDeliveryNo = (deliveryNo: number) => {
    saleForm.value.deliveryNo = deliveryNo
  }

  const updateBankCode = (bankCode: string) => {
    saleForm.value.bankCode = bankCode
  }

  const updateShippingAddressFromMember = () => {
    if (selectedMemberDetails?.value) {
      saleForm.value.shippingAddress = selectedMemberDetails.value.address || ''
      saleForm.value.shippingProvince = selectedMemberDetails.value.province || ''
    }
  }

  const handleDeliveryChanged = (delivery: string) => {
    saleForm.value.delivery = delivery
  }

  return {
    updateDeposit,
    updateDiscount,
    updateDeliveryNo,
    updateBankCode,
    updateShippingAddressFromMember,
    handleDeliveryChanged,
  }
}
