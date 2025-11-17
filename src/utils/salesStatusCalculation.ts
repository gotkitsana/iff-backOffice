import type { PaymentMethod, DeliveryStatus } from '@/types/sales'
import { SellingStatus, convertStatusStringToNumber } from '@/types/sales'

/**
 * คำนวณสถานะเริ่มต้นจากวิธีชำระเงินและเงื่อนไขอื่นๆ
 * Return เป็น enum number (0-6) ตามที่ backend ต้องการ
 */
export function calculateInitialStatus(
  paymentMethod: PaymentMethod,
  deliveryStatus?: DeliveryStatus,
  hasProducts?: boolean,
): SellingStatus {
  switch (paymentMethod) {
    case 'order':
      // ออเดอร์ → order (1)
      return SellingStatus.order

    case 'cash':
      // เงินสด + ได้รับสินค้าแล้ว → received (5)
      if (deliveryStatus === 'received') {
        return SellingStatus.received
      }
      // เงินสด + แพ็ครอจัดส่ง → preparing (3)
      return SellingStatus.preparing

    case 'credit':
      // เครดิต → preparing (3)
      return SellingStatus.preparing

    case 'transfer':
    case 'card':
      // โอน/บัตร → wait_payment (2)
      return SellingStatus.wait_payment

    case 'cod':
      // ปลายทาง → preparing (3)
      return SellingStatus.preparing

    default:
      return SellingStatus.wait_payment
  }
}
