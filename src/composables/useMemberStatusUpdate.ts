import { useMutation, useQueryClient } from '@tanstack/vue-query'
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
  const queryClient = useQueryClient()

  const { mutate: updateMember } = useMutation({
    mutationFn: (payload: UpdateMemberPayload) => memberStore.onUpdateMember(payload),
    onSuccess: (data: any, variables: UpdateMemberPayload) => {
      queryClient.invalidateQueries({ queryKey: ['get_members'] })
      queryClient.invalidateQueries({ queryKey: ['get_member_id', variables._id] })
    },
  })

  /**
   * ตรวจสอบและอัพเดท customerLevel ตามยอดซื้อ
   *
   * เงื่อนไข:
   * - very_important: ยอดซื้อ >= 30,000
   * - important: ยอดซื้อ >= 10,000
   * - general: ยอดซื้อ < 10,000 (ค่าเริ่มต้น)
   *
   * ข้อกำหนด:
   * - ต้องเช็คว่ายอดซื้อรวมถึงเงื่อนไขจริงๆ ถึงจะ update
   * - เช็ค customerLevel ปัจจุบันด้วย เผื่อ admin เปลี่ยนผิดเงื่อนไข
   * - ถ้าไม่ตรงเท่านั้น ถึงจะ update
   */
  const updateMemberCustomerLevelIfNeeded = (
    variables: IUpdateSalesPayload,
    members: IMember[] | undefined,
    allSales: ISales[] | undefined,
    allProducts: IProduct[],
    preparingStepOrder: number,
  ) => {
    const member = members?.find((m) => m._id === variables.user)
    if (!member) return

    // คำนวณยอดซื้อรวมทั้งหมด (รวม sale ปัจจุบันและ sales ที่ผ่านมา)
    const currentTotal = calculateOrderTotal(variables, allProducts)
    console.log('currentTotal', currentTotal)
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
    console.log('totalSpending', totalSpending)
    // กำหนด customerLevel ที่ควรเป็นตามยอดซื้อ
    let shouldBeLevel: 'general' | 'vip' | 'vvip' = 'general'
    if (totalSpending >= 30000) {
      shouldBeLevel = 'vvip'
    } else if (totalSpending >= 10000) {
      shouldBeLevel = 'vip'
    } else {
      shouldBeLevel = 'general'
    }

    // เช็คว่า customerLevel ปัจจุบันตรงกับที่ควรเป็นหรือไม่
    const currentLevel = member.customerLevel || 'general'
    if (currentLevel === shouldBeLevel) {
      // ถ้าตรงแล้ว ไม่ต้อง update
      return
    }
    console.log('shouldBeLevel', shouldBeLevel)

    // ถ้าไม่ตรงเท่านั้น ถึงจะ update
    updateMember({
      _id: member._id,
      status: member.status,
      customerLevel: shouldBeLevel,
      code: member.code,
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
      behaviorNotes: member.behaviorNotes,
      purchaseHistory: member.purchaseHistory,
      requirements: member.requirements,
      lastPurchaseDate: member.lastPurchaseDate,
      totalPurchaseAmount: member.totalPurchaseAmount,
      purchaseCount: member.purchaseCount,
    })
  }

  /**
   * ตรวจสอบและอัพเดทสถานะสมาชิกจาก 'ci' (สอบถาม) เป็น 'cs' (ซื้อแล้ว)
   * เมื่อ sale status >= 'preparing'
   *
   * เงื่อนไข:
   * - เช็คว่า member.status === 'ci'
   * - ถ้าใช่ → เปลี่ยนเป็น 'cs'
   */
  const updateMemberStatusIfNeeded = (
    variables: IUpdateSalesPayload,
    members: IMember[] | undefined,
  ) => {
    const member = members?.find((m) => m._id === variables.user)
    if (!member) return
    console.log('member', member.status)
    // เช็คว่า member.status === 'ci' หรือไม่
    if (member.status !== 'ci') return

    // เปลี่ยน status เป็น 'cs'
    updateMember({
      _id: member._id,
      status: 'cs',
      customerLevel: member.customerLevel || 'general',
      code: member.code,
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
      behaviorNotes: member.behaviorNotes,
      purchaseHistory: member.purchaseHistory,
      requirements: member.requirements,
      lastPurchaseDate: member.lastPurchaseDate,
      totalPurchaseAmount: member.totalPurchaseAmount,
      purchaseCount: member.purchaseCount,
    })
  }

  return {
    updateMemberStatusIfNeeded,
    updateMemberCustomerLevelIfNeeded,
  }
}
