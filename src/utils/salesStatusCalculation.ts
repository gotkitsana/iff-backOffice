import type { PaymentMethod, DeliveryStatus, SellingStatus } from '@/types/sales'

/**
 * คำนวณสถานะเริ่มต้นจากวิธีชำระเงินและเงื่อนไขอื่นๆ
 */
export function calculateInitialStatus(
  paymentMethod: PaymentMethod,
  deliveryStatus?: DeliveryStatus,
  hasProducts?: boolean,
): SellingStatus {
  switch (paymentMethod) {
    case 'order':
      // ออเดอร์ → order
      return 'order'

    case 'cash':
      // เงินสด + ได้รับสินค้าแล้ว → received
      if (deliveryStatus === 'received') {
        return 'received'
      }
      // เงินสด + แพ็ครอจัดส่ง → preparing
      return 'preparing'

    case 'credit':
      // เครดิต → preparing
      return 'preparing'

    case 'transfer':
    case 'card':
      // โอน/บัตร → wait_payment
      return 'wait_payment'

    case 'cod':
      // ปลายทาง → preparing
      return 'preparing'

    default:
      return 'wait_payment'
  }
}
