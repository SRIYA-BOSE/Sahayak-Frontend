import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export const useWeather = (latitude, longitude) => {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!latitude || !longitude) {
      // Use dummy data if location not available
      setWeather(getDummyWeather())
      setForecast(getDummyForecast())
      setLoading(false)
      return
    }

    fetchWeather()
    fetchForecast()
  }, [latitude, longitude])

  const fetchWeather = async (lat = latitude, lon = longitude) => {
    if (!lat || !lon) {
      setWeather(getDummyWeather())
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await api.getWeather(lat, lon)
      
      if (result.success && result.data) {
        setWeather(result.data)
        setError(null)
      } else {
        // Fallback to dummy data
        setWeather(getDummyWeather())
        setError(null)
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
      // Use dummy data on error
      setWeather(getDummyWeather())
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchForecast = async (lat = latitude, lon = longitude) => {
    if (!lat || !lon) {
      setForecast(getDummyForecast())
      return
    }

    try {
      const result = await api.getWeatherForecast(lat, lon)
      
      if (result.success && result.data) {
        setForecast(result.data)
      } else {
        setForecast(getDummyForecast())
      }
    } catch (err) {
      console.error('Forecast fetch error:', err)
      setForecast(getDummyForecast())
    }
  }

  // Dummy weather data for when API is unavailable
  const getDummyWeather = () => {
    return {
      name: 'Your Location',
      main: {
        temp: 28,
        feels_like: 30,
        humidity: 65,
        pressure: 1013
      },
      weather: [{
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }],
      wind: {
        speed: 3.5
      },
      coord: {
        lat: latitude || 20.2961,
        lon: longitude || 85.8245
      }
    }
  }

  const getDummyForecast = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push({
        dt_txt: date.toISOString(),
        main: {
          temp_max: 28 + Math.floor(Math.random() * 5),
          temp_min: 22 + Math.floor(Math.random() * 3)
        },
        weather: [{
          main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
          description: ['clear sky', 'few clouds', 'light rain'][Math.floor(Math.random() * 3)]
        }]
      })
    }
    return { list: days }
  }

  const getHeatIndex = () => {
    if (!weather) return null
    
    const temp = weather.main.temp
    const humidity = weather.main.humidity
    
    // Heat Index calculation (simplified)
    const hi = 0.5 * (temp + 61.0 + ((temp - 68.0) * 1.2) + (humidity * 0.094))
    
    return {
      value: Math.round(hi),
      risk: hi > 40 ? 'high' : hi > 32 ? 'medium' : 'low',
    }
  }

  const getWorkSafetyRecommendations = () => {
    if (!weather) return []
    
    const temp = weather.main.temp
    const conditions = weather.weather[0].main.toLowerCase()
    const recommendations = []

    if (temp > 35) {
      recommendations.push('Take frequent breaks in shade')
      recommendations.push('Stay hydrated - drink water every 15-20 minutes')
      recommendations.push('Wear light-colored, loose-fitting clothing')
    } else if (temp < 10) {
      recommendations.push('Wear warm, layered clothing')
      recommendations.push('Take breaks in warm areas')
      recommendations.push('Watch for signs of hypothermia')
    }

    if (conditions.includes('rain')) {
      recommendations.push('Wear non-slip footwear')
      recommendations.push('Be cautious on wet surfaces')
    }

    if (conditions.includes('wind')) {
      recommendations.push('Secure loose objects')
      recommendations.push('Be cautious of falling debris')
    }

    return recommendations
  }

  const refresh = async () => {
    // Refresh with current location
    await Promise.all([fetchWeather(), fetchForecast()])
  }

  return {
    weather,
    forecast,
    loading,
    error,
    refresh,
    heatIndex: getHeatIndex(),
    workSafetyRecommendations: getWorkSafetyRecommendations(),
  }
}

