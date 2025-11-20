import { computed, type Ref } from 'vue'
import type { IMember } from '@/stores/member/member'
import type { ISales } from '@/types/sales'

/**
 * Composable สำหรับคำนวณและจัดการข้อมูล CRM ของลูกค้า
 */
export function useCustomerCRM(
  members: Ref<IMember[] | undefined>,
  sales: Ref<ISales[] | undefined>,
) {
  // คำนวณ Active status จากวันที่ซื้อ/ติดต่อ/มาฟาร์มล่าสุด
  const calculateActiveStatus = (
    member: IMember,
  ): 'hot_active' | 'warm_active' | 'cold_active' | null => {
    if (!member.lastPurchaseDate) {
      return null
    }

    const now = new Date()
    const dates: Date[] = []

    if (member.lastPurchaseDate) dates.push(new Date(member.lastPurchaseDate))

    if (dates.length === 0) return null

    const lastActivityDate = new Date(Math.max(...dates.map((d) => d.getTime())))
    const daysDiff = Math.floor(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (daysDiff <= 30) return 'hot_active'
    if (daysDiff <= 60) return 'warm_active'
    if (daysDiff <= 90) return 'cold_active'
    return null // เกิน 90 วัน = Lost/Non-active
  }

  // คำนวณ Active status จาก sales data
  const calculateActiveStatusFromSales = (
    member: IMember,
    salesData: ISales[],
  ): 'hot_active' | 'warm_active' | 'cold_active' | null => {
    if (!member.purchaseHistory || member.purchaseHistory.length === 0) {
      return null
    }

    const memberSales = salesData.filter((sale) => member.purchaseHistory?.includes(sale._id))
    if (memberSales.length === 0) return null

    const now = new Date()
    const latestSale = memberSales.reduce((latest, sale) => {
      const saleDate = new Date(sale.cat || sale.uat || 0)
      const latestDate = new Date(latest.cat || latest.uat || 0)
      return saleDate > latestDate ? sale : latest
    })

    const lastSaleDate = new Date(latestSale.cat || latestSale.uat || 0)
    const daysDiff = Math.floor((now.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 30) return 'hot_active'
    if (daysDiff <= 60) return 'warm_active'
    if (daysDiff <= 90) return 'cold_active'
    return null
  }

  // สรุปจำนวนลูกค้า Active
  const activeCustomersCount = computed(() => {
    if (!members.value) return 0
    return members.value.filter((member) => {
      const status =
        calculateActiveStatus(member) || calculateActiveStatusFromSales(member, sales.value || [])
      return status !== null
    }).length
  })

  // สรุปประเภทนักเลี้ยง
  const breederTypeSummary = computed(() => {
    if (!members.value) return { newbie: 0, development: 0, competition: 0 }

    const summary = { newbie: 0, development: 0, competition: 0 }
    members.value.forEach((member) => {
      const breederType = member.interests?.find((i) => i.type === 'breeding_behavior')?.value
      if (breederType === 'newbie') summary.newbie++
      else if (breederType === 'development') summary.development++
      else if (breederType === 'competition') summary.competition++
    })
    return summary
  })

  // สรุประดับงบประมาณ
  const budgetLevelSummary = computed(() => {
    if (!members.value) return { low: 0, medium: 0, high: 0 }

    const summary = { low: 0, medium: 0, high: 0 }
    members.value.forEach((member) => {
      const budgetLevel = member.interests?.find((i) => i.type === 'budget_level')?.value
      if (budgetLevel === 'low') summary.low++
      else if (budgetLevel === 'medium') summary.medium++
      else if (budgetLevel === 'high') summary.high++
    })
    return summary
  })

  // คำนวณยอดซื้อรวมและจำนวนครั้งที่ซื้อ
  const calculatePurchaseStats = (
    member: IMember,
    salesData: ISales[],
  ): { totalAmount: number; count: number } => {
    if (!member.purchaseHistory || member.purchaseHistory.length === 0) {
      return { totalAmount: 0, count: 0 }
    }

    const memberSales = salesData.filter((sale) => member.purchaseHistory?.includes(sale._id))
    // TODO: คำนวณยอดซื้อรวมจาก sales (ต้องมี utility function สำหรับคำนวณยอดรวม)
    return {
      totalAmount: 0, // จะต้องคำนวณจาก sales items
      count: memberSales.length,
    }
  }

  return {
    calculateActiveStatus,
    calculateActiveStatusFromSales,
    activeCustomersCount,
    breederTypeSummary,
    budgetLevelSummary,
    calculatePurchaseStats,
  }
}
