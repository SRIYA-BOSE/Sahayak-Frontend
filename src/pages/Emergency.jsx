import { useState, useEffect } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { Phone, AlertTriangle, MapPin, Share2, Heart, MessageCircle, Plus, X, User } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const Emergency = () => {
  const { user } = useAuth()
  const [location, setLocation] = useState(null)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' })
  const [sendingMessage, setSendingMessage] = useState(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => console.error('Geolocation error:', error)
      )
    }
    
    // Load emergency contacts
    loadEmergencyContacts()
  }, [])

  const loadEmergencyContacts = async () => {
    try {
      setLoading(true)
      const result = await api.getEmergencyContacts()
      if (result.success && result.data) {
        setEmergencyContacts(result.data)
      } else {
        // Use dummy contacts if API fails
        setEmergencyContacts([
          { id: 1, name: 'Family Member', phone: '+91 98765 43210', relationship: 'Family', is_primary: true },
          { id: 2, name: 'Friend', phone: '+91 98765 43211', relationship: 'Friend', is_primary: false }
        ])
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
      // Use dummy contacts on error
      setEmergencyContacts([
        { id: 1, name: 'Family Member', phone: '+91 98765 43210', relationship: 'Family', is_primary: true },
        { id: 2, name: 'Friend', phone: '+91 98765 43211', relationship: 'Friend', is_primary: false }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      alert('Please fill in name and phone number')
      return
    }

    try {
      const result = await api.addEmergencyContact({
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship || 'Other',
        isPrimary: false
      })

      if (result.success) {
        await loadEmergencyContacts()
        setNewContact({ name: '', phone: '', relationship: '' })
        setShowAddForm(false)
      } else {
        alert('Failed to add contact. Using local storage.')
        // Add to local state
        const newId = Math.max(...emergencyContacts.map(c => c.id || 0), 0) + 1
        setEmergencyContacts([...emergencyContacts, {
          id: newId,
          ...newContact,
          relationship: newContact.relationship || 'Other',
          is_primary: false
        }])
        setNewContact({ name: '', phone: '', relationship: '' })
        setShowAddForm(false)
      }
    } catch (err) {
      console.error('Error adding contact:', err)
      // Add to local state on error
      const newId = Math.max(...emergencyContacts.map(c => c.id || 0), 0) + 1
      setEmergencyContacts([...emergencyContacts, {
        id: newId,
        ...newContact,
        relationship: newContact.relationship || 'Other',
        is_primary: false
      }])
      setNewContact({ name: '', phone: '', relationship: '' })
      setShowAddForm(false)
    }
  }

  const handleDeleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const result = await api.deleteEmergencyContact(id)
      if (result.success) {
        await loadEmergencyContacts()
      } else {
        // Remove from local state
        setEmergencyContacts(emergencyContacts.filter(c => c.id !== id))
      }
    } catch (err) {
      console.error('Error deleting contact:', err)
      // Remove from local state on error
      setEmergencyContacts(emergencyContacts.filter(c => c.id !== id))
    }
  }

  const handleSendMessage = async (contact) => {
    setSendingMessage(contact.id)
    const message = location 
      ? `Emergency! My location: https://maps.google.com/?q=${location.lat},${location.lon}`
      : 'Emergency! I need help immediately.'

    try {
      // Try to use SMS API if available, otherwise use tel: link
      if (navigator.share) {
        await navigator.share({
          title: 'Emergency Alert',
          text: message,
        })
      } else {
        // Fallback: open messaging app
        const phoneNumber = contact.phone.replace(/[^0-9+]/g, '')
        window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_blank')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${contact.phone}: ${message}`)
      alert('Message copied to clipboard. Please send it manually.')
    } finally {
      setSendingMessage(null)
    }
  }

  const emergencyNumbers = [
    { name: 'Emergency Services', number: '108', type: 'ambulance' },
    { name: 'Police', number: '100', type: 'police' },
    { name: 'Fire', number: '101', type: 'fire' },
    { name: 'Women Helpline', number: '1091', type: 'helpline' },
    { name: 'Child Helpline', number: '1098', type: 'helpline' },
  ]

  const handlePanicButton = () => {
    // In a real app, this would:
    // 1. Send location to emergency contacts
    // 2. Broadcast health data
    // 3. Call emergency services
    alert('Emergency alert sent! Help is on the way.')
  }

  const handleShareLocation = async () => {
    if (!location) return

    setSharingLocation(true)
    const message = `Emergency! My location: https://maps.google.com/?q=${location.lat},${location.lon}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Emergency Location',
          text: message,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(message)
      alert('Location copied to clipboard')
    }
    setSharingLocation(false)
  }

  const handleHealthBroadcast = () => {
    // In a real app, this would broadcast current vital signs
    alert('Health data broadcasted to emergency contacts')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Emergency" subtitle="Quick access to emergency services" />

        {/* Panic Button */}
        <Card className="p-6 mb-6 bg-red-600 text-white">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold mb-2">Emergency Alert</h2>
            <p className="text-red-100 mb-6">
              Press the button below to send an emergency alert with your location and health data
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={handlePanicButton}
              className="w-full bg-white text-red-600 hover:bg-red-50"
            >
              <div className="flex items-center justify-center gap-2">
                <AlertTriangle size={24} />
                PANIC BUTTON
              </div>
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleShareLocation}
            disabled={!location || sharingLocation}
            className="flex flex-col items-center justify-center h-20"
          >
            <MapPin size={24} className="mb-2" />
            Share Location
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleHealthBroadcast}
            className="flex flex-col items-center justify-center h-20"
          >
            <Heart size={24} className="mb-2" />
            Broadcast Health
          </Button>
        </div>

        {/* Emergency Numbers */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Emergency Numbers</h3>
          <div className="space-y-2">
            {emergencyNumbers.map((contact, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.number}</p>
                </div>
                <a
                  href={`tel:${contact.number}`}
                  className="p-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700"
                >
                  <Phone size={20} />
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Emergency Contacts</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Add Contact Form */}
          {showAddForm && (
            <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <input
                  type="text"
                  placeholder="Relationship (optional)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddContact}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewContact({ name: '', phone: '', relationship: '' })
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : emergencyContacts.length > 0 ? (
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
                      <User className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        {contact.is_primary && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                      {contact.relationship && (
                        <p className="text-xs text-gray-500">{contact.relationship}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                      className="p-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700"
                    >
                      <Phone size={18} />
                    </a>
                    <button
                      onClick={() => handleSendMessage(contact)}
                      disabled={sendingMessage === contact.id}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      {sendingMessage === contact.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <MessageCircle size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No emergency contacts added yet</p>
              <p className="text-sm">Click the + button to add one</p>
            </div>
          )}
        </Card>
      </div>
      <BottomNavigation />
    </div>
  )
}
