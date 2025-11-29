import Dashboard from '@/views/DashboardView.vue'
import Members from '@/views/Member/MembersView.vue'
import Accounting from '@/views/Accounting/AccountingView.vue'
import Income from '@/views/Accounting/IncomeView.vue'
import Expense from '@/views/Accounting/ExpenseView.vue'
import CategorySettings from '@/views/Accounting/CategorySettingsView.vue'
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
import SettingDepartment from '@/views/Employee/SettingDepartmentView.vue'
import Production from '@/views/Production/ProductionView.vue'
import ProductionGuide from '@/views/Production/ProductionGuideView.vue'
import ProductionMES from '@/views/Production/ProductionMESView.vue'
import ProductionFoodCalculation from '@/views/Production/ProductionFoodCalculationView.vue'
import Product from '@/views/Product/ProductView.vue'
import ProductOptionSetting from '@/views/Product/Setting/ProductOptionSetting.vue'
import GreenhouseMapView from '@/views/Product/Fish/GreenhouseMapView.vue'
import AdminSettings from '@/views/Admin/AdminSettingView.vue'
import Sales from '@/views/Sales/SalesView.vue'
import Finance from '@/views/finance/FinanceView.vue'
import ProductionElectricView from '@/views/Production/ProductionElectricView.vue'

import FishProductView from '@/views/Product/Fish/FishProductView.vue'
import FoodProductView from '@/views/Product/Food/FoodProductView.vue'
import MicroorganismView from '@/views/Product/Microorganism/MicroorganismView.vue'

// Personnel views
import CompanyAssets from '@/views/Personnel/CompanyAssetsView.vue'
import AttendanceLeave from '@/views/Personnel/AttendanceLeaveView.vue'
import Payroll from '@/views/Personnel/PayrollView.vue'
import EmployeeEvaluation from '@/views/Personnel/EmployeeEvaluationView.vue'
import Welfare from '@/views/Personnel/WelfareView.vue'
import HRDocuments from '@/views/Personnel/HRDocumentsView.vue'
import TrainingDevelopment from '@/views/Personnel/TrainingDevelopmentView.vue'

