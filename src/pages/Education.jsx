import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { BottomNavigation } from '../components/BottomNavigation'
import { Book, Play, CheckCircle, Headphones } from 'lucide-react'
import { useVoiceAssistant } from '../hooks/useVoiceAssistant'
import { useTranslation } from '../hooks/useTranslation'

export const Education = () => {
  const navigate = useNavigate()
  const { speak } = useVoiceAssistant()
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [progress, setProgress] = useState({})

  const categories = [
    {
      id: 'safety',
      name: t('Safety Guidelines'),
      icon: '🛡️',
      color: 'bg-red-50 text-red-600',
      content: [
        { id: 1, title: t('Workplace Safety Basics'), duration: '5 min', audio: true },
        { id: 2, title: t('Personal Protective Equipment'), duration: '8 min', audio: true },
        { id: 3, title: t('Emergency Procedures'), duration: '6 min', audio: true },
      ],
    },
    {
      id: 'health',
      name: t('Health & Wellness'),
      icon: '❤️',
      color: 'bg-pink-50 text-pink-600',
      content: [
        { id: 4, title: t('Nutrition for Workers'), duration: '10 min', audio: true },
        { id: 5, title: t('Exercise & Fitness'), duration: '7 min', audio: true },
        { id: 6, title: t('Mental Health'), duration: '9 min', audio: true },
      ],
    },
    {
      id: 'rights',
      name: t('Workers Rights'),
      icon: '⚖️',
      color: 'bg-blue-50 text-blue-600',
      content: [
        { id: 7, title: t('Labor Laws Overview'), duration: '12 min', audio: true },
        { id: 8, title: t('Wage & Benefits'), duration: '8 min', audio: true },
        { id: 9, title: t('Workplace Harassment'), duration: '10 min', audio: true },
      ],
    },
    {
      id: 'skills',
      name: t('Skill Development'),
      icon: '📚',
      color: 'bg-green-50 text-primary-green',
      content: [
        { id: 10, title: t('Communication Skills'), duration: '15 min', audio: true },
        { id: 11, title: t('Digital Literacy'), duration: '20 min', audio: true },
        { id: 12, title: t('Financial Planning'), duration: '18 min', audio: true },
      ],
    },
  ]

  const handlePlayAudio = (content) => {
    // In a real app, this would play actual audio content
    speak(`Playing: ${content.title}. This is a sample audio content.`)
  }

  const handleMarkComplete = (contentId) => {
    setProgress((prev) => ({ ...prev, [contentId]: true }))
  }

  if (selectedCategory) {
    const category = categories.find((c) => c.id === selectedCategory)
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-primary-blue mb-3"
            >
              ← {t('Back')}
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          </div>

          <div className="space-y-3">
            {category.content.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      {progress[item.id] && (
                        <CheckCircle className="text-primary-green" size={20} />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Headphones size={16} />
                        {item.duration}
                      </span>
                      {item.audio && (
                        <span className="text-primary-blue">{t('Audio Available')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {item.audio && (
                      <button
                        onClick={() => handlePlayAudio(item)}
                        className="p-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700"
                      >
                        <Play size={20} />
                      </button>
                    )}
                    {!progress[item.id] && (
                      <button
                        onClick={() => handleMarkComplete(item.id)}
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Progress Summary */}
          <Card className="p-4 mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t('Progress')}</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-green h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (Object.keys(progress).filter((id) =>
                        category.content.some((c) => c.id === parseInt(id))
                      ).length /
                        category.content.length) *
                      100
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-600">
                {Object.keys(progress).filter((id) =>
                  category.content.some((c) => c.id === parseInt(id))
                ).length}{' '}
                / {category.content.length}
              </span>
            </div>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Education & Learning"
          subtitle="Learn about safety, health, and your rights"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="p-6 text-center"
            >
              <div className={`${category.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl`}>
                {category.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {category.content.length} {t('lessons')}
              </p>
            </Card>
          ))}
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
