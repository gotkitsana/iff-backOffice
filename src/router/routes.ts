import Dashboard from '@/views/DashboardView.vue'
import Customers from '@/views/CustomersView.vue'
import Auction from '@/views/AuctionView.vue'
import Login from '@/views/auth/LoginView.vue'
import Unauthorized from '@/views/UnauthorizedView.vue'
import NotFound from '@/views/NotFoundView.vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

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
    // meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: Dashboard,
        meta: {
          title: 'หน้าหลัก',
          roles: ['user'],
          breadcrumb: [{ label: 'หน้าหลัก' }],
        },
      },
      {
        path: '/customers',
        name: 'customers',
        component: Customers,
        meta: {
          title: 'ลูกค้า',
          roles: ['user'],
          breadcrumb: [{ label: 'ลูกค้า' }],
        },
      },
      {
        path: '/auction',
        name: 'auction',
        component: Auction,
        meta: {
          title: 'Auction',
          roles: ['user'],
          breadcrumb: [{ label: 'การตลาด' }, { label: 'Auction' }],
        },
      },
    ],
  },
]
