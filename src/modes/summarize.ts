import type { PracticeMode, PracticeContext, AIPayload } from '../types/practiceMode'
import { formatDuration } from '../utils/formatDuration'

const SUMMARIZE_PROMPT = `You are a professional English speaking coach specializing in summarization skills.

Evaluate the student's oral summary of a passage. Use this exact format:

**1. Content Coverage** — [one-line verdict]
- ✅ [key points they covered well]
- 💡 [key points they missed or got wrong]

**2. Paraphrasing Quality** — [one-line verdict]
- ✅ [good examples of rephrasing in their own words]
- 💡 [parts too close to original + suggested rephrasing]

**3. Grammar** — [one-line verdict]
- ✅ [strength]
- 💡 [one correction: "their phrase" → "better version"]

**4. Conciseness** — [one-line verdict]
- ✅ [strength]
- 💡 [was it too verbose or too brief? A good summary is ~30-50% of original]

**5. Vocabulary & Expression** — [one-line verdict]
- ✅ [strength]
- 💡 [suggest more natural or sophisticated expressions]

**6. Structure & Organization** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip on logical ordering: main idea first, then details]

**7. Fluency** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**8. Model Summary**: Provide an improved version of the student's summary at **their own level** — fix errors, improve paraphrasing, ensure all key points are covered, and keep it concise. Do NOT introduce vocabulary or grammar patterns they didn't attempt. 3–5 sentences. This will be read aloud for the student to imitate.

**Overall Score**: X/10`

export const summarizeMode: PracticeMode = {
  id: 'summarize',
  name: 'Summarize',
  description: 'Read a passage, then summarize it in your own words.',
  icon: '📝',
  steps: [
    { id: 'show-passage', type: 'display-passage' },
    { id: 'record', type: 'record' },
  ],
  systemPromptTemplate: SUMMARIZE_PROMPT,
  buildAIPayload: (context: PracticeContext, systemPrompt: string, pronunciationContext?: string): AIPayload => {
    const durationStr = formatDuration(context.duration)
    const wpmLine = context.wpm != null ? `\nSpeaking rate: ${context.wpm} WPM` : ''
    const pronSection = pronunciationContext ? `\n\n${pronunciationContext}` : ''

    const passageText = (context.modeState?.passageText as string) ?? ''
    const passageTitle = (context.modeState?.passageTitle as string) ?? ''
    const wordCount = (context.modeState?.passageWordCount as number) ?? passageText.split(/\s+/).length
    const keyPoints = (context.modeState?.passageKeyPoints as string[]) ?? []

    const keyPointsStr = keyPoints.length > 0
      ? `\n\nKey points in the original passage:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : ''

    return {
      userMessage: `The student read the following passage (${wordCount} words) titled "${passageTitle}":\n---\n${passageText}\n---${keyPointsStr}\n\nThe student then summarized it in their own words (${durationStr}).${wpmLine}\n\nTheir summary transcript:\n---\n${context.transcript}\n---${pronSection}\n\nPlease provide feedback on their summarization.`,
      systemPrompt,
    }
  },
  enabled: true,
}
