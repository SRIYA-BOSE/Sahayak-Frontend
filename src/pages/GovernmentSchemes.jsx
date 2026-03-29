import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { Search, FileText, CheckCircle, XCircle } from 'lucide-react'

export const GovernmentSchemes = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', 'health', 'education', 'employment', 'housing', 'financial']

  const schemes = [
    {
      id: 1,
      title: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
      category: 'health',
      description: 'Health insurance scheme providing coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization',
      eligibility: 'Families identified as per SECC database, covering bottom 40% of the population',
      documents: ['Aadhaar Card', 'Income Certificate', 'Ration Card', 'Family Photo'],
      applyLink: 'https://pmjay.gov.in/',
      detailsLink: 'https://pmjay.gov.in/about/pmjay',
      benefits: 'Cashless treatment at empaneled hospitals, coverage for pre-existing conditions, no age limit',
      helpline: '14555',
    },
    {
      id: 2,
      title: 'Pradhan Mantri Awas Yojana (PMAY)',
      category: 'housing',
      description: 'Housing scheme for affordable housing with interest subsidy up to ₹2.67 lakh',
      eligibility: 'Economically Weaker Section (EWS), Lower Income Group (LIG), Middle Income Group (MIG)',
      documents: ['Aadhaar Card', 'Income Certificate', 'Land Documents', 'Bank Account Details'],
      applyLink: 'https://pmaymis.gov.in/',
      detailsLink: 'https://pmaymis.gov.in/',
      benefits: 'Interest subsidy on home loans, affordable housing in urban and rural areas',
      helpline: '1800-11-3377',
    },
    {
      id: 3,
      title: 'Mahatma Gandhi National Rural Employment Guarantee Act (MGNREGA)',
      category: 'employment',
      description: 'Guaranteed employment scheme providing 100 days of wage employment per household per year',
      eligibility: 'Rural households willing to do unskilled manual work',
      documents: ['Aadhaar Card', 'Job Card', 'Bank Account', 'Photo'],
      applyLink: 'https://nrega.nic.in/',
      detailsLink: 'https://nrega.nic.in/netnrega/home.aspx',
      benefits: 'Guaranteed 100 days employment, minimum wage payment, unemployment allowance if work not provided',
      helpline: '1800-11-3377',
    },
    {
      id: 4,
      title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      category: 'financial',
      description: 'Direct income support of ₹6,000 per year in three equal installments to small and marginal farmers',
      eligibility: 'Small and marginal farmer families who own cultivable land',
      documents: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Mobile Number'],
      applyLink: 'https://pmkisan.gov.in/',
      detailsLink: 'https://pmkisan.gov.in/',
      benefits: '₹2,000 every 4 months directly to bank account, no middlemen',
      helpline: '155261',
    },
    {
      id: 5,
      title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY) - Skill India',
      category: 'employment',
      description: 'Skill development and training programs with certification and placement assistance',
      eligibility: 'All Indian citizens above 18 years, unemployed or seeking skill upgrade',
      documents: ['Aadhaar Card', 'Educational Certificates', 'Photo', 'Bank Account'],
      applyLink: 'https://www.pmkvyofficial.org/',
      detailsLink: 'https://www.pmkvyofficial.org/',
      benefits: 'Free skill training, certification, placement assistance, monetary reward on certification',
      helpline: '1800-102-6009',
    },
    {
      id: 6,
      title: 'Pradhan Mantri Shram Yogi Maan-Dhan (PM-SYM)',
      category: 'financial',
      description: 'Pension scheme for unorganized workers providing ₹3,000 monthly pension after 60 years',
      eligibility: 'Unorganized workers between 18-40 years with monthly income up to ₹15,000',
      documents: ['Aadhaar Card', 'Savings Bank Account', 'Mobile Number'],
      applyLink: 'https://maandhan.in/',
      detailsLink: 'https://maandhan.in/',
      benefits: '₹3,000 monthly pension after 60, government contributes equal amount',
      helpline: '1800-267-6888',
    },
  ]

  const filteredSchemes = schemes.filter((scheme) => {
    const matchesSearch =
      scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const checkEligibility = (scheme) => {
    // In a real app, this would check against user data
    return Math.random() > 0.5 // Simulated
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Government Schemes"
          subtitle="Find and apply for government benefits"
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search schemes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-blue text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Schemes List */}
        <div className="space-y-4">
          {filteredSchemes.map((scheme) => {
            const isEligible = checkEligibility(scheme)
            return (
              <Card key={scheme.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">{scheme.title}</h3>
                  {isEligible ? (
                    <CheckCircle className="text-primary-green flex-shrink-0 ml-2" size={20} />
                  ) : (
                    <XCircle className="text-gray-400 flex-shrink-0 ml-2" size={20} />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Eligibility:</p>
                  <p className="text-xs text-gray-600">{scheme.eligibility}</p>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Required Documents:</p>
                  <div className="flex flex-wrap gap-2">
                    {scheme.documents.map((doc, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                {scheme.benefits && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-primary-blue mb-1">Key Benefits:</p>
                    <p className="text-xs text-gray-700">{scheme.benefits}</p>
                  </div>
                )}

                {scheme.helpline && (
                  <div className="mb-3 text-xs text-gray-600">
                    <span className="font-medium">Helpline: </span>
                    <a href={`tel:${scheme.helpline}`} className="text-primary-blue hover:underline">
                      {scheme.helpline}
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(scheme.applyLink, '_blank')}
                  >
                    Apply Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(scheme.detailsLink, '_blank')}
                  >
                    Details
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredSchemes.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">No schemes found</p>
          </Card>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}

