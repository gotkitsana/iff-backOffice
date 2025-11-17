import { useMutation } from '@tanstack/vue-query'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales, IUpdateSalesPayload, StatusWorkflow } from '@/types/sales'
import { convertStatusNumberToString } from '@/types/sales'
import { calculateOrderTotal, calculateSaleTotal } from '@/utils/salesCalculations'
import type { IProduct } from '@/stores/product/product'

/**
 * Composable สำหรับจัดการการอัพเดทสถานะสมาชิก
 */
export function useMemberStatusUpdate() {
  const memberStore = useMemberStore()
  const salesStore = useSalesStore()

  const { mutate: updateMember } = useMutation({
    mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
  })

  /**
   * ตรวจสอบและอัพเดทสถานะสมาชิกตามยอดซื้อ
   */
  const updateMemberStatusIfNeeded = (
    variables: IUpdateSalesPayload,
    members: IMember[] | undefined,
    allSales: ISales[] | undefined,
    allProducts: IProduct[],
    preparingStepOrder: number,
  ) => {
    const member = members?.find((m) => m._id === variables.user)

    if (!member || member.status === 'css') return

    // คำนวณยอดซื้อรวมทั้งหมด
    const currentTotal = calculateOrderTotal(variables, allProducts)
    const previousTotal =
      allSales
        ?.filter((s) => {
          const statusString =
            typeof s.sellingStatus === 'number'
              ? convertStatusNumberToString(s.sellingStatus)
              : s.sellingStatus
          return (
            s.user === variables.user &&
            salesStore.statusWorkflow[statusString as keyof StatusWorkflow]?.stepOrder >=
              preparingStepOrder &&
            s._id !== variables._id
          )
        })
        .reduce((sum, s) => sum + calculateSaleTotal(s, allProducts), 0) || 0

    const totalSpending = currentTotal + previousTotal
    const shouldBeCss = totalSpending >= 50000
    const shouldBeCs = !shouldBeCss && member.status === 'ci'

    if (shouldBeCss || shouldBeCs) {
      const newStatus = shouldBeCss ? 'css' : 'cs'
      const newCode = member.code.replace('ci', newStatus).replace(/^cs(?!s)/, newStatus)

      updateMember({
        _id: member._id,
        status: newStatus,
        code: newCode,
        contacts: member.contacts || [],
        interests: member.interests || [],
        displayName: member.displayName,
        name: member.name,
        address: member.address,
        province: member.province,
        phone: member.phone,
        type: member.type,
        username: member.username,
        password: member.password,
        bidder: member.bidder,
        cat: member.cat,
        uat: member.uat,
      })
    }
  }

  return {
    updateMemberStatusIfNeeded,
  }
}
