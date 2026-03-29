import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Heart } from 'lucide-react'

export const Login = () => {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        if (!signIn || typeof signIn !== 'function') {
          throw new Error('Sign in function is not available')
        }
        const result = await signIn(email, password)
        if (result?.error) {
          throw new Error(result.error.message || result.error)
        }
        navigate('/')
      } else {
        if (!signUp || typeof signUp !== 'function') {
          throw new Error('Sign up function is not available')
        }
        const result = await signUp(email, password, { name })
        if (result?.error) {
          throw new Error(result.error.message || result.error)
        }
        navigate('/')
      }
    } catch (err) {
      setError(err?.message || 'An error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-blue to-blue-600 flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-lg p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-blue rounded-full mb-4">
            <Heart className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SAHAYAK</h1>
          <p className="text-gray-600">Your Health & Safety Companion</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                placeholder="Enter your name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              placeholder="Enter your password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError(null)
            }}
            className="text-primary-blue font-medium hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Login'}
          </button>
        </div>
      </Card>
    </div>
  )
}

