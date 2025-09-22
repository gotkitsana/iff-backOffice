# ระบบ ERP สำหรับประมูลปลาคราฟ

## ภาพรวม

ระบบ ERP ที่ออกแบบมาเฉพาะสำหรับการประมูลปลาคราฟ โดยใช้ PrimeVue และ Tailwind CSS พร้อมทั้งรองรับทั้ง Mobile และ Desktop

## โครงสร้าง Layout

### 1. Header Component (`src/components/layout/Header.vue`)

- **Logo**: แสดงโลโก้ระบบ KoiFish ERP พร้อมไอคอนปลา
- **Breadcrumb**: แสดงตำแหน่งปัจจุบันในระบบ
- **Navigation Controls**:
  - ปุ่มค้นหา (Search)
  - ปุ่มตั้งค่า (Settings)
  - ปุ่มแจ้งเตือน (Notifications) พร้อมจุดแดงแสดงการแจ้งเตือน
  - รูปโปรไฟล์ผู้ใช้
  - ปุ่มเมนูสำหรับ Mobile

### 2. Sidebar Component (`src/components/layout/Sidebar.vue`)

- **เมนูหลัก**:
  - **ลูกค้า** (Customers) - จัดการข้อมูลลูกค้า
  - **บัญชี** (Accounting) - ระบบบัญชีและการเงิน
  - **บุคลากร** (Personnel) - จัดการพนักงาน
  - **ผลิต** (Production) - ระบบการผลิต
  - **การตลาด** (Marketing) - ระบบการตลาด
    - **Auction** - ระบบประมูลปลาคราฟ (Submenu)
  - **รายงาน** (Reports) - ระบบรายงาน
  - **ตั้งค่า** (Settings) - ตั้งค่าระบบ

### 3. Dashboard Layout (`src/components/layout/DashboardLayout.vue`)

- จัดการ responsive layout
- ควบคุมการแสดง/ซ่อน sidebar บน mobile
- จัดการ overlay สำหรับ mobile

### 4. Dashboard View (`src/views/DashboardView.vue`)

- **สถิติหลัก**:
  - ยอดขายรายสัปดาห์
  - ยอดขายรายเดือน
  - ยอดขายรายปี
  - จำนวนปลาที่ประมูล
- **กราฟแสดงผล**:
  - กราฟประสิทธิภาพการประมูล (14 วันล่าสุด)
  - สถานะการประมูล (สต็อก, การสั่งซื้อ, การหมุนเวียน)
- **ตารางการประมูลล่าสุด**:
  - ชื่อปลา, สายพันธุ์, ขนาด
  - ราคาสุดท้าย, ผู้ชนะ, เวลาสิ้นสุด

## คุณสมบัติ Responsive

### Desktop (≥1024px)

- Sidebar แสดงอยู่ด้านซ้ายเสมอ
- Header แสดงครบทุกฟีเจอร์
- Layout แบบ 2 คอลัมน์ (Sidebar + Main Content)

### Mobile (<1024px)

- Sidebar ซ่อนอยู่ด้านซ้าย (Slide-in)
- ปุ่ม hamburger menu ใน header
- Overlay เมื่อเปิด sidebar
- Layout แบบเต็มหน้าจอ

## การใช้งาน

### เริ่มต้นโปรเจค

```bash
npm install
npm run dev
```

### การนำทาง

1. คลิกเมนูใน sidebar เพื่อเปลี่ยนหน้า
2. เมนู "การตลาด" สามารถขยายเพื่อแสดง "Auction"
3. บน mobile ใช้ปุ่ม hamburger menu เพื่อเปิด/ปิด sidebar

### การปรับแต่ง

- แก้ไขเมนูใน `src/components/layout/Sidebar.vue`
- แก้ไข header ใน `src/components/layout/Header.vue`
- แก้ไข dashboard content ใน `src/views/DashboardView.vue`
- เพิ่ม CSS ใน `src/style.css`

## เทคโนโลยีที่ใช้

- **Vue 3** - Frontend Framework
- **TypeScript** - Type Safety
- **PrimeVue** - UI Component Library
- **Tailwind CSS** - Utility-first CSS Framework
- **Vue Router** - Client-side Routing
- **Pinia** - State Management

## ไฟล์ที่สำคัญ

- `src/components/layout/Header.vue` - Header component
- `src/components/layout/Sidebar.vue` - Sidebar navigation
- `src/components/layout/MenuItem.vue` - Menu item component
- `src/components/layout/DashboardLayout.vue` - Main layout wrapper
- `src/views/DashboardView.vue` - Dashboard page
- `src/style.css` - Global styles และ custom CSS
- `src/router/routes.ts` - Route configuration

## การพัฒนาต่อ

1. เพิ่มหน้าใหม่ใน `src/views/`
2. เพิ่ม route ใน `src/router/routes.ts`
3. เพิ่มเมนูใน `src/components/layout/Sidebar.vue`
4. สร้าง component ใหม่ตามต้องการ
