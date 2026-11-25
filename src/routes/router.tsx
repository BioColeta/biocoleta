import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { AppLayout } from '@/app/AppLayout'
import { NotFound } from '@/app/NotFound'
import { LoadingState } from '@/components/states'
import * as search from '@/routes/search'

const root = createRootRoute({ component: Outlet, notFoundComponent: NotFound })

const landing = createRoute({
  getParentRoute: () => root,
  path: '/',
  component: lazyRouteComponent(() => import('@/features/landing/LandingPage'), 'LandingPage'),
})
const login = createRoute({
  getParentRoute: () => root,
  path: '/login',
  validateSearch: search.loginSearch,
  component: lazyRouteComponent(() => import('@/features/auth/LoginPage'), 'LoginPage'),
})
const simulator = createRoute({
  getParentRoute: () => root,
  path: '/simulator',
  component: lazyRouteComponent(
    () => import('@/features/simulator/SimulatorPage'),
    'SimulatorPage',
  ),
})

const app = createRoute({ getParentRoute: () => root, path: '/app', component: AppLayout })
const appIndex = createRoute({
  getParentRoute: () => app,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/app/dashboard' })
  },
})
const dashboard = createRoute({
  getParentRoute: () => app,
  path: 'dashboard',
  validateSearch: search.dashboardSearch,
  component: lazyRouteComponent(
    () => import('@/features/dashboard/DashboardPage'),
    'DashboardPage',
  ),
})
const map = createRoute({
  getParentRoute: () => app,
  path: 'map',
  validateSearch: search.mapSearch,
  component: lazyRouteComponent(() => import('@/features/map/MapPage'), 'MapPage'),
})
const alerts = createRoute({
  getParentRoute: () => app,
  path: 'alerts',
  validateSearch: search.alertsSearch,
  component: lazyRouteComponent(() => import('@/features/alerts/AlertsPage'), 'AlertsPage'),
})
const alertDetail = createRoute({
  getParentRoute: () => app,
  path: 'alerts/$alertId',
  component: lazyRouteComponent(
    () => import('@/features/alerts/AlertDetailPage'),
    'AlertDetailPage',
  ),
})
const devices = createRoute({
  getParentRoute: () => app,
  path: 'devices',
  validateSearch: search.devicesSearch,
  component: lazyRouteComponent(() => import('@/features/devices/DevicesPage'), 'DevicesPage'),
})
const deviceDetail = createRoute({
  getParentRoute: () => app,
  path: 'devices/$deviceId',
  component: lazyRouteComponent(
    () => import('@/features/devices/DeviceDetailPage'),
    'DeviceDetailPage',
  ),
})
const workOrders = createRoute({
  getParentRoute: () => app,
  path: 'work-orders',
  component: lazyRouteComponent(
    () => import('@/features/work-orders/WorkOrdersPage'),
    'WorkOrdersPage',
  ),
})
const planning = createRoute({
  getParentRoute: () => app,
  path: 'planning',
  validateSearch: search.planningSearch,
  component: lazyRouteComponent(() => import('@/features/planning/PlanningPage'), 'PlanningPage'),
})
const history = createRoute({
  getParentRoute: () => app,
  path: 'history',
  validateSearch: search.historySearch,
  component: lazyRouteComponent(() => import('@/features/history/HistoryPage'), 'HistoryPage'),
})
const settings = createRoute({
  getParentRoute: () => app,
  path: 'settings',
  component: lazyRouteComponent(() => import('@/features/ai/SettingsPage'), 'SettingsPage'),
})

const routeTree = root.addChildren([
  landing,
  login,
  simulator,
  app.addChildren([
    appIndex,
    dashboard,
    map,
    alerts,
    alertDetail,
    devices,
    deviceDetail,
    workOrders,
    planning,
    history,
    settings,
  ]),
])

export function createAppRouter() {
  return createRouter({
    routeTree,
    basepath: import.meta.env.BASE_URL,
    defaultPreload: 'intent',
    defaultPendingComponent: () => <LoadingState />,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
