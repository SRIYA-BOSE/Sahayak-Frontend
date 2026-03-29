import { useState } from 'react'
import { useVoiceAssistant } from '../hooks/useVoiceAssistant'
import { useTranslation } from '../hooks/useTranslation'
import { api } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { BottomNavigation } from '../components/BottomNavigation'
import { Mic, Volume2, VolumeX } from 'lucide-react'

export const VoiceAssistant = () => {
  const { t, language } = useTranslation()
  const {
    isListening,
    transcript: hookTranscript,
    response: hookResponse,
    isSpeaking,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant()
  
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  
  // Use hook values if available, otherwise use local state
  const displayTranscript = hookTranscript || transcript
  const displayResponse = hookResponse || response

  const getLanguageName = (lang) => {
    const names = {
      en: 'English',
      hi: 'हिंदी',
      or: 'ଓଡ଼ିଆ',
      bn: 'বাংলা',
      te: 'తెలుగు'
    }
    return names[lang] || 'English'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-24 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 via-purple-50/98 to-pink-50/95" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={t('Voice Assistant')}
          subtitle={t('Ask me anything about health, safety, or work')}
        />

        {/* Language Indicator */}
        <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
          <p className="text-xs text-gray-600 text-center">
            {t('Speaking in')}: <span className="font-semibold text-primary-blue">{getLanguageName(language)}</span>
          </p>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </Card>
        )}

        {/* Microphone Button with Animation */}
        <div className="flex justify-center mb-8 relative">
          <div className={`absolute inset-0 flex items-center justify-center ${isListening ? 'animate-ping' : ''}`}>
            <div className={`w-32 h-32 rounded-full ${isListening ? 'bg-red-400 opacity-75' : ''}`}></div>
          </div>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking}
            className={`
              relative z-10 w-32 h-32 rounded-full flex items-center justify-center
              transition-all duration-300 transform hover:scale-110
              ${
                isListening
                  ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse-slow shadow-2xl'
                  : isSpeaking
                  ? 'bg-gray-300'
                  : 'bg-gradient-to-br from-primary-blue to-blue-600 hover:from-blue-600 hover:to-blue-700'
              }
              ${isSpeaking ? 'cursor-not-allowed' : 'cursor-pointer'}
              shadow-xl
            `}
          >
            <Mic
              size={48}
              className="text-white drop-shadow-lg"
            />
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-gray-900">
            {isListening
              ? t('Listening...')
              : isSpeaking
              ? t('Speaking...')
              : t('Tap to speak')}
          </p>
        </div>

        {/* Transcript */}
        {displayTranscript && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{t('You said')}:</h3>
            <p className="text-gray-700">{displayTranscript}</p>
          </Card>
        )}

        {/* Response */}
        {displayResponse && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">SAHAYAK:</h3>
              <div className="flex gap-2">
                {isSpeaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <VolumeX size={18} className="text-gray-600" />
                  </button>
                ) : (
                  <button
                    onClick={() => speak(displayResponse)}
                    className="p-2 bg-primary-blue rounded-lg hover:bg-blue-700"
                  >
                    <Volume2 size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700">{displayResponse}</p>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card
            onClick={async () => {
              const question = 'What are the safety guidelines for construction work?'
              setTranscript(question)
              try {
                const result = await api.getVoiceAssistantResponse(question)
                if (result.success && result.data?.response) {
                  setResponse(result.data.response)
                  speak(result.data.response)
                } else {
                  const fallback = 'For workplace safety, always wear proper protective equipment, follow safety protocols, and report any hazards immediately. Take regular breaks and stay hydrated.'
                  setResponse(fallback)
                  speak(fallback)
                }
              } catch (err) {
                const fallback = 'For workplace safety, always wear proper protective equipment, follow safety protocols, and report any hazards immediately. Take regular breaks and stay hydrated.'
                setResponse(fallback)
                speak(fallback)
              }
            }}
            className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-900">{t('Safety Tips')}</p>
          </Card>
          <Card
            onClick={async () => {
              const question = language === 'hi' 
                ? 'मुझे काम पर अस्वस्थ महसूस हो तो मुझे क्या करना चाहिए?'
                : language === 'or'
                ? 'ମୁଁ କାମରେ ଅସୁସ୍ଥ ଅନୁଭବ କଲେ ମୋତେ କଣ କରିବା ଉଚିତ?'
                : 'What should I do if I feel unwell at work?'
              setTranscript(question)
              try {
                const result = await api.getVoiceAssistantResponse(question, language)
                if (result.success && result.data?.response) {
                  setResponse(result.data.response)
                  speak(result.data.response)
                } else {
                  const fallback = language === 'hi'
                    ? 'ଯଦି ଆପଣ କାମରେ ଅସୁସ୍ଥ ଅନୁଭବ କରନ୍ତି, ତୁରନ୍ତ ଆପଣଙ୍କର ପର୍ଯ୍ୟବେକ୍ଷକକୁ ସୂଚନା ଦିଅନ୍ତୁ, ବିଶ୍ରାମ ନିଅନ୍ତୁ, ହାଇଡ୍ରେଟେଡ୍ ରହନ୍ତୁ, ଏବଂ ଯଦି ଲକ୍ଷଣଗୁଡ଼ିକ ବଜାୟ ରହେ ତେବେ ଚିକିତ୍ସା ସାହାଯ୍ୟ ନିଅନ୍ତୁ।'
                    : language === 'or'
                    ? 'ଯଦି ଆପଣ କାମରେ ଅସୁସ୍ଥ ଅନୁଭବ କରନ୍ତି, ତୁରନ୍ତ ଆପଣଙ୍କର ପର୍ଯ୍ୟବେକ୍ଷକକୁ ସୂଚନା ଦିଅନ୍ତୁ, ବିଶ୍ରାମ ନିଅନ୍ତୁ, ହାଇଡ୍ରେଟେଡ୍ ରହନ୍ତୁ, ଏବଂ ଯଦି ଲକ୍ଷଣଗୁଡ଼ିକ ବଜାୟ ରହେ ତେବେ ଚିକିତ୍ସା ସାହାଯ୍ୟ ନିଅନ୍ତୁ।'
                    : 'If you feel unwell at work, inform your supervisor immediately, take a break, stay hydrated, and seek medical attention if symptoms persist.'
                  setResponse(fallback)
                  speak(fallback)
                }
              } catch (err) {
                const fallback = language === 'hi'
                  ? 'यदि आप काम पर अस्वस्थ महसूस करते हैं, तो तुरंत अपने पर्यवेक्षक को सूचित करें, ब्रेक लें, हाइड्रेटेड रहें, और यदि लक्षण बने रहें तो चिकित्सा सहायता लें।'
                  : language === 'or'
                  ? 'ଯଦି ଆପଣ କାମରେ ଅସୁସ୍ଥ ଅନୁଭବ କରନ୍ତି, ତୁରନ୍ତ ଆପଣଙ୍କର ପର୍ଯ୍ୟବେକ୍ଷକକୁ ସୂଚନା ଦିଅନ୍ତୁ, ବିଶ୍ରାମ ନିଅନ୍ତୁ, ହାଇଡ୍ରେଟେଡ୍ ରହନ୍ତୁ, ଏବଂ ଯଦି ଲକ୍ଷଣଗୁଡ଼ିକ ବଜାୟ ରହେ ତେବେ ଚିକିତ୍ସା ସାହାଯ୍ୟ ନିଅନ୍ତୁ।'
                  : 'If you feel unwell at work, inform your supervisor immediately, take a break, stay hydrated, and seek medical attention if symptoms persist.'
                setResponse(fallback)
                speak(fallback)
              }
            }}
            className="p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
          >
            <p className="text-sm font-medium text-gray-900">{t('Health Advice')}</p>
          </Card>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
