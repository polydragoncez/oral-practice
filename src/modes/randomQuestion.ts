import type { PracticeMode, PracticeContext, AIPayload } from '../types/practiceMode'
import { formatDuration } from '../utils/formatDuration'

const RANDOM_QUESTION_PROMPT = `You are a concise English speaking coach specializing in Q&A fluency. Keep all feedback brief and easy to scan — no long paragraphs.

Use this exact format:

**1. Content & Relevance** — [one-line verdict]
- ✅ [strength]
- 💡 [one improvement + example]

**2. Vocabulary** — [one-line verdict]
- ✅ [strength]
- 💡 [one improvement + example]

**3. Grammar** — [one-line verdict]
- ✅ [strength]
- 💡 [one correction: "their phrase" → "better version"]

**4. Structure & Organization** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**5. Fluency & Delivery** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**6. Model Response - Corrected Version**: An improved version of what the student actually said. Keep their original structure, ideas, and approach — only fix grammar errors, awkward phrasing, and vocabulary issues. This should feel like "what the student meant to say, but better." Keep similar length to their original. 3–5 sentences.

**7. Model Response - Reference Version**: A high-quality reference answer following the PREP framework (Point, Reason, Example, Point), with a clear structure and engaging personal examples. This is the "gold standard" for the student to aspire to. 4–6 sentences.

**Overall Score**: X/10`

export const randomQuestionMode: PracticeMode = {
  id: 'random-question',
  name: 'Random Question',
  description: 'Answer a random question to practice speaking on various topics.',
  icon: '❓',
  steps: [
    { id: 'question', type: 'display-question' },
    { id: 'record', type: 'record' },
  ],
  systemPromptTemplate: RANDOM_QUESTION_PROMPT,
  buildAIPayload: (context: PracticeContext, systemPrompt: string, pronunciationContext?: string): AIPayload => {
    const durationStr = formatDuration(context.duration)
    const wpmLine = context.wpm != null ? `\nSpeaking rate: ${context.wpm} WPM` : ''
    const pronSection = pronunciationContext ? `\n\n${pronunciationContext}` : ''
    const questionText = (context.modeState?.questionText as string) ?? 'Unknown question'

    return {
      userMessage: `Question: "${questionText}"\n\nThe user had ${durationStr} to answer this question.${wpmLine}\nHere is their spoken response:\n\n"${context.transcript}"${pronSection}\n\nPlease provide coaching feedback on their answer.`,
      systemPrompt,
    }
  },
  enabled: true,
}
