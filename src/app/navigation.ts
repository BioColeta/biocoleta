import {
  Bell,
  ClipboardList,
  CloudRain,
  Cpu,
  History,
  LayoutDashboard,
  Map,
  RadioTower,
  Sparkles,
} from 'lucide-react'

export const navigation = [
  { to: '/app/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/app/map', label: 'Mapa', icon: Map },
  { to: '/app/alerts', label: 'Alertas', icon: Bell },
  { to: '/app/work-orders', label: 'Ordens de serviço', icon: ClipboardList },
  { to: '/app/devices', label: 'Dispositivos', icon: Cpu },
  { to: '/app/planning', label: 'Planejamento de chuva', icon: CloudRain },
  { to: '/app/history', label: 'Histórico', icon: History },
  { to: '/app/settings', label: 'Análise de IA', icon: Sparkles },
  { to: '/simulator', label: 'Simulador', icon: RadioTower },
] as const
