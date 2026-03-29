import { Link, useLocation } from 'react-router-dom'
import { Home, User, Activity, Bell, Cloud } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { LiveVitalsBar } from './LiveVitalsBar'

export const BottomNavigation = () => {
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/health', icon: Activity, label: 'Health' },
    { path: '/weather', icon: Cloud, label: 'Weather' },
    { path: '/notifications', icon: Bell, label: 'Notifications & Alerts' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-2 pb-2 sm:px-4 sm:pb-4">
      <LiveVitalsBar />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-around rounded-2xl border border-gray-200 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex h-full flex-1 flex-col items-center justify-center gap-1 px-1 text-center transition-colors sm:px-3 ${
                isActive ? 'text-primary-blue' : 'text-gray-500'
              }`}
            >
              <Icon size={24} className={isActive ? 'text-primary-blue' : ''} />
              <span className="max-w-[5rem] text-[10px] leading-tight sm:max-w-none sm:text-xs">
                {t(item.label)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

