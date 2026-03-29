import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Small WebAudio alarm (no asset files). Browsers require user interaction
 * before audio can play — call `unlock()` from a user gesture (e.g., click).
 */
export function useAlarmSound() {
  const ctxRef = useRef(null)
  const oscRef = useRef(null)
  const gainRef = useRef(null)
  const [unlocked, setUnlocked] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const ensureContext = useCallback(async () => {
    if (ctxRef.current) return ctxRef.current
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctxRef.current = new AudioCtx()
    return ctxRef.current
  }, [])

  const unlock = useCallback(async () => {
    const ctx = await ensureContext()
    if (!ctx) return { success: false, error: 'Web Audio not supported' }

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    setUnlocked(true)
    return { success: true }
  }, [ensureContext])

  const start = useCallback(async () => {
    if (!unlocked) return

    const ctx = await ensureContext()
    if (!ctx) return
    if (ctx.state === 'suspended') await ctx.resume()

    if (oscRef.current) return

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.connect(gain)

    // Siren-ish sweep
    const t = ctx.currentTime
    osc.frequency.cancelScheduledValues(t)
    osc.frequency.setValueAtTime(660, t)
    osc.frequency.linearRampToValueAtTime(990, t + 0.35)
    osc.frequency.linearRampToValueAtTime(660, t + 0.7)

    // Gentle volume attack to avoid click
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.03)

    osc.start()

    // Keep sweeping while playing
    const interval = window.setInterval(() => {
      if (!ctxRef.current || !oscRef.current) return
      const now = ctxRef.current.currentTime
      oscRef.current.frequency.setValueAtTime(660, now)
      oscRef.current.frequency.linearRampToValueAtTime(990, now + 0.35)
      oscRef.current.frequency.linearRampToValueAtTime(660, now + 0.7)
    }, 700)

    oscRef.current = osc
    gainRef.current = { node: gain, interval }
    setIsPlaying(true)
  }, [ensureContext, unlocked])

  const stop = useCallback(async () => {
    const ctx = ctxRef.current
    const osc = oscRef.current
    const gainObj = gainRef.current
    if (!ctx || !osc || !gainObj) return

    try {
      const t = ctx.currentTime
      gainObj.node.gain.cancelScheduledValues(t)
      gainObj.node.gain.setValueAtTime(Math.max(gainObj.node.gain.value, 0.0001), t)
      gainObj.node.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      window.clearInterval(gainObj.interval)
      osc.stop(t + 0.06)
      osc.disconnect()
      gainObj.node.disconnect()
    } catch {
      // ignore stop errors
    } finally {
      oscRef.current = null
      gainRef.current = null
      setIsPlaying(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      stop()
      if (ctxRef.current) {
        ctxRef.current.close?.()
        ctxRef.current = null
      }
    }
  }, [stop])

  const api = useMemo(
    () => ({ unlocked, isPlaying, unlock, start, stop }),
    [unlocked, isPlaying, unlock, start, stop]
  )

  return api
}

