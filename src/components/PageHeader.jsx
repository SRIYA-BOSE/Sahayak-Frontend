import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'

export const PageHeader = ({ title, subtitle, showBack = false }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="mb-6">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t(title)}</h1>
      {subtitle && <p className="mt-1 max-w-3xl text-sm text-gray-600 sm:text-base">{t(subtitle)}</p>}
    </div>
  )
}

