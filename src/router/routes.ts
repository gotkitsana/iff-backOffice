import Dashboard from '@/views/DashboardView.vue'
import Members from '@/views/Member/MembersView.vue'
import Accounting from '@/views/Accounting/AccountingView.vue'
import IncomeExpense from '@/views/Accounting/IncomeExpenseView.vue'
import Assets from '@/views/Accounting/AssetsView.vue'
import Debt from '@/views/Accounting/DebtView.vue'
import Loan from '@/views/Accounting/LoanView.vue'
import Auction from '@/views/Auction/AuctionView.vue'
import AuctionDetail from '@/views/Auction/AuctionDetailView.vue'
import AuctionSettings from '@/views/Auction/AuctionSettingsView.vue'
import Login from '@/views/auth/LoginView.vue'
import Unauthorized from '@/views/UnauthorizedView.vue'
import NotFound from '@/views/NotFoundView.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import Employee from '@/views/Employee/EmployeeView.vue'
import Production from '@/views/Production/ProductionView.vue'
import ProductionGuide from '@/views/Production/ProductionGuideView.vue'
import ProductionMES from '@/views/Production/ProductionMESView.vue'
import Product from '@/views/Product/ProductView.vue'
import ProductOptionSetting from '@/views/Product/ProductOptionSetting.vue'
import GreenhouseMapView from '@/views/Product/GreenhouseMapView.vue'
import AdminSettings from '@/views/Admin/AdminSettingView.vue'
import Sales from '@/views/Sales/SalesView.vue'
import Finance from '@/views/finance/FinanceView.vue'

import FishProductView from '@/views/Product/Category/FishProductView.vue'

