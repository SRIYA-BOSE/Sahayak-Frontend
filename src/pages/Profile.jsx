import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBluetooth } from '../hooks/useBluetooth'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { BottomNavigation } from '../components/BottomNavigation'
import { User, Phone, Mail, Globe, Bluetooth, Battery, LogOut, Settings, Camera, Upload } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import { saveOfflineData, getOfflineData } from '../lib/indexedDB'
import { api } from '../lib/api'

const defaultEmergencyContacts = [
  { id: 'emergency-108', name: 'Emergency Services', phone: '108', relationship: 'Ambulance' },
  { id: 'emergency-100', name: 'Police', phone: '100', relationship: 'Police' },
  { id: 'emergency-101', name: 'Fire', phone: '101', relationship: 'Fire' },
]

export const Profile = () => {
  const navigate = useNavigate()
  const { user, signOut, language, setLanguage } = useAuth()
  const { isConnected, batteryLevel, device } = useBluetooth()
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [languageMessage, setLanguageMessage] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { t } = useTranslation()

  useEffect(() => {
    const loadEmergencyContacts = async () => {
      try {
        const result = await api.getEmergencyContacts()
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setEmergencyContacts(result.data)
          return
        }
      } catch (error) {
        console.error('Failed to load emergency contacts:', error)
      }

      setEmergencyContacts(defaultEmergencyContacts)
    }

    loadEmergencyContacts()
    
    // Load profile photo from IndexedDB
    getOfflineData('profile_photo').then((photo) => {
      if (photo) setProfilePhoto(photo)
    }).catch(console.error)
  }, [])

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('Please select an image file'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('Image size should be less than 5MB'))
      return
    }

    setUploading(true)
    try {
      // Convert to base64 for storage
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result
        // Save to IndexedDB
        await saveOfflineData('profile_photo', base64String)
        setProfilePhoto(base64String)
        setUploading(false)
      }
      reader.onerror = () => {
        alert(t('Error reading file'))
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert(t('Failed to upload photo'))
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'te', name: 'తెలుగు' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/90 to-gray-50/80" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title={t('Profile')} showBack={false} />

        {/* User Info */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary-blue"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-blue rounded-full flex items-center justify-center">
                  <User className="text-white" size={40} />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-primary-blue text-white rounded-full hover:bg-blue-700 shadow-lg disabled:opacity-50"
              >
                {uploading ? (
                  <Upload size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.user_metadata?.name || t('User')}
              </h2>
              <p className="text-gray-600 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} />
              <span>{user?.email}</span>
            </div>
            {user?.user_metadata?.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span>{user.user_metadata.phone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Device Status */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bluetooth size={20} />
            {t('Device Status')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('Connection')}</span>
              <span className={`font-medium ${isConnected ? 'text-primary-green' : 'text-gray-400'}`}>
                {isConnected ? t('Connected') : t('Disconnected')}
              </span>
            </div>
            {isConnected && batteryLevel !== null && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('Battery')}</span>
                <div className="flex items-center gap-2">
                  <Battery size={16} className="text-gray-600" />
                  <span className="font-medium">{batteryLevel}%</span>
                </div>
              </div>
            )}
            {device && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('Device')}</span>
                <span className="font-medium text-sm">{device.name || 'SAHAYAK Device'}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">{t('Emergency Contacts')}</h3>
          <div className="space-y-2">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{t(contact.name)}</p>
                  <p className="text-sm text-gray-600">{contact.phone}</p>
                  {contact.relationship ? (
                    <p className="text-xs text-gray-500">{t(contact.relationship)}</p>
                  ) : null}
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="text-primary-blue font-medium"
                >
                  {t('Call')}
                </a>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => navigate('/emergency')}
          >
            {t('Manage Contacts')}
          </Button>
        </Card>

        {/* Language Selection */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Globe size={20} />
            {t('Language')}
          </h3>
          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setLanguageMessage(t('Language updated'))
                  setTimeout(() => setLanguageMessage(''), 2000)
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  language === lang.code
                    ? 'bg-primary-blue text-white'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
          {languageMessage && (
            <p className="text-xs text-primary-blue mt-2">{languageMessage}</p>
          )}
        </Card>

        {/* Settings */}
        <Card className="p-4 mb-6">
          <button
            onClick={() => navigate('/device')}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className="text-gray-600" />
              <span className="font-medium text-gray-900">{t('Device Settings')}</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </Card>

        {/* Logout */}
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          onClick={handleLogout}
        >
          <div className="flex items-center justify-center gap-2">
            <LogOut size={20} />
            {t('Logout')}
          </div>
        </Button>
      </div>
      <BottomNavigation />
    </div>
  )
}