// Finance views
import ProfitLoss from '@/views/finance/ProfitLossView.vue'
import BalanceSheet from '@/views/finance/BalanceSheetView.vue'
import CashFlow from '@/views/finance/CashFlowView.vue'
import CostAnalysis from '@/views/finance/CostAnalysisView.vue'
import InvestmentPlanning from '@/views/finance/InvestmentPlanningView.vue'
import RiskAssessment from '@/views/finance/RiskAssessmentView.vue'
import BusinessDecision from '@/views/finance/BusinessDecisionView.vue'

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
          title: 'สต็อกขาย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'สต็อกขาย' }],
        },
      },
      {
        path: '/storage/fish',
        name: 'storage-fish',
        component: FishProductView,
        meta: {
          title: 'สต็อกปลา',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'สต็อกขาย', path: '/storage' },
            { label: 'สต็อกปลา' },
          ],
        },
      },
      {
        path: '/storage/food',
        name: 'storage-food',
        component: FoodProductView,
        meta: {
          title: 'สต็อกอาหาร',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'สต็อกขาย', path: '/storage' },
            { label: 'สต็อกอาหาร' },
          ],
        },
      },
      {
        path: '/storage/microorganism',
        name: 'storage-microorganism',
        component: MicroorganismView,
        meta: {
          title: 'สต็อกจุลินทรีย์',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'สต็อกขาย', path: '/storage' },
            { label: 'สต็อกจุลินทรีย์' },
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
        path: '/accounting/income',
        name: 'income',
        component: Income,
        meta: {
          title: 'รายรับ',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }, { label: 'รายรับ' }],
        },
      },
      {
        path: '/accounting/expense',
        name: 'expense',
        component: Expense,
        meta: {
          title: 'รายจ่าย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บัญชี' }, { label: 'รายจ่าย' }],
        },
      },
      {
        path: '/accounting/expense/category-settings',
        name: 'expense-category-settings',
        component: CategorySettings,
        meta: {
          title: 'ตั้งค่ารายการค่าใช้จ่าย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'บัญชี' },
            { label: 'รายจ่าย', path: '/accounting/expense' },
            { label: 'ตั้งค่ารายการค่าใช้จ่าย' },
          ],
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
        path: '/finance/profit-loss',
        name: 'profit-loss',
        component: ProfitLoss,
        meta: {
          title: 'งบกำไรขาดทุน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'การเงิน' }, { label: 'งบกำไรขาดทุน' }],
        },
      },
      {
        path: '/finance/balance-sheet',
        name: 'balance-sheet',
        component: BalanceSheet,
        meta: {
          title: 'งบดุล',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'การเงิน' }, { label: 'งบดุล' }],
        },
      },
      {
        path: '/finance/cash-flow',
        name: 'cash-flow',
        component: CashFlow,
        meta: {
          title: 'กระแสเงินสด',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'การเงิน' }, { label: 'กระแสเงินสด' }],
        },
      },
      {
        path: '/finance/cost-analysis',
        name: 'cost-analysis',
        component: CostAnalysis,
        meta: {
          title: 'การวิเคราะห์ต้นทุน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'การเงิน' },
            { label: 'การวิเคราะห์ต้นทุน' },
          ],
        },
      },
      {
        path: '/finance/investment-planning',
        name: 'investment-planning',
        component: InvestmentPlanning,
        meta: {
          title: 'การวางแผนลงทุน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'การเงิน' }, { label: 'การวางแผนลงทุน' }],
        },
      },
      {
        path: '/finance/risk-assessment',
        name: 'risk-assessment',
        component: RiskAssessment,
        meta: {
          title: 'การประเมินความเสี่ยง',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'การเงิน' },
            { label: 'การประเมินความเสี่ยง' },
          ],
        },
      },
      {
        path: '/finance/business-decision',
        name: 'business-decision',
        component: BusinessDecision,
        meta: {
          title: 'การตัดสินใจซื้อ-กู้-ขยายธุรกิจ',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'การเงิน' },
            { label: 'การตัดสินใจซื้อ-กู้-ขยายธุรกิจ' },
          ],
        },
      },
      {
        path: '/employee',
        name: 'employee',
        component: Employee,
        meta: {
          title: 'ข้อมูลพนักงาน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'ข้อมูลพนักงาน' }],
        },
      },
      {
        path: '/employee/setting-department',
        name: 'employee-setting-department',
        component: SettingDepartment,
        meta: {
          title: 'ตั้งค่าแผนก',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'บุคลากร' },
            { label: 'ข้อมูลพนักงาน', path: '/employee' },
            { label: 'ตั้งค่าแผนก' },
          ],
        },
      },
      {
        path: '/personnel/company-assets',
        name: 'company-assets',
        component: CompanyAssets,
        meta: {
          title: 'ทรัพย์สินบริษัท',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'ทรัพย์สินบริษัท' }],
        },
      },
      {
        path: '/personnel/attendance-leave',
        name: 'attendance-leave',
        component: AttendanceLeave,
        meta: {
          title: 'ขาด-ลา-มาสาย',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'ขาด-ลา-มาสาย' }],
        },
      },
      {
        path: '/personnel/payroll',
        name: 'payroll',
        component: Payroll,
        meta: {
          title: 'เงินเดือน Payroll',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'เงินเดือน Payroll' }],
        },
      },
      {
        path: '/personnel/employee-evaluation',
        name: 'employee-evaluation',
        component: EmployeeEvaluation,
        meta: {
          title: 'การประเมินพนักงาน',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'การประเมินพนักงาน' }],
        },
      },
      {
        path: '/personnel/welfare',
        name: 'welfare',
        component: Welfare,
        meta: {
          title: 'สวัสดิการ',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'สวัสดิการ' }],
        },
      },
      {
        path: '/personnel/hr-documents',
        name: 'hr-documents',
        component: HRDocuments,
        meta: {
          title: 'เอกสาร HR',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [{ label: 'ระบบหลัก' }, { label: 'บุคลากร' }, { label: 'เอกสาร HR' }],
        },
      },
      {
        path: '/personnel/training-development',
        name: 'training-development',
        component: TrainingDevelopment,
        meta: {
          title: 'อบรม-พัฒนาบุคลากร (เสริม)',
          roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
          breadcrumb: [
            { label: 'ระบบหลัก' },
            { label: 'บุคลากร' },
            { label: 'อบรม-พัฒนาบุคลากร (เสริม)' },
          ],
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
        path: '/production/electricity-analysis',
        name: 'production-electricity-analysis',
        component: ProductionElectricView,
        meta: {
          title: 'ระบบวิเคราะห์ควบคุมการใช้ไฟฟ้า',
        },
        roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
        breadcrumb: [
          { label: 'ระบบการผลิต' },
          { label: 'ผลิต' },
          { label: 'ระบบวิเคราะห์ควบคุมการใช้ไฟฟ้า' },
        ],
      },
      {
        path: '/production/food-calculation',
        name: 'production-food-calculation',
        component: ProductionFoodCalculation,
        meta: {
          title: 'สูตรคำนวณปริมาณอาหาร',
        },
        roles: ['system', 'super_admin', 'admin', 'user', 'sales'],
        breadcrumb: [
          { label: 'ระบบการผลิต' },
          { label: 'ผลิต' },
          { label: 'สูตรคำนวณปริมาณอาหาร' },
        ],
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
