import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BottomNavigation } from '../components/BottomNavigation'
import { Search, Filter, MapPin, Briefcase, DollarSign, Star } from 'lucide-react'
import { getJobSkillMatch } from '../lib/openai'

export const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [matchScores, setMatchScores] = useState({})

  const jobs = [
    {
      id: 1,
      title: 'Construction Worker',
      company: 'ABC Construction Pvt. Ltd.',
      location: 'Mumbai, Maharashtra',
      salary: '₹15,000 - ₹20,000/month',
      type: 'full-time',
      skills: ['Physical labor', 'Safety awareness', 'Teamwork', 'Basic construction knowledge'],
      description: 'Construction work with safety equipment provided. Experience in building construction, concrete work, and following safety protocols. Must be physically fit and able to work in outdoor conditions.',
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
      salary: '₹12,000 - ₹18,000/month',
      type: 'full-time',
      skills: ['Inventory management', 'Physical fitness', 'Attention to detail', 'Basic computer skills'],
      description: 'Warehouse operations including receiving, storing, and shipping goods. Maintain inventory records, operate material handling equipment, and ensure warehouse safety standards.',
      applyLink: 'https://www.ncs.gov.in/',
      detailsLink: 'https://www.ncs.gov.in/',
      experience: '0-1 year',
      contact: '+91-9876543211',
      email: 'careers@xyzltd.com',
    },
    {
      id: 3,
      title: 'Security Guard',
      company: 'Secure Services India',
      location: 'Bangalore, Karnataka',
      salary: '₹10,000 - ₹15,000/month',
      type: 'full-time',
      skills: ['Vigilance', 'Communication', 'Physical fitness', 'Basic security training'],
      description: 'Security services for commercial buildings. Monitor premises, check visitors, maintain security logs, and respond to emergencies. Shift work including nights and weekends.',
      applyLink: 'https://www.ncs.gov.in/',
      detailsLink: 'https://www.ncs.gov.in/',
      experience: '0-3 years',
      contact: '+91-9876543212',
      email: 'jobs@secureservices.in',
    },
    {
      id: 4,
      title: 'Delivery Driver',
      company: 'Quick Delivery Express',
      location: 'Pune, Maharashtra',
      salary: '₹18,000 - ₹25,000/month',
      type: 'full-time',
      skills: ['Valid Driving License', 'Navigation', 'Customer service', 'Time management'],
      description: 'Package delivery with company vehicle. Pick up and deliver packages on time, maintain delivery records, interact with customers professionally, and ensure vehicle maintenance.',
      applyLink: 'https://www.ncs.gov.in/',
      detailsLink: 'https://www.ncs.gov.in/',
      experience: '1-3 years',
      contact: '+91-9876543213',
      email: 'apply@quickdelivery.com',
    },
    {
      id: 5,
      title: 'Factory Worker',
      company: 'Modern Manufacturing Co.',
      location: 'Chennai, Tamil Nadu',
      salary: '₹14,000 - ₹19,000/month',
      type: 'full-time',
      skills: ['Assembly work', 'Quality control', 'Machine operation', 'Safety protocols'],
      description: 'Factory production work including assembly, quality checking, and machine operation. Follow production schedules, maintain quality standards, and adhere to safety guidelines.',
      applyLink: 'https://www.ncs.gov.in/',
      detailsLink: 'https://www.ncs.gov.in/',
      experience: '0-2 years',
      contact: '+91-9876543214',
      email: 'hr@modernmfg.com',
    },
    {
      id: 6,
      title: 'Housekeeping Staff',
      company: 'Clean Services Pvt. Ltd.',
      location: 'Hyderabad, Telangana',
      salary: '₹9,000 - ₹13,000/month',
      type: 'full-time',
      skills: ['Cleaning', 'Organization', 'Attention to detail', 'Physical stamina'],
      description: 'Housekeeping and maintenance services for commercial buildings. Cleaning, organizing, and maintaining cleanliness standards. Flexible working hours available.',
      applyLink: 'https://www.ncs.gov.in/',
      detailsLink: 'https://www.ncs.gov.in/',
      experience: '0-1 year',
      contact: '+91-9876543215',
      email: 'jobs@cleanservices.in',
    },
  ]

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || job.type === selectedFilter
    return matchesSearch && matchesFilter
  })

  const handleCheckMatch = async (job) => {
    // In a real app, this would use actual user skills
    const userSkills = ['Physical labor', 'Safety awareness', 'Teamwork']
    const result = await getJobSkillMatch(userSkills, job.description)
    setMatchScores((prev) => ({ ...prev, [job.id]: result }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Job Opportunities" subtitle="Find your next opportunity" />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'full-time', 'part-time', 'contract'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFilter === filter
                  ? 'bg-primary-blue text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const matchScore = matchScores[job.id]
            return (
              <Card key={job.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                  </div>
                  {matchScore && (
                    <div className="ml-2 text-right">
                      <div className="flex items-center gap-1">
                        <Star className="text-yellow-500" size={16} />
                        <span className="text-sm font-semibold">{matchScore.matchScore}%</span>
                      </div>
                      <p className="text-xs text-gray-500">Match</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={16} />
                    <span className="capitalize">{job.type.replace('-', ' ')}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{job.description}</p>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-xs text-primary-blue rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {job.experience && (
                  <div className="mb-3 text-xs text-gray-600">
                    <span className="font-medium">Experience Required: </span>
                    <span>{job.experience}</span>
                  </div>
                )}

                {(job.contact || job.email) && (
                  <div className="mb-3 p-2 bg-green-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Contact Information:</p>
                    {job.contact && (
                      <p className="text-xs text-gray-600">
                        Phone: <a href={`tel:${job.contact}`} className="text-primary-blue hover:underline">{job.contact}</a>
                      </p>
                    )}
                    {job.email && (
                      <p className="text-xs text-gray-600">
                        Email: <a href={`mailto:${job.email}`} className="text-primary-blue hover:underline">{job.email}</a>
                      </p>
                    )}
                  </div>
                )}

                {matchScore && matchScore.missingSkills && matchScore.missingSkills.length > 0 && (
                  <div className="mb-3 p-2 bg-yellow-50 rounded">
                    <p className="text-xs font-medium text-gray-700 mb-1">To improve match:</p>
                    <ul className="text-xs text-gray-600">
                      {matchScore.missingSkills.slice(0, 2).map((skill, idx) => (
                        <li key={idx}>• {skill}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.open(job.applyLink, '_blank')}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckMatch(job)}
                  >
                    Check Match
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(job.detailsLink, '_blank')}
                  >
                    Details
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredJobs.length === 0 && (
          <Card className="p-8 text-center">
            <Briefcase className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-600">No jobs found</p>
          </Card>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}

