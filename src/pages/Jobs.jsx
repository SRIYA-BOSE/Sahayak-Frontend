import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { Search, MapPin, Briefcase, DollarSign, Star } from 'lucide-react'
import { api } from '../lib/api'

const fallbackJobs = [
  {
    id: 1,
    title: 'Construction Worker',
    company: 'ABC Construction Pvt. Ltd.',
    location: 'Mumbai, Maharashtra',
    salary: 'Rs 15,000 - Rs 20,000/month',
    type: 'full-time',
    skills: ['Physical labor', 'Safety awareness', 'Teamwork', 'Basic construction knowledge'],
    description:
      'Construction work with safety equipment provided. Experience in building construction, concrete work, and following safety protocols.',
    applyLink: 'https://www.ncs.gov.in/',
    detailsLink: 'https://www.ncs.gov.in/',
    experience: '0-2 years',
    contact: '+91-9876543210',
    email: 'hr@abcconstruction.com',
  },
  {
    id: 2,
    title: 'Warehouse Associate',
    company: 'XYZ Logistics Solutions',
    location: 'Delhi NCR',
    salary: 'Rs 12,000 - Rs 18,000/month',
    type: 'full-time',
    skills: ['Inventory management', 'Physical fitness', 'Attention to detail', 'Basic computer skills'],
    description:
      'Warehouse operations including receiving, storing, and shipping goods. Maintain inventory records and ensure warehouse safety standards.',
    applyLink: 'https://www.ncs.gov.in/',
    detailsLink: 'https://www.ncs.gov.in/',
    experience: '0-1 year',
    contact: '+91-9876543211',
    email: 'careers@xyzltd.com',
  },
]

export const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [matchScores, setMatchScores] = useState({})
  const [jobs, setJobs] = useState(fallbackJobs)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true)
      try {
        const result = await api.getJobs(selectedFilter, searchQuery)
        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setJobs(result.data)
        } else {
          setJobs(fallbackJobs)
        }
      } catch (error) {
        console.error('Failed to load jobs:', error)
        setJobs(fallbackJobs)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [searchQuery, selectedFilter])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || job.type === selectedFilter
    return matchesSearch && matchesFilter
  })

  const handleCheckMatch = async (job) => {
    const userSkills = ['Physical labor', 'Safety awareness', 'Teamwork']
    const result = await api.getJobSkillMatch(userSkills, job.description || '')
    if (result?.success && result.data) {
      setMatchScores((prev) => ({ ...prev, [job.id]: result.data }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Job Opportunities" subtitle="Find your next opportunity" />

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['all', 'full-time', 'part-time', 'contract'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-primary-blue text-white'
                  : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {loading && filteredJobs.length === 0 ? (
          <Card className="p-6 text-center text-gray-600">Loading jobs...</Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const matchScore = matchScores[job.id]
              return (
                <Card key={job.id} className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.company}</p>
                    </div>
                    {matchScore ? (
                      <div className="ml-2 text-right">
                        <div className="flex items-center gap-1">
                          <Star className="text-yellow-500" size={16} />
                          <span className="text-sm font-semibold">{matchScore.matchScore}%</span>
                        </div>
                        <p className="text-xs text-gray-500">Match</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {job.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{job.location}</span>
                      </div>
                    ) : null}
                    {job.salary ? (
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>{job.salary}</span>
                      </div>
                    ) : null}
                    {job.type ? (
                      <div className="flex items-center gap-1">
                        <Briefcase size={16} />
                        <span className="capitalize">{job.type.replace('-', ' ')}</span>
                      </div>
                    ) : null}
                  </div>

                  <p className="mb-3 text-sm text-gray-700">{job.description}</p>

                  {Array.isArray(job.skills) && job.skills.length > 0 ? (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-medium text-gray-700">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, idx) => (
                          <span key={idx} className="rounded bg-blue-50 px-2 py-1 text-xs text-primary-blue">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {matchScore?.missingSkills?.length > 0 ? (
                    <div className="mb-3 rounded bg-yellow-50 p-2">
                      <p className="mb-1 text-xs font-medium text-gray-700">To improve match:</p>
                      <ul className="text-xs text-gray-600">
                        {matchScore.missingSkills.slice(0, 2).map((skill, idx) => (
                          <li key={idx}>- {skill}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(job.applyLink || 'https://www.ncs.gov.in/', '_blank')}
                    >
                      Apply
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCheckMatch(job)}>
                      Check Match
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(job.detailsLink || job.applyLink || 'https://www.ncs.gov.in/', '_blank')}
                    >
                      Details
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {filteredJobs.length === 0 && !loading ? (
          <Card className="p-8 text-center">
            <Briefcase className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">No jobs found</p>
          </Card>
        ) : null}
      </div>
      <BottomNavigation />
    </div>
  )
}
