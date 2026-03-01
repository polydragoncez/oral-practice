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

**6. Model Response - Corrected Version**: An improved version of what the student actually said. Keep their original structure, ideas, and approach — only fix grammar errors, awkward phrasing, and vocabulary issues. This should feel like "what the student meant to say, but better." Keep similar length to their original.

**PRO (corrected):** 2–3 sentences arguing FOR.
**CON (corrected):** 2–3 sentences arguing AGAINST.

**7. Model Response - Reference Version**: A high-quality reference answer following the PEE framework (Point, Evidence, Explain) for each side, with strong transition phrases between pro and con positions. This is the "gold standard" for the student to aspire to.

**PRO (reference):** 3–4 sentences arguing FOR.
**CON (reference):** 3–4 sentences arguing AGAINST.

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
