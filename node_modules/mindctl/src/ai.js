// ═══════════════════════════════════════════════════
// 🤖 mindctl — AI Engine (MegaLLM Integration)
// Therapy, analysis, insights, and safety guardrails
// ═══════════════════════════════════════════════════

import Conf from 'conf';

const config = new Conf({ projectName: 'mindctl' });

// ─── Configuration ────────────────────────────────
const getApiUrl = () => config.get('megallm.apiUrl') || process.env.MEGALLM_API_URL || 'https://api.megallm.com/v1/chat';
const getApiKey = () => config.get('megallm.apiKey') || process.env.MEGALLM_API_KEY || '';
const getModel = () => config.get('megallm.model') || process.env.MEGALLM_MODEL || 'megallm-2.5';

// ─── System Prompts ───────────────────────────────
const SYSTEM_PROMPTS = {
    therapy: `You are a compassionate, evidence-based AI wellness companion inside a terminal tool called mindctl.
Your role is to support developers' mental health through conversation, using techniques from:
- Cognitive Behavioral Therapy (CBT)
- Dialectical Behavior Therapy (DBT) — especially distress tolerance and emotion regulation
- Motivational Interviewing
- Solution-Focused Brief Therapy
- Mindfulness-Based Cognitive Therapy

CRITICAL SAFETY RULES:
- You are NOT a replacement for professional therapy. Remind users of this when appropriate.
- NEVER diagnose medical or mental health conditions.
- If someone expresses suicidal ideation, self-harm, or immediate danger, IMMEDIATELY provide crisis resources:
  • Crisis Text Line: Text HOME to 741741
  • National Suicide Prevention Lifeline: 988 (US)
  • International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/
- Always maintain a warm, validating, non-judgmental tone.
- Use "I notice..." and "It sounds like..." language, not "You are..." or "You should..."
- Keep responses concise (3-5 sentences typically) — this is a terminal, not a novel.
- End with a gentle question or reflection prompt when appropriate.`,

    moodAnalysis: `You are a behavioral pattern analyst. Given mood check-in data, provide:
1. A brief, empathetic observation about the mood (1 sentence)
2. A potential contributing factor to explore (1 sentence)
3. One small, actionable suggestion (1 sentence)
Keep it warm and non-clinical. Format as plain text, not JSON.`,

    journalAnalysis: `You are a therapeutic writing analyst. Analyze the journal entry and provide:
1. Key emotional themes detected
2. Any cognitive patterns to notice (not diagnose)
3. A thoughtful reflection or question to deepen awareness
Keep analysis under 100 words. Be warm, supportive, and growth-oriented.`,

    cbtAnalysis: `You are a CBT specialist assistant. Given a thought record, help identify:
1. The cognitive distortion(s) present (e.g., catastrophizing, mind reading, all-or-nothing, etc.)
2. Evidence-based counterpoints
3. A reframed thought that is more balanced and realistic
Be direct but compassionate. Keep under 80 words.`,

    burnoutAnalysis: `You are a workplace wellness analyst. Given git commit pattern data, assess:
1. Burnout risk level and contributing factors
2. Specific patterns of concern (late nights, weekends, boom-bust cycles)
3. 2-3 actionable recommendations
Be evidence-based and supportive. Frame as behavioral observations, not diagnoses.`,

    weeklyReport: `You generate a warm, insightful weekly wellness narrative for a developer.
Use a weather/nature metaphor. Include:
1. Opening metaphor about their cognitive weather this week
2. 2-3 key patterns observed
3. Highlight of what went well
4. One gentle suggestion for next week
5. Encouraging closing
Keep under 150 words. Be specific with data but warm in tone.`,

    sleepCoach: `You are a sleep hygiene coach. Given sleep data, provide:
1. Brief observation about sleep patterns
2. One evidence-based tip for improvement
3. A gentle motivation
Keep under 60 words.`,

    meditationGuide: `You generate personalized guided meditation scripts. Based on the user's current mood and preferences:
1. Create a 2-3 minute meditation script
2. Include grounding, body scan, or visualization elements
3. Keep language soft, slow, and calming
4. End with a gentle return to awareness`,

    reframe: `You are a cognitive reframing assistant. Given a negative thought, provide:
1. Acknowledgment of the feeling (1 sentence)
2. Identification of the cognitive distortion (1 sentence)
3. A reframed, balanced perspective (1-2 sentences)
Keep it concise and warm.`,

    wisdom: `Generate a single inspiring, relevant quote or insight about mental health, resilience, or self-care.
Tailor to the user's current mood if provided. Include the attribution.
Keep under 30 words. No explanation needed.`,

    habitSuggestion: `You suggest healthy habits. Based on the user's current wellness data, suggest:
1. One new habit to try (specific, small, achievable)
2. Why it would help them specifically
3. How to start (micro-step)
Keep under 50 words.`,

    dailyChallenge: `Generate a mental wellness micro-challenge for today. Should be:
1. Achievable in under 5 minutes
2. Evidence-based (from CBT, positive psychology, or mindfulness)
3. Written as a warm, engaging prompt
Keep under 30 words.`,
};