export default [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'เข้าสู่ระบบ',
    },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: Unauthorized,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
  {
    path: '/',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard,
        meta: {
          title: 'ภาพรวม',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ภาพรวม' }],
        },
      },
      {
        path: '/members',
        name: 'members',
        component: Members,
        meta: {
          title: 'ข้อมูลลูกค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ข้อมูลลูกค้า' }],
        },
      },
      {
        path: '/sales',
        name: 'sales',
        component: Sales,
        meta: {
          title: 'ขาย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'ขาย' }],
        },
      },
      {
        path: '/shipping',
        name: 'shipping',
        component: Dashboard,
        meta: {
          title: 'จัดส่ง',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'จัดส่ง' }],
        },
      },
      {
        path: '/storage',
        name: 'storage',
        component: Product,
        meta: {
          title: 'คลังสินค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'คลังสินค้า' }],
        },
      },
      {
        path: '/storage/fish',
        name: 'storage-fish',
        component: FishProductView,
        meta: {
          title: 'คลังปลา',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'คลังสินค้า', path: '/storage' },
            { label: 'คลังปลา' },
          ],
        },
      },
      {
        path: '/accounting',
        name: 'accounting',
        component: Accounting,
        meta: {
          title: 'บัญชี',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }],
        },
      },
      {
        path: '/accounting/income-expense',
        name: 'income-expense',
        component: IncomeExpense,
        meta: {
          title: 'รายรับ/รายจ่าย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }, { label: 'รายรับ/รายจ่าย' }],
        },
      },
      {
        path: '/accounting/assets',
        name: 'assets',
        component: Assets,
        meta: {
          title: 'สินทรัพย์',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }, { label: 'สินทรัพย์' }],
        },
      },
      {
        path: '/accounting/debt',
        name: 'debt',
        component: Debt,
        meta: {
          title: 'ลูกหนี้',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }, { label: 'ลูกหนี้' }],
        },
      },
      {
        path: '/accounting/loan',
        name: 'loan',
        component: Loan,
        meta: {
          title: 'กู้ยืม/หนี้สิน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }, { label: 'กู้ยืม/หนี้สิน' }],
        },
      },
      {
        path: '/finance',
        name: 'finance',
        component: Finance,
        meta: {
          title: 'การเงิน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'การเงิน' }],
        },
      },
      {
        path: '/employee',
        name: 'employee',
        component: Employee,
        meta: {
          title: 'บุคลากร',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }],
        },
      },

      {
        path: '/production',
        name: 'production',
        component: Production,
        meta: {
          title: 'ผลิต',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการผลิต' }, { label: 'ผลิต' }],
        },
      },
      {
        path: '/production/guide',
        name: 'production-guide',
        component: ProductionGuide,
        meta: {
          title: 'คู่มือ',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการผลิต' }, { label: 'ผลิต' }, { label: 'คู่มือ' }],
        },
      },
      {
        path: '/production/mes',
        name: 'production-mes',
        component: ProductionMES,
        meta: {
          title: 'ระบบบริหารการผลิต MES',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบการผลิต' },
            { label: 'ผลิต' },
            { label: 'ระบบบริหารการผลิต MES' },
          ],
        },
      },

      {
        path: '/promotion',
        name: 'promotion',
        component: Dashboard,
        meta: {
          title: 'โปรโมชั่น',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'โปรโมชั่น' }],
        },
      },
      {
        path: '/auction',
        name: 'auction',
        component: Auction,
        meta: {
          title: 'Auction',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'Auction' }],
        },
      },
      {
        path: '/auction/:id',
        name: 'auction-detail',
        component: AuctionDetail,
        meta: {
          title: 'รายละเอียดการประมูล',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบการตลาด' },
            { label: 'Auction' },
            { label: 'รายละเอียดการประมูล' },
          ],
        },
      },
      {
        path: '/auction/:id/settings',
        name: 'auction-settings',
        component: AuctionSettings,
        meta: {
          title: 'ตั้งค่าระบบประมูล',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบการตลาด' },
            { label: 'Auction' },
            { label: 'ตั้งค่าระบบประมูล' },
          ],
        },
      },

      // {
      //   path: '/koi-store',
      //   name: 'koi-store',
      //   component: KoiStore,
      //   meta: {
      //     title: 'คลังปลาคราฟ',
      //     roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
      //     breadcrumb: [{ label: 'ระบบการตลาด' }, { label: 'คลังปลาคราฟ' }],
      //   },
      // },

      {
        path: '/product',
        name: 'product',
        component: Product,
        meta: {
          title: 'จัดการสินค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบ POS' }, { label: 'จัดการสินค้า' }],
        },
      },
      // {
      //   path: '/product/pond-settings',
      //   name: 'pond-settings',
      //   component: PondSettings,
      //   meta: {
      //     title: 'ตั้งค่าบ่อปลาคาร์ฟ',
      //     roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
      //     breadcrumb: [
      //       { label: 'ระบบ POS' },
      //       { label: 'จัดการสินค้า' },
      //       { label: 'ตั้งค่าบ่อปลาคาร์ฟ' },
      //     ],
      //   },
      // },
      // {
      //   path: '/product/species-settings',
      //   name: 'species-settings',
      //   component: SpeciesSettings,
      //   meta: {
      //     title: 'จัดการสายพันธุ์ปลา',
      //     roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
      //     breadcrumb: [
      //       { label: 'ระบบ POS' },
      //       { label: 'จัดการสินค้า' },
      //       { label: 'จัดการสายพันธุ์ปลา' },
      //     ],
      //   },
      // },
      {
        path: '/product/options-settings',
        name: 'product-settings',
        component: ProductOptionSetting,
        meta: {
          title: 'ตั้งค่าตัวเลือกสินค้า',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบ POS' },
            { label: 'จัดการสินค้า' },
            { label: 'ตั้งค่าตัวเลือกสินค้า' },
          ],
        },
      },
      {
        path: '/product/greenhouse-map',
        name: 'greenhouse-map',
        component: GreenhouseMapView,
        meta: {
          title: 'แผนผังกรีนเฮาส์',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบ POS' },
            { label: 'จัดการสินค้า' },
            { label: 'แผนผังกรีนเฮาส์' },
          ],
        },
      },

      {
        path: '/admin-settings',
        name: 'admin-settings',
        component: AdminSettings,
        meta: {
          title: 'จัดการ Admin',
          roles: ['system', 'super_admin', 'admin'],
          breadcrumb: [{ label: 'ระบบ Admin' }, { label: 'จัดการ Admin' }],
        },
      },
    ],
  },
]
