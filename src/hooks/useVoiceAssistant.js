import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

// Language code mapping for speech recognition and synthesis
const LANGUAGE_CODES = {
  en: 'en-US',
  hi: 'hi-IN',
  or: 'or-IN',
  bn: 'bn-IN',
  te: 'te-IN',
}

export const useVoiceAssistant = () => {
  const { language } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)
  const keepListeningRef = useRef(false)
  const speakingRef = useRef(false)
  const restartingRef = useRef(false)
  const transcriptTimerRef = useRef(null)

  const getBrowserLocale = () => {
    if (typeof navigator === 'undefined') return 'en-US'
    return navigator.languages?.[0] || navigator.language || 'en-US'
  }

  const resolveLocale = (preferredLanguage, sampleText = '') => {
    const normalized = String(preferredLanguage || '').trim()
    if (LANGUAGE_CODES[normalized]) return LANGUAGE_CODES[normalized]
    if (/^[a-z]{2,3}-[A-Z]{2}$/i.test(normalized)) return normalized
    if (/^[a-z]{2,3}$/i.test(normalized)) {
      return normalized === 'en' ? 'en-US' : `${normalized}-${normalized.toUpperCase()}`
    }

    if (/[\u0900-\u097F]/.test(sampleText)) return 'hi-IN'
    if (/[\u0B00-\u0B7F]/.test(sampleText)) return 'or-IN'
    if (/[\u0980-\u09FF]/.test(sampleText)) return 'bn-IN'
    if (/[\u0C00-\u0C7F]/.test(sampleText)) return 'te-IN'

    return getBrowserLocale()
  }

  const resolveApiLanguage = (preferredLanguage, sampleText = '') => {
    const locale = resolveLocale(preferredLanguage, sampleText)
    return locale || 'en-US'
  }

  const isBackendFailureReply = (text = '') => {
    const value = String(text || '').toLowerCase()
    return (
      value.includes('i ran into an issue') ||
      value.includes('assistant is currently unavailable') ||
      value.includes('voice assistant is unavailable') ||
      value.includes('please try again later') ||
      value.includes('please try again in a moment')
    )
  }

  const getLanguageFamily = (preferredLanguage, sampleText = '') => {
    return resolveLocale(preferredLanguage, sampleText).split('-')[0].toLowerCase()
  }

  const getDynamicLocalResponse = (question, preferredLanguage = language) => {
    const lowerQuestion = String(question || '').toLowerCase()
    const family = getLanguageFamily(preferredLanguage, question)

    const packs = {
      en: {
        intro: 'I am in offline multilingual assistant mode.',
        safety: 'For safety, wear your helmet, gloves, shoes, and reflective gear, and report hazards immediately.',
        health: 'If you feel unwell, stop work, sit in a safe place, drink water, and contact your supervisor or medical help.',
        emergency: 'For an emergency, call 108 immediately, alert nearby people, and move to a safe area if possible.',
        weather: 'Check heat, rain, and wind conditions before work, and take extra water and shade breaks in hot weather.',
        vitals: 'For heart rate and SpO2 checks, keep your finger steady on the sensor for a few seconds without movement.',
        default: 'Ask me about safety, health, emergency help, weather, work guidance, or sensor usage and I will help.'
      },
      hi: {
        intro: 'मैं अभी ऑफलाइन बहुभाषी सहायक मोड में काम कर रहा हूँ।',
        safety: 'सुरक्षा के लिए हेलमेट, दस्ताने, जूते और रिफ्लेक्टिव जैकेट पहनें और किसी भी खतरे की तुरंत सूचना दें।',
        health: 'अगर तबीयत खराब लगे तो काम रोकें, सुरक्षित जगह बैठें, पानी पिएँ और सुपरवाइजर या डॉक्टर से संपर्क करें।',
        emergency: 'आपातकाल में तुरंत 108 पर कॉल करें, आसपास के लोगों को सतर्क करें और संभव हो तो सुरक्षित जगह जाएँ।',
        weather: 'काम से पहले गर्मी, बारिश और हवा की स्थिति देखें और गर्म मौसम में पानी और आराम का ध्यान रखें।',
        vitals: 'हार्ट रेट और SpO2 के लिए उंगली को कुछ सेकंड तक सेंसर पर बिना हिलाए स्थिर रखें।',
        default: 'आप मुझसे सुरक्षा, स्वास्थ्य, आपातकाल, मौसम, काम से जुड़ी मदद या सेंसर के उपयोग के बारे में पूछ सकते हैं।'
      },
      bn: {
        intro: 'আমি এখন অফলাইন বহুভাষিক সহকারী মোডে আছি।',
        safety: 'নিরাপত্তার জন্য হেলমেট, গ্লাভস, জুতো ও রিফ্লেক্টিভ জ্যাকেট পরুন এবং ঝুঁকি সঙ্গে সঙ্গে জানিয়ে দিন।',
        health: 'অসুস্থ লাগলে কাজ বন্ধ করুন, নিরাপদ জায়গায় বসুন, পানি পান করুন এবং সুপারভাইজার বা ডাক্তারকে জানান।',
        emergency: 'জরুরি অবস্থায় দ্রুত 108 নম্বরে কল করুন, আশেপাশের মানুষকে সতর্ক করুন এবং সম্ভব হলে নিরাপদ স্থানে যান।',
        weather: 'কাজের আগে গরম, বৃষ্টি ও বাতাসের অবস্থা দেখে নিন এবং গরমে বেশি পানি ও বিশ্রাম নিন।',
        vitals: 'হার্ট রেট ও SpO2 মাপার সময় কয়েক সেকেন্ড আঙুলটি সেন্সরের উপর স্থির রাখুন।',
        default: 'নিরাপত্তা, স্বাস্থ্য, জরুরি সহায়তা, আবহাওয়া, কাজের নির্দেশনা বা সেন্সর ব্যবহারের বিষয়ে জিজ্ঞাসা করুন।'
      },
      te: {
        intro: 'నేను ఇప్పుడు ఆఫ్లైన్ బహుభాషా సహాయక మోడ్‌లో ఉన్నాను.',
        safety: 'భద్రత కోసం హెల్మెట్, గ్లవ్స్, షూలు, రిఫ్లెక్టివ్ జాకెట్ ధరించండి మరియు ప్రమాదాలను వెంటనే తెలియజేయండి.',
        health: 'అనారోగ్యంగా అనిపిస్తే పని ఆపి, సురక్షిత ప్రదేశంలో కూర్చోని, నీరు తాగి, సూపర్వైజర్ లేదా డాక్టర్‌ను సంప్రదించండి.',
        emergency: 'అత్యవసర పరిస్థితిలో వెంటనే 108కు కాల్ చేసి, చుట్టుపక్కల వారికి తెలియజేసి, సాధ్యమైతే సురక్షిత ప్రదేశానికి వెళ్లండి.',
        weather: 'పని ముందు వేడి, వర్షం, గాలి పరిస్థితులు చూసి, ఎండలో ఎక్కువ నీరు మరియు విరామాలు తీసుకోండి.',
        vitals: 'హార్ట్ రేట్ మరియు SpO2 కొలవడానికి వేళ్లను కొన్ని సెకన్లు కదలకుండా సెన్సర్‌పై ఉంచండి.',
        default: 'భద్రత, ఆరోగ్యం, అత్యవసర సహాయం, వాతావరణం, పని మార్గదర్శనం లేదా సెన్సర్ వాడకం గురించి అడగండి.'
      },
      or: {
        intro: 'ମୁଁ ବର୍ତ୍ତମାନ ଅଫ୍ଲାଇନ ବହୁଭାଷୀ ସହାୟକ ମୋଡ୍‌ରେ କାମ କରୁଛି।',
        safety: 'ସୁରକ୍ଷା ପାଇଁ ହେଲମେଟ୍, ହାତମୋଜା, ଜୁତା ଓ ରିଫ୍ଲେକ୍ଟିଭ୍ ଜାକେଟ୍ ପିନ୍ଧନ୍ତୁ ଏବଂ ବିପଦ ଦେଖିଲେ ସତେଜ ଜଣାନ୍ତୁ।',
        health: 'ଅସୁସ୍ଥ ଲାଗିଲେ କାମ ବନ୍ଦ କରନ୍ତୁ, ସୁରକ୍ଷିତ ସ୍ଥାନରେ ବସନ୍ତୁ, ପାଣି ପିଅନ୍ତୁ ଏବଂ ସୁପରଭାଇଜର କିମ୍ବା ଡାକ୍ତରଙ୍କୁ ଜଣାନ୍ତୁ।',
        emergency: 'ଜରୁରୀ ସ୍ଥିତିରେ ତୁରନ୍ତ 108 କୁ କଲ୍ କରନ୍ତୁ, ନିକଟସ୍ଥ ଲୋକଙ୍କୁ ସତର୍କ କରନ୍ତୁ ଏବଂ ସମ୍ଭବ ହେଲେ ସୁରକ୍ଷିତ ସ୍ଥାନକୁ ଯାଆନ୍ତୁ।',
        weather: 'କାମ ପୂର୍ବରୁ ଗରମ, ବର୍ଷା ଓ ପବନ ସ୍ଥିତି ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ଗରମ ଦିନରେ ଅଧିକ ପାଣି ଓ ବିଶ୍ରାମ ନିଅନ୍ତୁ।',
        vitals: 'ହାର୍ଟ ରେଟ୍ ଓ SpO2 ପାଇଁ ଆଙ୍ଗୁଠିକୁ କିଛି ସେକେଣ୍ଡ ଧରି ସେନ୍ସର ଉପରେ ଶାନ୍ତ ଭାବେ ରଖନ୍ତୁ।',
        default: 'ସୁରକ୍ଷା, ସ୍ୱାସ୍ଥ୍ୟ, ଜରୁରୀ ସହାୟତା, ପାଣିପାଗ, କାମ ସୁଚନା କିମ୍ବା ସେନ୍ସର ବ୍ୟବହାର ବିଷୟରେ ପଚାରନ୍ତୁ।'
      },
      es: {
        intro: 'Estoy funcionando en modo asistente multilingue sin conexion.',
        safety: 'Para seguridad, usa casco, guantes, botas y chaleco reflectante, y reporta cualquier riesgo de inmediato.',
        health: 'Si te sientes mal, detén el trabajo, siéntate en un lugar seguro, bebe agua y avisa al supervisor o al médico.',
        emergency: 'En una emergencia, llama de inmediato, avisa a las personas cercanas y muévete a una zona segura si puedes.',
        weather: 'Revisa calor, lluvia y viento antes del trabajo y toma más agua y descansos cuando haga mucho calor.',
        vitals: 'Para medir frecuencia cardiaca y SpO2, mantén el dedo quieto sobre el sensor durante unos segundos.',
        default: 'Puedo ayudarte con seguridad, salud, emergencias, clima, trabajo o uso de sensores.'
      },
      ar: {
        intro: 'انا الان اعمل في وضع المساعد متعدد اللغات بدون اتصال.',
        safety: 'من اجل السلامة ارتد الخوذة والقفازات والحذاء الواقي والسترة العاكسة وابلغ عن اي خطر فورا.',
        health: 'اذا شعرت بتعب اوقف العمل واجلس في مكان آمن واشرب الماء وابلغ المشرف او اطلب المساعدة الطبية.',
        emergency: 'في الطوارئ اطلب المساعدة فورا ونبه من حولك وانتقل الى مكان آمن اذا كان ذلك ممكنا.',
        weather: 'افحص الحرارة والمطر والرياح قبل العمل وخذ ماء واستراحات اكثر في الجو الحار.',
        vitals: 'لقياس نبض القلب وSpO2 ضع اصبعك بثبات على الحساس لعدة ثوان دون حركة.',
        default: 'يمكنني مساعدتك في السلامة والصحة والطوارئ والطقس والعمل واستخدام الحساسات.'
      }
    }

    const pack = packs[family] || packs.en
    let body = pack.default

    if (/safety|helmet|ppe|danger|hazard|safe/.test(lowerQuestion)) body = pack.safety
    else if (/health|unwell|sick|dizzy|pain|doctor/.test(lowerQuestion)) body = pack.health
    else if (/emergency|help|accident|ambulance|panic/.test(lowerQuestion)) body = pack.emergency
    else if (/weather|rain|heat|temperature|wind/.test(lowerQuestion)) body = pack.weather
    else if (/heart|spo2|oxygen|sensor|pulse|ir\b/.test(lowerQuestion)) body = pack.vitals

    return `${pack.intro} ${body}`
  }

  const finalizeTranscript = async (transcriptText) => {
    if (!transcriptText) return

    keepListeningRef.current = false
    setIsListening(false)
    setTranscript(transcriptText)

    const replyLanguage = resolveApiLanguage(language, transcriptText)

    try {
      setError(null)
      const result = await api.getVoiceAssistantResponse(transcriptText, replyLanguage)
      if (result.success && result.data?.response) {
        const assistantText = isBackendFailureReply(result.data.response)
          ? getDynamicLocalResponse(transcriptText, replyLanguage)
          : result.data.response
        setResponse(assistantText)
        speak(assistantText, resolveLocale(replyLanguage, assistantText))
      } else {
        const fallbackResponse = getDynamicLocalResponse(transcriptText, replyLanguage)
        setResponse(fallbackResponse)
        speak(fallbackResponse, resolveLocale(replyLanguage, fallbackResponse))
      }
    } catch (err) {
      console.error('Voice assistant error:', err)
      const errorMessage = err.message || err.toString() || ''
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        setTimeout(async () => {
          try {
            const retryResult = await api.getVoiceAssistantResponse(transcriptText, replyLanguage)
            if (retryResult.success && retryResult.data?.response) {
              const assistantText = isBackendFailureReply(retryResult.data.response)
                ? getDynamicLocalResponse(transcriptText, replyLanguage)
                : retryResult.data.response
              setResponse(assistantText)
              speak(assistantText, resolveLocale(replyLanguage, assistantText))
              return
            }
          } catch (retryErr) {
            console.error('Voice assistant retry error:', retryErr)
          }

          const fallbackResponse = getDynamicLocalResponse(transcriptText, replyLanguage)
          setResponse(fallbackResponse)
          speak(fallbackResponse, resolveLocale(replyLanguage, fallbackResponse))
        }, 1000)
      } else {
        const fallbackResponse = getDynamicLocalResponse(transcriptText, replyLanguage)
        setResponse(fallbackResponse)
        speak(fallbackResponse, resolveLocale(replyLanguage, fallbackResponse))
      }
    }
  }

  useEffect(() => {
    // Initialize Speech Recognition with enhanced settings
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      // Enhanced settings for better detection
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = resolveLocale(language)
      recognitionRef.current.maxAlternatives = 3 // Get multiple alternatives for better accuracy

      recognitionRef.current.onresult = async (event) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const alternatives = Array.from(event.results[i])
          const bestAlternative = alternatives.sort((a, b) => b.confidence - a.confidence)[0]
          const transcript = bestAlternative?.transcript || event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Show interim results for better user feedback
        if (interimTranscript) {
          setTranscript(finalTranscript + interimTranscript)
        } else if (finalTranscript) {
          setTranscript(finalTranscript.trim())
        }

        // Process final result when we have it
        if (finalTranscript.trim()) {
          if (transcriptTimerRef.current) {
            clearTimeout(transcriptTimerRef.current)
          }

          transcriptTimerRef.current = setTimeout(() => {
            finalizeTranscript(finalTranscript.trim())
          }, interimTranscript ? 450 : 0)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.')
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please check your microphone settings.')
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.')
        } else {
          setError(`Speech recognition error: ${event.error}`)
        }
        
        setIsListening(false)
        keepListeningRef.current = false
      }

      recognitionRef.current.onend = () => {
        if (keepListeningRef.current && !speakingRef.current && !restartingRef.current) {
          restartingRef.current = true
          setTimeout(() => {
            try {
              recognitionRef.current.lang = resolveLocale(language, transcript)
              recognitionRef.current.start()
              setIsListening(true)
            } catch (restartError) {
              console.error('Voice recognition restart error:', restartError)
              setIsListening(false)
              keepListeningRef.current = false
            } finally {
              restartingRef.current = false
            }
          }, 250)
          return
        }
        setIsListening(false)
      }

      recognitionRef.current.onstart = () => {
        setError(null)
        setTranscript('')
        setResponse('')
        setIsListening(true)
      }
    } else {
      setError('Speech recognition not supported in your browser')
    }

    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    } else {
      setError('Speech synthesis not supported')
    }

    // Update recognition language when language changes
    if (recognitionRef.current) {
      recognitionRef.current.lang = resolveLocale(language)
    }

    return () => {
      if (transcriptTimerRef.current) {
        clearTimeout(transcriptTimerRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel()
      }
    }
  }, [language])

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available')
      return
    }

    try {
      setError(null)
      setTranscript('')
      setResponse('')
      // Update language before starting
      recognitionRef.current.lang = resolveLocale(language)
      keepListeningRef.current = true
      setIsListening(true)
      
      // Request microphone permission explicitly
      const mediaDevices = navigator.mediaDevices
      if (!mediaDevices?.getUserMedia) {
        recognitionRef.current.start()
        return
      }

      mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current.start()
        })
        .catch((err) => {
          console.error('Microphone permission error:', err)
          setError('Microphone permission is required for voice assistant')
          setIsListening(false)
          keepListeningRef.current = false
        })
    } catch (err) {
      // If getUserMedia is not available, try direct start
      if (err.name === 'TypeError') {
        try {
          recognitionRef.current.start()
        } catch (startErr) {
          setError(startErr.message || 'Failed to start voice recognition')
          setIsListening(false)
          keepListeningRef.current = false
        }
      } else {
        setError(err.message || 'Failed to start voice recognition')
        setIsListening(false)
        keepListeningRef.current = false
      }
    }
  }

  const stopListening = () => {
    keepListeningRef.current = false
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current.abort() // Ensure it's fully stopped
      } catch (err) {
        console.log('Stop listening error:', err)
      }
      setIsListening(false)
    }
  }

  const speak = (text, lang = resolveLocale(language, text)) => {
    if (!synthesisRef.current) {
      setError('Speech synthesis not available')
      return
    }

    synthesisRef.current.cancel() // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1

    // Enhanced voice selection for better quality
    const voices = synthesisRef.current.getVoices()
    const baseLanguage = lang.split('-')[0].toLowerCase()
    const preferredVoice = voices
      .filter((voice) => voice.lang.toLowerCase().startsWith(baseLanguage))
      .sort((a, b) => {
        const score = (voice) => {
          let value = 0
          if (voice.lang.toLowerCase() === lang.toLowerCase()) value += 4
          if (/google|microsoft|natural|enhanced|india/i.test(voice.name)) value += 2
          if (voice.default) value += 1
          return value
        }
        return score(b) - score(a)
      })[0]
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      speakingRef.current = true
      setIsSpeaking(true)
    }
    utterance.onend = () => {
      speakingRef.current = false
      setIsSpeaking(false)
    }
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setError(`Speech error: ${event.error}`)
      speakingRef.current = false
      setIsSpeaking(false)
    }

    // Wait for voices to load if needed
    if (voices.length === 0) {
      synthesisRef.current.onvoiceschanged = () => {
        const updatedVoices = synthesisRef.current.getVoices()
        const voice = updatedVoices.find(v => v.lang.startsWith(lang.split('-')[0]))
        if (voice) utterance.voice = voice
        synthesisRef.current.speak(utterance)
      }
    } else {
      synthesisRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      speakingRef.current = false
      setIsSpeaking(false)
    }
  }

  const changeLanguage = (lang) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = resolveLocale(lang)
    }
  }

  // Fallback responses when API is unavailable
  const getFallbackResponse = (question, lang = 'en') => {
    const lowerQuestion = question.toLowerCase()
    
    const responses = {
      en: {
        safety: 'For workplace safety, always wear proper protective equipment, follow safety protocols, and report any hazards immediately. Take regular breaks and stay hydrated.',
        health: 'If you feel unwell at work, inform your supervisor immediately, take a break, stay hydrated, and seek medical attention if symptoms persist. Monitor your vital signs regularly.',
        emergency: 'In an emergency, use the panic button in the app, call emergency services at 108, and share your location with trusted contacts. Stay calm and follow emergency procedures.',
        weather: 'Check the weather section in the app for current conditions and safety recommendations. Stay hydrated in hot weather and dress appropriately for the conditions.',
        rights: 'You have the right to fair wages, safe working conditions, and proper breaks. Check the Education section for more information about workers rights and government schemes.',
        default: 'I understand your question. For detailed information, please check the relevant section in the app - Safety Guidelines, Health Monitoring, Education, or Emergency contacts. How can I help you further?'
      },
      hi: {
        safety: 'कार्यस्थल सुरक्षा के लिए, हमेशा उचित सुरक्षात्मक उपकरण पहनें, सुरक्षा प्रोटोकॉल का पालन करें, और किसी भी खतरे की तुरंत रिपोर्ट करें। नियमित ब्रेक लें और हाइड्रेटेड रहें।',
        health: 'यदि आप काम पर अस्वस्थ महसूस करते हैं, तो तुरंत अपने पर्यवेक्षक को सूचित करें, ब्रेक लें, हाइड्रेटेड रहें, और यदि लक्षण बने रहें तो चिकित्सा सहायता लें। अपने महत्वपूर्ण संकेतों की नियमित रूप से निगरानी करें।',
        emergency: 'आपातकाल में, ऐप में पैनिक बटन का उपयोग करें, 108 पर आपातकालीन सेवाओं को कॉल करें, और विश्वसनीय संपर्कों के साथ अपना स्थान साझा करें। शांत रहें और आपातकालीन प्रक्रियाओं का पालन करें।',
        weather: 'वर्तमान स्थितियों और सुरक्षा सिफारिशों के लिए ऐप के मौसम अनुभाग की जांच करें। गर्म मौसम में हाइड्रेटेड रहें और स्थितियों के अनुसार उचित कपड़े पहनें।',
        rights: 'आपको उचित मजदूरी, सुरक्षित कार्य स्थितियों और उचित ब्रेक का अधिकार है। श्रमिक अधिकारों और सरकारी योजनाओं के बारे में अधिक जानकारी के लिए शिक्षा अनुभाग देखें।',
        default: 'मैं आपके प्रश्न को समझता हूं। विस्तृत जानकारी के लिए, कृपया ऐप में प्रासंगिक अनुभाग देखें - सुरक्षा दिशानिर्देश, स्वास्थ्य निगरानी, शिक्षा, या आपातकालीन संपर्क। मैं आपकी और कैसे मदद कर सकता हूं?'
      },
      or: {
        safety: 'କାର୍ଯ୍ୟସ୍ଥଳ ସୁରକ୍ଷା ପାଇଁ, ସର୍ବଦା ଉଚିତ ସୁରକ୍ଷା ଉପକରଣ ପିନ୍ଧନ୍ତୁ, ସୁରକ୍ଷା ପ୍ରୋଟୋକଲ୍ ଅନୁସରଣ କରନ୍ତୁ, ଏବଂ ଯେକୌଣସି ବିପଦକୁ ତୁରନ୍ତ ରିପୋର୍ଟ କରନ୍ତୁ। ନିୟମିତ ବିଶ୍ରାମ ନିଅନ୍ତୁ ଏବଂ ହାଇଡ୍ରେଟେଡ୍ ରହନ୍ତୁ।',
        health: 'ଯଦି ଆପଣ କାମରେ ଅସୁସ୍ଥ ଅନୁଭବ କରନ୍ତି, ତୁରନ୍ତ ଆପଣଙ୍କର ପର୍ଯ୍ୟବେକ୍ଷକକୁ ସୂଚନା ଦିଅନ୍ତୁ, ବିଶ୍ରାମ ନିଅନ୍ତୁ, ହାଇଡ୍ରେଟେଡ୍ ରହନ୍ତୁ, ଏବଂ ଯଦି ଲକ୍ଷଣଗୁଡ଼ିକ ବଜାୟ ରହେ ତେବେ ଚିକିତ୍ସା ସାହାଯ୍ୟ ନିଅନ୍ତୁ। ଆପଣଙ୍କର ମୁଖ୍ୟ ସଙ୍କେତଗୁଡ଼ିକର ନିୟମିତ ମନିଟରିଂ କରନ୍ତୁ।',
        emergency: 'ଜରୁରୀକାଳୀନ ସ୍ଥିତିରେ, ଆପ୍ ରେ ପ୍ୟାନିକ୍ ବଟନ୍ ବ୍ୟବହାର କରନ୍ତୁ, 108 ରେ ଜରୁରୀକାଳୀନ ସେବାକୁ କଲ୍ କରନ୍ତୁ, ଏବଂ ବିଶ୍ୱସନୀୟ ସମ୍ପର୍କଗୁଡ଼ିକ ସହିତ ଆପଣଙ୍କର ସ୍ଥାନ ଅଂଶୀଦାର କରନ୍ତୁ। ଶାନ୍ତ ରହନ୍ତୁ ଏବଂ ଜରୁରୀକାଳୀନ ପ୍ରକ୍ରିୟା ଅନୁସରଣ କରନ୍ତୁ।',
        weather: 'ବର୍ତ୍ତମାନ ସ୍ଥିତି ଏବଂ ସୁରକ୍ଷା ସୁପାରିଶ ପାଇଁ ଆପ୍ ରେ ଆବହା ବିଭାଗ ଯାଞ୍ଚ କରନ୍ତୁ। ଗରମ ଆବହାରେ ହାଇଡ୍ରେଟେଡ୍ ରହନ୍ତୁ ଏବଂ ସ୍ଥିତି ଅନୁଯାୟୀ ଉଚିତ ପୋଷାକ ପିନ୍ଧନ୍ତୁ।',
        rights: 'ଆପଣଙ୍କର ନ୍ୟାୟସଙ୍ଗତ ମଜୁରୀ, ସୁରକ୍ଷିତ କାର୍ଯ୍ୟ ସ୍ଥିତି, ଏବଂ ଉଚିତ ବିଶ୍ରାମର ଅଧିକାର ଅଛି। କର୍ମଚାରୀ ଅଧିକାର ଏବଂ ସରକାରୀ ଯୋଜନା ବିଷୟରେ ଅଧିକ ସୂଚନା ପାଇଁ ଶିକ୍ଷା ବିଭାଗ ଦେଖନ୍ତୁ।',
        default: 'ମୁଁ ଆପଣଙ୍କର ପ୍ରଶ୍ନ ବୁଝିପାରିଲି। ବିସ୍ତୃତ ସୂଚନା ପାଇଁ, ଦୟାକରି ଆପ୍ ରେ ସମ୍ବନ୍ଧିତ ବିଭାଗ ଦେଖନ୍ତୁ - ସୁରକ୍ଷା ଦିଗନିର୍ଦେଶ, ସ୍ୱାସ୍ଥ୍ୟ ମନିଟରିଂ, ଶିକ୍ଷା, କିମ୍ବା ଜରୁରୀକାଳୀନ ସମ୍ପର୍କ। ମୁଁ ଆପଣଙ୍କୁ ଆହୁରି କିପରି ସାହାଯ୍ୟ କରିପାରିବି?'
      },
      bn: {
        safety: 'কাজের জায়গায় নিরাপত্তার জন্য, সর্বদা সঠিক সুরক্ষামূলক সরঞ্জাম পরুন, নিরাপত্তা প্রোটোকল অনুসরণ করুন এবং যেকোনো বিপদকে অবিলম্বে রিপোর্ট করুন। নিয়মিত বিরতি নিন এবং হাইড্রেটেড থাকুন।',
        health: 'আপনি যদি কাজে অসুস্থ বোধ করেন, অবিলম্বে আপনার সুপারভাইজারকে জানান, বিরতি নিন, হাইড্রেটেড থাকুন এবং লক্ষণ অব্যাহত থাকলে চিকিৎসা সহায়তা নিন। নিয়মিতভাবে আপনার গুরুত্বপূর্ণ লক্ষণগুলি পর্যবেক্ষণ করুন।',
        emergency: 'জরুরি অবস্থায়, অ্যাপে প্যানিক বোতাম ব্যবহার করুন, 108 এ জরুরি পরিষেবা কল করুন এবং বিশ্বস্ত পরিচিতদের সাথে আপনার অবস্থান শেয়ার করুন। শান্ত থাকুন এবং জরুরি প্রক্রিয়া অনুসরণ করুন।',
        weather: 'বর্তমান অবস্থা এবং নিরাপত্তা সুপারিশের জন্য অ্যাপের আবহাওয়া বিভাগ পরীক্ষা করুন। গরম আবহাওয়ায় হাইড্রেটেড থাকুন এবং অবস্থার জন্য উপযুক্ত পোশাক পরুন।',
        rights: 'আপনার ন্যায্য মজুরি, নিরাপদ কাজের পরিবেশ এবং সঠিক বিরতির অধিকার রয়েছে। শ্রমিকদের অধিকার এবং সরকারি স্কিম সম্পর্কে আরও তথ্যের জন্য শিক্ষা বিভাগ দেখুন।',
        default: 'আমি আপনার প্রশ্ন বুঝতে পারছি। বিস্তারিত তথ্যের জন্য, অনুগ্রহ করে অ্যাপে প্রাসঙ্গিক বিভাগ দেখুন - নিরাপত্তা নির্দেশিকা, স্বাস্থ্য পর্যবেক্ষণ, শিক্ষা, বা জরুরি যোগাযোগ। আমি আপনাকে আর কীভাবে সাহায্য করতে পারি?'
      },
      te: {
        safety: 'పని స్థల భద్రత కోసం, ఎల్లప్పుడూ సరైన రక్షణ పరికరాలను ధరించండి, భద్రతా ప్రోటోకాల్‌లను అనుసరించండి మరియు ఏదైనా ప్రమాదాలను వెంటనే నివేదించండి। నియమిత విరామాలు తీసుకోండి మరియు హైడ్రేటెడ్‌గా ఉండండి।',
        health: 'మీరు పనిలో అనారోగ్యంగా భావిస్తే, వెంటనే మీ సూపర్వైజర్‌కు తెలియజేయండి, విరామం తీసుకోండి, హైడ్రేటెడ్‌గా ఉండండి మరియు లక్షణాలు కొనసాగితే వైద్య సహాయం పొందండి। మీ ముఖ్య సంకేతాలను నియమితంగా మానిటర్ చేయండి।',
        emergency: 'అత్యవసర పరిస్థితిలో, అనువర్తనంలోని పానిక్ బటన్‌ను ఉపయోగించండి, 108 వద్ద అత్యవసర సేవలను కాల్ చేయండి మరియు విశ్వసనీయ పరిచయాలతో మీ స్థానాన్ని భాగస్వామ్యం చేయండి। ప్రశాంతంగా ఉండండి మరియు అత్యవసర విధానాలను అనుసరించండి।',
        weather: 'ప్రస్తుత పరిస్థితులు మరియు భద్రతా సిఫార్సుల కోసం అనువర్తనంలోని వాతావరణ విభాగాన్ని తనిఖీ చేయండి। వేడి వాతావరణంలో హైడ్రేటెడ్‌గా ఉండండి మరియు పరిస్థితులకు తగినట్లుగా దుస్తులు ధరించండి।',
        rights: 'మీకు న్యాయమైన వేతనాలు, సురక్షితమైన పని పరిస్థితులు మరియు సరైన విరామాల హక్కు ఉంది। కార్మికుల హక్కులు మరియు ప్రభుత్వ స్కీమ్‌ల గురించి మరింత సమాచారం కోసం విద్య విభాగాన్ని తనిఖీ చేయండి।',
        default: 'నేను మీ ప్రశ్నను అర్థం చేసుకున్నాను। వివరణాత్మక సమాచారం కోసం, దయచేసి అనువర్తనంలోని సంబంధిత విభాగాన్ని తనిఖీ చేయండి - భద్రతా మార్గదర్శకాలు, ఆరోగ్య మానిటరింగ్, విద్య, లేదా అత్యవసర పరిచయాలు। నేను మీకు మరింత ఎలా సహాయం చేయగలను?'
      }
    }

    const langResponses = responses[lang] || responses.en
    
    if (lowerQuestion.includes('safety') || lowerQuestion.includes('safe')) {
      return langResponses.safety
    }
    if (lowerQuestion.includes('health') || lowerQuestion.includes('unwell') || lowerQuestion.includes('sick')) {
      return langResponses.health
    }
    if (lowerQuestion.includes('emergency') || lowerQuestion.includes('help')) {
      return langResponses.emergency
    }
    if (lowerQuestion.includes('weather') || lowerQuestion.includes('temperature')) {
      return langResponses.weather
    }
    if (lowerQuestion.includes('rights') || lowerQuestion.includes('wage') || lowerQuestion.includes('payment')) {
      return langResponses.rights
    }
    
    return langResponses.default
  }

  return {
    isListening,
    transcript,
    response,
    isSpeaking,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    changeLanguage,
  }
}