// ─── Core API Call ────────────────────────────────
export async function callAI(messages, options = {}) {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const model = getModel();

    if (!apiKey) {
        return getFallbackResponse(options.type || 'general');
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 500,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || getFallbackResponse(options.type || 'general');
    } catch (error) {
        if (options.throwOnError) throw error;
        return getFallbackResponse(options.type || 'general');
    }
}

// ─── High-Level AI Functions ──────────────────────

export async function therapyChat(userMessage, conversationHistory = []) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.therapy },
        ...conversationHistory.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userMessage },
    ];

    return callAI(messages, { temperature: 0.7, maxTokens: 300, type: 'therapy' });
}

export async function analyzeMood(mood, score, energy, note) {
    const userContent = `Mood: ${mood} (${score}/10), Energy: ${energy}/10${note ? `, Note: "${note}"` : ''}`;
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.moodAnalysis },
        { role: 'user', content: userContent },
    ];

    return callAI(messages, { temperature: 0.5, maxTokens: 150, type: 'mood' });
}

export async function analyzeJournal(content, type = 'freeform') {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.journalAnalysis },
        { role: 'user', content: `Journal type: ${type}\n\nEntry:\n${content}` },
    ];

    return callAI(messages, { temperature: 0.6, maxTokens: 200, type: 'journal' });
}

export async function analyzeCBT(thoughtRecord) {
    const userContent = `Situation: ${thoughtRecord.situation}
Automatic Thought: "${thoughtRecord.automaticThought}"
Emotion: ${thoughtRecord.emotion} (intensity: ${thoughtRecord.emotionIntensity}/10)`;

    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.cbtAnalysis },
        { role: 'user', content: userContent },
    ];

    return callAI(messages, { temperature: 0.4, maxTokens: 200, type: 'cbt' });
}

export async function analyzeBurnout(gitData) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.burnoutAnalysis },
        { role: 'user', content: `Git Analysis Data:\n${JSON.stringify(gitData, null, 2)}` },
    ];

    return callAI(messages, { temperature: 0.5, maxTokens: 400, type: 'burnout' });
}

export async function generateWeeklyReport(weekData) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.weeklyReport },
        { role: 'user', content: `Weekly Wellness Data:\n${JSON.stringify(weekData, null, 2)}` },
    ];

    return callAI(messages, { temperature: 0.7, maxTokens: 300, type: 'weekly' });
}

export async function analyzeSleep(sleepData) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.sleepCoach },
        { role: 'user', content: `Sleep Data:\n${JSON.stringify(sleepData, null, 2)}` },
    ];

    return callAI(messages, { temperature: 0.5, maxTokens: 100, type: 'sleep' });
}

export async function generateMeditation(mood, duration = 3) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.meditationGuide },
        { role: 'user', content: `Current mood: ${mood}. Generate a ${duration}-minute guided meditation script.` },
    ];

    return callAI(messages, { temperature: 0.8, maxTokens: 500, type: 'meditation' });
}

export async function reframeThought(negativeThought) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.reframe },
        { role: 'user', content: `Negative thought: "${negativeThought}"` },
    ];

    return callAI(messages, { temperature: 0.5, maxTokens: 150, type: 'reframe' });
}

export async function getWisdom(mood = null) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.wisdom },
        { role: 'user', content: mood ? `Current mood: ${mood}. Share relevant wisdom.` : 'Share a wellness insight.' },
    ];

    return callAI(messages, { temperature: 0.9, maxTokens: 60, type: 'wisdom' });
}

export async function suggestHabit(wellnessData) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.habitSuggestion },
        { role: 'user', content: `Current wellness data:\n${JSON.stringify(wellnessData, null, 2)}` },
    ];

    return callAI(messages, { temperature: 0.7, maxTokens: 100, type: 'habit' });
}

