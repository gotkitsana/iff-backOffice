import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useMemberStore, type IMember, type UpdateMemberPayload } from '@/stores/member/member'
import { useSalesStore } from '@/stores/sales/sales'
import type { ISales, IUpdateSalesPayload, StatusWorkflow } from '@/types/sales'
import { convertStatusNumberToString } from '@/types/sales'
import { calculateOrderTotal, calculateSaleTotal } from '@/utils/salesCalculations'
import type { IProduct } from '@/stores/product/product'
import dayjs from 'dayjs'

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
  // const updateMemberCustomerLevelIfNeeded = (
  //   variables: IUpdateSalesPayload,
  //   members: IMember[] | undefined,
  //   allSales: ISales[] | undefined,
  //   allProducts: IProduct[],
  //   preparingStepOrder: number,
  // ) => {
  //   const member = members?.find((m) => m._id === variables.user)
  //   if (!member) return

  //   // คำนวณยอดซื้อรวมทั้งหมด (รวม sale ปัจจุบันและ sales ที่ผ่านมา)
  //   const currentTotal = calculateOrderTotal(variables, allProducts)
  //   console.log('currentTotal', currentTotal)
  //   const previousTotal =
  //     allSales
  //       ?.filter((s) => {
  //         const statusString =
  //           typeof s.sellingStatus === 'number'
  //             ? convertStatusNumberToString(s.sellingStatus)
  //             : s.sellingStatus
  //         return (
  //           s.user === variables.user &&
  //           salesStore.statusWorkflow[statusString as keyof StatusWorkflow]?.stepOrder >=
  //             preparingStepOrder &&
  //           s._id !== variables._id
  //         )
  //       })
  //       .reduce((sum, s) => sum + calculateSaleTotal(s, allProducts), 0) || 0

  //   const totalSpending = currentTotal + previousTotal
  //   console.log('totalSpending', totalSpending)
  //   // กำหนด customerLevel ที่ควรเป็นตามยอดซื้อ
  //   let shouldBeLevel: 'general' | 'vip' | 'vvip' = 'general'
  //   if (totalSpending >= 30000) {
  //     shouldBeLevel = 'vvip'
  //   } else if (totalSpending >= 10000) {
  //     shouldBeLevel = 'vip'
  //   } else {
  //     shouldBeLevel = 'general'
  //   }

  //   // เช็คว่า customerLevel ปัจจุบันตรงกับที่ควรเป็นหรือไม่
  //   const currentLevel = member.customerLevel || 'general'
  //   if (currentLevel === shouldBeLevel) {
  //     // ถ้าตรงแล้ว ไม่ต้อง update
  //     return
  //   }
  //   console.log('shouldBeLevel', shouldBeLevel)

  //   // ถ้าไม่ตรงเท่านั้น ถึงจะ update
  //   updateMember({
  //     _id: member._id,
  //     status: member.status,
  //     customerLevel: shouldBeLevel,
  //     code: member.code,
  //     contacts: member.contacts || [],
  //     interests: member.interests || [],
  //     displayName: member.displayName,
  //     name: member.name,
  //     address: member.address,
  //     province: member.province,
  //     phone: member.phone,
  //     type: member.type,
  //     username: member.username,
  //     password: member.password,
  //     bidder: member.bidder,
  //     cat: member.cat,
  //     uat: member.uat,
  //     behaviorNotes: member.behaviorNotes,
  //     purchaseHistory: member.purchaseHistory,
  //     requirements: member.requirements,
  //     lastPurchaseDate: member.lastPurchaseDate,
  //     totalPurchaseAmount: member.totalPurchaseAmount,
  //     purchaseCount: member.purchaseCount,
  //   })
  // }

  /**
   * ตรวจสอบและอัพเดทสถานะสมาชิกจาก 'ci' (สอบถาม) เป็น 'cs' (ซื้อแล้ว)
   * เมื่อ sale status >= 'preparing'
   *
   * เงื่อนไข:
   * - เช็คว่า member.status === 'ci'
   * - ถ้าใช่ → เปลี่ยนเป็น 'cs'
   */
  // const updateMemberStatusIfNeeded = (
  //   variables: IUpdateSalesPayload,
  //   members: IMember[] | undefined,
  // ) => {
  //   const member = members?.find((m) => m._id === variables.user)
  //   if (!member) return
  //   console.log('member', member.status)
  //   // เช็คว่า member.status === 'ci' หรือไม่
  //   if (member.status !== 'ci') return

  //   // เปลี่ยน status เป็น 'cs'
  //   updateMember({
  //     _id: member._id,
  //     status: 'cs',
  //     customerLevel: member.customerLevel || 'general',
  //     code: member.code,
  //     contacts: member.contacts || [],
  //     interests: member.interests || [],
  //     displayName: member.displayName,
  //     name: member.name,
  //     address: member.address,
  //     province: member.province,
  //     phone: member.phone,
  //     type: member.type,
  //     username: member.username,
  //     password: member.password,
  //     bidder: member.bidder,
  //     cat: member.cat,
  //     uat: member.uat,
  //     behaviorNotes: member.behaviorNotes,
  //     purchaseHistory: member.purchaseHistory,
  //     requirements: member.requirements,
  //     lastPurchaseDate: member.lastPurchaseDate,
  //     totalPurchaseAmount: member.totalPurchaseAmount,
  //     purchaseCount: member.purchaseCount,
  //   })
  // }

  /**
   * ตรวจสอบและเพิ่ม sale ID เข้า member.purchaseHistory อัตโนมัติ
   * เมื่อ sale status >= 'preparing'
   *
   * เงื่อนไข:
   * - Sale status >= preparing
   * - Sale ID ยังไม่อยู่ใน member.purchaseHistory
   *
   * การป้องกันการซ้ำ:
   * - เช็คว่า sale ID ยังไม่อยู่ใน purchaseHistory ก่อนเพิ่ม
   * - ถ้ามีอยู่แล้ว → ไม่ต้องทำอะไร
   */
  // const updateMemberPurchaseHistoryIfNeeded = (
  //   variables: IUpdateSalesPayload,
  //   members: IMember[] | undefined,
  //   preparingStepOrder: number,
  // ) => {
  //   const member = members?.find((m) => m._id === variables.user)
  //   if (!member) return

  //   // เช็คว่า sale status >= preparing
  //   const statusString =
  //     typeof variables.sellingStatus === 'number'
  //       ? convertStatusNumberToString(variables.sellingStatus)
  //       : variables.sellingStatus
  //   const targetStepOrder =
  //     salesStore.statusWorkflow[statusString as keyof StatusWorkflow]?.stepOrder

  //   if (!targetStepOrder || targetStepOrder < preparingStepOrder) {
  //     return
  //   }

  //   // เช็คว่า sale ID ยังไม่อยู่ใน purchaseHistory
  //   const purchaseHistory = member.purchaseHistory || []
  //   if (purchaseHistory.includes(variables._id)) {
  //     // ถ้ามีอยู่แล้ว → ไม่ต้องทำอะไร
  //     return
  //   }

  //   // เพิ่ม sale ID เข้า purchaseHistory
  //   const updatedPurchaseHistory = [...purchaseHistory, variables._id]

  //   // Update member
  //   updateMember({
  //     _id: member._id,
  //     status: member.status,
  //     customerLevel: member.customerLevel || 'general',
  //     code: member.code,
  //     contacts: member.contacts || [],
  //     interests: member.interests || [],
  //     displayName: member.displayName,
  //     name: member.name,
  //     address: member.address,
  //     province: member.province,
  //     phone: member.phone,
  //     type: member.type,
  //     username: member.username,
  //     password: member.password,
  //     bidder: member.bidder,
  //     cat: member.cat,
  //     uat: member.uat,
  //     behaviorNotes: member.behaviorNotes,
  //     purchaseHistory: updatedPurchaseHistory,
  //     requirements: member.requirements,
  //     lastPurchaseDate: member.lastPurchaseDate,
  //     totalPurchaseAmount: member.totalPurchaseAmount,
  //     purchaseCount: member.purchaseCount,
  //   })
  // }

  /**
   * ฟังก์ชันรวมสำหรับอัพเดท member status, purchaseHistory และ customerLevel
   * ในครั้งเดียวเพื่อป้องกัน race condition
   *
   * ทำทุกอย่างพร้อมกัน:
   * 1. เช็คและอัพเดท status (ci → cs)
   * 2. เช็คและเพิ่ม purchaseHistory
   * 3. เช็คและอัพเดท customerLevel (ถ้ามี hasSlip)
   *
   * ข้อดี:
   * - อ่าน member ครั้งเดียว
   * - ส่ง updateMember เพียงครั้งเดียว
   * - ป้องกัน race condition
   */
  const updateMemberStatusAndPurchaseHistory = (
    variables: IUpdateSalesPayload,
    members: IMember[] | undefined,
    preparingStepOrder: number,
    options?: {
      allSales?: ISales[] | undefined
      allProducts?: IProduct[]
    },
  ) => {
    const member = members?.find((m) => m._id === variables.user)
    if (!member) return

    // เช็คว่า sale status >= preparing
    const statusString =
      typeof variables.sellingStatus === 'number'
        ? convertStatusNumberToString(variables.sellingStatus)
        : variables.sellingStatus
    const targetStepOrder =
      salesStore.statusWorkflow[statusString as keyof StatusWorkflow]?.stepOrder

    if (!targetStepOrder || targetStepOrder < preparingStepOrder) {
      return
    }

    // เริ่มต้นด้วยข้อมูล member ปัจจุบัน
    let updatedStatus = member.status
    let updatedPurchaseHistory = member.purchaseHistory || []
    let updatedCustomerLevel = member.customerLevel || 'general'

    // 1. เช็คและอัพเดท status (ci → cs)
    if (member.status === 'ci') {
      updatedStatus = 'cs'
    }

    // 2. เช็คและเพิ่ม purchaseHistory
    if (!updatedPurchaseHistory.includes(variables._id)) {
      updatedPurchaseHistory = [...updatedPurchaseHistory, variables._id]
    }

    // 2.1. คำนวณ CRM statistics (purchaseCount, lastPurchaseDate, totalPurchaseAmount)
    let updatedPurchaseCount = member.purchaseCount || 0
    let updatedLastPurchaseDate = member.lastPurchaseDate
    let updatedTotalPurchaseAmount = member.totalPurchaseAmount || 0

    if (options?.allSales && options.allProducts && updatedPurchaseHistory.length > 0) {
      // Filter sales ที่อยู่ใน purchaseHistory
      const memberSales = options.allSales.filter((sale) =>
        updatedPurchaseHistory.includes(sale._id),
      )

      // คำนวณจำนวนครั้งที่ซื้อ
      updatedPurchaseCount = memberSales.length

      // หาวันที่ซื้อล่าสุด
      const purchaseDates = memberSales
        .map((sale) => sale.cat)
        .filter((date) => date)
        .sort((a, b) => b - a)

      updatedLastPurchaseDate =
        purchaseDates.length > 0 ? dayjs(purchaseDates[0]).toISOString() : undefined

      // คำนวณยอดซื้อรวม
      updatedTotalPurchaseAmount = memberSales.reduce((sum, sale) => {
        return sum + calculateSaleTotal(sale, options.allProducts!)
      }, 0)
    } else if (updatedPurchaseHistory.length === 0) {
      // ถ้าไม่มี purchaseHistory ให้ reset เป็นค่าเริ่มต้น
      updatedPurchaseCount = 0
      updatedLastPurchaseDate = undefined
      updatedTotalPurchaseAmount = 0
    }

    // 3. เช็คและอัพเดท customerLevel (เมื่อ status >= preparing)
    if (options?.allSales && options.allProducts) {
      // คำนวณยอดซื้อรวมทั้งหมด (รวม sale ปัจจุบันและ sales ที่ผ่านมา)
      const currentTotal = calculateOrderTotal(variables, options.allProducts)
      const previousTotal =
        options.allSales
          ?.filter((s) => {
            const sStatusString =
              typeof s.sellingStatus === 'number'
                ? convertStatusNumberToString(s.sellingStatus)
                : s.sellingStatus
            return (
              s.user === variables.user &&
              salesStore.statusWorkflow[sStatusString as keyof StatusWorkflow]?.stepOrder >=
                preparingStepOrder &&
              s._id !== variables._id
            )
          })
          .reduce((sum, s) => sum + calculateSaleTotal(s, options.allProducts!), 0) || 0

      const totalSpending = currentTotal + previousTotal

      // กำหนด customerLevel ที่ควรเป็นตามยอดซื้อ
      let shouldBeLevel: 'general' | 'vip' | 'vvip' = 'general'
      if (totalSpending >= 30000) {
        shouldBeLevel = 'vvip'
      } else if (totalSpending >= 10000) {
        shouldBeLevel = 'vip'
      } else {
        shouldBeLevel = 'general'
      }

      // อัพเดท customerLevel ถ้าต้องการ
      updatedCustomerLevel = shouldBeLevel
    }

    // ส่ง updateMember เพียงครั้งเดียวพร้อมข้อมูลที่อัพเดทครบถ้วน
    updateMember({
      _id: member._id,
      status: updatedStatus,
      customerLevel: updatedCustomerLevel,
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
      purchaseHistory: updatedPurchaseHistory,
      requirements: member.requirements,
      lastPurchaseDate: updatedLastPurchaseDate,
      totalPurchaseAmount: updatedTotalPurchaseAmount,
      purchaseCount: updatedPurchaseCount,
    })
  }

  return {
    // updateMemberStatusIfNeeded,
    // updateMemberCustomerLevelIfNeeded,
    // updateMemberPurchaseHistoryIfNeeded,
    updateMemberStatusAndPurchaseHistory,
  }
}
