import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { Search, FileText } from 'lucide-react'
import { api } from '../lib/api'

const fallbackSchemes = [
  {
    id: 1,
    title: 'Ayushman Bharat - PM-JAY',
    category: 'health',
    description: 'Health insurance scheme providing major hospitalization coverage.',
    eligibility: 'Families identified as per eligible government database.',
    documents: ['Aadhaar Card', 'Income Certificate', 'Ration Card'],
    applyLink: 'https://pmjay.gov.in/',
    detailsLink: 'https://pmjay.gov.in/about/pmjay',
    benefits: 'Cashless treatment at empaneled hospitals.',
    helpline: '14555',
  },
]

export const GovernmentSchemes = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [schemes, setSchemes] = useState(fallbackSchemes)
  const [loading, setLoading] = useState(true)

  const categories = ['all', 'health', 'education', 'employment', 'housing', 'financial']

  useEffect(() => {
    const loadSchemes = async () => {
      setLoading(true)
      try {
        const result = await api.getSchemes(selectedCategory, searchQuery)
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setSchemes(result.data)
        } else {
          setSchemes(fallbackSchemes)
        }
      } catch (error) {
        console.error('Failed to load schemes:', error)
        setSchemes(fallbackSchemes)
      } finally {
        setLoading(false)
      }
    }

    loadSchemes()
  }, [selectedCategory, searchQuery])

  const filteredSchemes = schemes.filter((scheme) => {
    const matchesSearch =
      scheme.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Government Schemes" subtitle="Find and apply for government benefits" />

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search schemes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-blue text-white'
                  : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {loading && filteredSchemes.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">Loading schemes...</Card>
        ) : (
          <div className="space-y-4">
            {filteredSchemes.map((scheme) => (
              <Card key={scheme.id} className="p-4">
                <h3 className="mb-2 font-semibold text-gray-900">{scheme.title}</h3>
                <p className="mb-3 text-sm text-gray-600">{scheme.description}</p>

                {scheme.eligibility ? (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-gray-700">Eligibility:</p>
                    <p className="text-xs text-gray-600">{scheme.eligibility}</p>
                  </div>
                ) : null}

                {Array.isArray(scheme.documents) && scheme.documents.length > 0 ? (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-medium text-gray-700">Required Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {scheme.documents.map((doc, idx) => (
                        <span key={idx} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {scheme.benefits ? (
                  <div className="mb-3 rounded-lg bg-blue-50 p-2">
                    <p className="mb-1 text-xs font-medium text-primary-blue">Key Benefits:</p>
                    <p className="text-xs text-gray-700">{scheme.benefits}</p>
                  </div>
                ) : null}

                {scheme.helpline ? (
                  <div className="mb-3 text-xs text-gray-600">
                    <span className="font-medium">Helpline: </span>
                    <a href={`tel:${scheme.helpline}`} className="text-primary-blue hover:underline">
                      {scheme.helpline}
                    </a>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(scheme.applyLink || scheme.detailsLink || 'https://www.india.gov.in/', '_blank')}
                  >
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(scheme.detailsLink || scheme.applyLink || 'https://www.india.gov.in/', '_blank')}
                  >
                    Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredSchemes.length === 0 && !loading ? (
          <Card className="p-8 text-center">
            <FileText className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">No schemes found</p>
          </Card>
        ) : null}
      </div>
      <BottomNavigation />
    </div>
  )
}