export async function getDailyChallenge() {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPTS.dailyChallenge },
        { role: 'user', content: `Generate today's wellness micro-challenge.` },
    ];

    return callAI(messages, { temperature: 0.9, maxTokens: 60, type: 'challenge' });
}

export async function generateDailySummaryNarrative(dayData) {
    const messages = [
        { role: 'system', content: `You generate a brief, warm end-of-day wellness summary for a developer. Include data highlights, a reflection, and encouragement. Keep under 100 words.` },
        { role: 'user', content: `Today's data:\n${JSON.stringify(dayData, null, 2)}` },
    ];

    return callAI(messages, { temperature: 0.7, maxTokens: 200, type: 'summary' });
}

// ─── AI Configuration ─────────────────────────────
export function setApiConfig(apiUrl, apiKey, model) {
    if (apiUrl) config.set('megallm.apiUrl', apiUrl);
    if (apiKey) config.set('megallm.apiKey', apiKey);
    if (model) config.set('megallm.model', model);
}

export function getApiConfig() {
    return {
        apiUrl: getApiUrl(),
        apiKey: getApiKey() ? '••••' + getApiKey().slice(-4) : '(not set)',
        model: getModel(),
    };
}

// ─── Fallback Responses ───────────────────────────
function getFallbackResponse(type) {
    const fallbacks = {
        therapy: "I hear you. While I can't connect to the AI right now, remember: what you're feeling is valid. Consider journaling about it with `mindctl journal write`, or try a breathing exercise with `mindctl breathe`.",
        mood: "Thanks for checking in. Tracking your mood consistently creates powerful self-awareness over time. Keep it up!",
        journal: "Your words matter. Writing itself is therapeutic — the act of expressing thoughts helps process emotions. Keep journaling.",
        cbt: "Notice the thought pattern here. Ask yourself: Is this thought based on facts or feelings? What would I tell a friend in this situation?",
        burnout: "Without full analysis, general advice: maintain work boundaries, prioritize sleep, and take regular breaks. Run `mindctl breathe` for a quick reset.",
        weekly: "This week brought its own challenges and victories. Every step toward awareness is progress. Keep showing up for yourself.",
        sleep: "Consistent sleep is the foundation of mental wellness. Aim for the same bedtime each night, and try the 4-7-8 breathing technique before sleep.",
        meditation: "Find a comfortable position. Close your eyes. Take three deep breaths. Notice the weight of your body. You are here. You are safe. That's enough for now.",
        reframe: "Thoughts aren't facts. Try asking: What evidence supports this? What evidence contradicts it? What would a compassionate friend say?",
        wisdom: '"The greatest glory in living lies not in never falling, but in rising every time we fall." — Nelson Mandela',
        habit: "Try starting with one glass of water first thing in the morning. Small habits compound into life-changing routines.",
        challenge: "Today's challenge: Write down 3 things you're grateful for right now. Take 60 seconds.",
        summary: "Another day of showing up for your mental health. That alone is worth celebrating. Rest well tonight.",
        general: "I'm here for you. Try `mindctl --help` to explore all wellness tools available.",
    };

    return fallbacks[type] || fallbacks.general;
}

// ─── Safety Check ─────────────────────────────────
export function checkForCrisisSignals(text) {
    const crisisKeywords = [
        'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
        'self-harm', 'self harm', 'cutting myself', 'hurt myself',
        'no reason to live', 'better off dead', 'can\'t go on',
        'overdose', 'ending it', 'goodbye forever',
    ];

    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
}

export function getCrisisResources() {
    return `
🚨 CRISIS RESOURCES — You're not alone

📞 Emergency: 911 (US) / 999 (UK) / 112 (EU)
📞 Suicide Prevention Lifeline: 988 (US)
📱 Crisis Text Line: Text HOME to 741741
🌐 International: https://findahelpline.com/

📞 Vandrevala Foundation: 1860-2662-345 (India)
📞 Samaritans: 116 123 (UK)
📞 Lifeline: 13 11 14 (Australia)

💙 You matter. Please reach out.`;
}

export default {
    callAI, therapyChat, analyzeMood, analyzeJournal, analyzeCBT,
    analyzeBurnout, generateWeeklyReport, analyzeSleep,
    generateMeditation, reframeThought, getWisdom, suggestHabit,
    getDailyChallenge, generateDailySummaryNarrative,
    setApiConfig, getApiConfig,
    checkForCrisisSignals, getCrisisResources,
};
