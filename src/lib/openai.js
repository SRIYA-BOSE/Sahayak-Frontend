const API_BASE = '/api/ai';

// ----------------------
// Health Recommendations
// ----------------------
export const getHealthRecommendations = async (vitalSigns) => {
  try {
    const res = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vitalSigns })
    });

    const data = await res.json();
    return data.data;
  } catch {
    return {
      riskLevel: 'unknown',
      recommendations: ['AI unavailable. Please consult a healthcare professional.']
    };
  }
};

// ----------------------
// Voice Assistant
// ----------------------
export const getVoiceAssistantResponse = async (message, language = 'en') => {
  try {
    const res = await fetch(`${API_BASE}/voice-assistant`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language })
    });

    const data = await res.json();
    return data.data.response;
  } catch {
    return "AI unavailable. Please try again later.";
  }
};

// ----------------------
// Job Skill Match
// ----------------------
export const getJobSkillMatch = async (userSkills, jobDescription) => {
  try {
    const res = await fetch(`${API_BASE}/job-match`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userSkills, jobDescription })
    });

    const data = await res.json();
    return data.data;
  } catch {
    return { matchScore: 0, suggestions: [] };
  }
};
