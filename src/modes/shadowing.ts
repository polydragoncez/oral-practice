import type { PracticeMode, PracticeContext, AIPayload } from '../types/practiceMode'

const SHADOWING_PROMPT = `You are a pronunciation coach. The student read the following text aloud:

Reference text:
---
{referenceText}
---

Their transcript (what was actually recognized):
---
{transcript}
---

Duration: {duration}s | WPM: {wpm}
{pronunciationContext}

Please provide:

**1. Overall Assessment** — Brief comment on their reading
- ✅ [what they did well]
- 💡 [main area to improve]

**2. Key Problem Areas** — Focus on the 2-3 most important pronunciation issues
- 💡 [issue 1 + specific tip]
- 💡 [issue 2 + specific tip]

**3. Practice Tips** — Specific tips for the sounds they struggled with
- 💡 [actionable tip]

**Overall Score**: X/10`

function buildShadowingPayload(
  context: PracticeContext,
  systemPrompt: string,
  pronunciationContext?: string
): AIPayload {
  const { transcript, duration, wpm, modeState } = context
  const referenceText = (modeState?.shadowingText as string) || ''

  let pronSection = ''
  if (pronunciationContext) {
    pronSection = `\n${pronunciationContext}`
  }

  const userMessage = systemPrompt
    .replace('{referenceText}', referenceText)
    .replace('{transcript}', transcript)
    .replace('{duration}', String(duration))
    .replace('{wpm}', wpm ? String(wpm) : 'N/A')
    .replace('{pronunciationContext}', pronSection)

  return {
    userMessage,
    systemPrompt: 'You are a helpful English pronunciation coach. Keep feedback brief and actionable.',
    imageBase64: undefined,
    imageMimeType: undefined,
  }
}

export const shadowingMode: PracticeMode = {
  id: 'shadowing',
  name: 'Read Aloud',
  icon: '🗣️',
  description: 'Listen, then read aloud — get word-by-word pronunciation scores',
  steps: [
    { id: 'display-text', type: 'display-shadowing-text' },
    { id: 'record', type: 'record' },
  ],
  systemPromptTemplate: SHADOWING_PROMPT,
  buildAIPayload: buildShadowingPayload,
  enabled: true,
}
