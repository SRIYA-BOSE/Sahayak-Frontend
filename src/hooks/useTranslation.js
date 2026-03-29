import { useAuth } from '../context/AuthContext'
import { translateText } from '../lib/i18n'

export const useTranslation = () => {
  const { language } = useAuth()

  const t = (text) => translateText(text, language)

  return { t, language }
}


