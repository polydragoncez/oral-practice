import type { PracticeMode, PracticeContext, AIPayload } from '../types/practiceMode'
import { formatDuration } from '../utils/formatDuration'

const DEBATE_PROMPT = `You are a concise English speaking coach specializing in debate and argumentation. Keep all feedback brief and easy to scan — no long paragraphs.

The student argued both FOR and AGAINST a topic. Evaluate both sides.

Use this exact format:

**1. Argument Strength (FOR)** — [one-line verdict]
- ✅ [strength]
- 💡 [one improvement + example]

**2. Argument Strength (AGAINST)** — [one-line verdict]
- ✅ [strength]
- 💡 [one improvement + example]

**3. Vocabulary & Persuasive Language** — [one-line verdict]
- ✅ [strength]
- 💡 [one improvement + example]

**4. Grammar & Transitions** — [one-line verdict]
- ✅ [strength]
- 💡 [one correction: "their phrase" → "better version"]

**5. Fluency & Delivery** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**6. Model Argument**: Provide two improved versions of the student's arguments at **their own level** — fix errors and unnatural phrasing, but keep the vocabulary and sentence complexity close to what they actually used. Do NOT introduce words or grammar patterns they didn't attempt.

**PRO (improved):** 2–3 sentences arguing FOR the topic.
**CON (improved):** 2–3 sentences arguing AGAINST the topic.

These will be read aloud for the student to imitate.

**Overall Score**: X/10`

export const proConDebateMode: PracticeMode = {
  id: 'pro-con-debate',
  name: 'Pro/Con Debate',
  description: 'Argue both sides of a topic to practice persuasive speaking.',
  icon: '⚖️',
  steps: [
    { id: 'debate', type: 'display-debate-topic' },
    // No 'record' step — DebateFlow handles recording internally
  ],
  systemPromptTemplate: DEBATE_PROMPT,
  buildAIPayload: (context: PracticeContext, systemPrompt: string, pronunciationContext?: string): AIPayload => {
    const debateTopic = (context.modeState?.debateTopic as string) ?? 'Unknown topic'
    const proTranscript = (context.modeState?.proTranscript as string) ?? ''
    const conTranscript = (context.modeState?.conTranscript as string) ?? ''
    const proDuration = (context.modeState?.proDuration as number) ?? 0
    const conDuration = (context.modeState?.conDuration as number) ?? 0
    const pronSection = pronunciationContext ? `\n\n${pronunciationContext}` : ''

    return {
      userMessage: `Topic: "${debateTopic}"\n\n**FOR argument** (${formatDuration(proDuration)}):\n"${proTranscript}"\n\n**AGAINST argument** (${formatDuration(conDuration)}):\n"${conTranscript}"${pronSection}\n\nPlease provide coaching feedback on both sides of the debate.`,
      systemPrompt,
    }
  },
  enabled: true,
}
