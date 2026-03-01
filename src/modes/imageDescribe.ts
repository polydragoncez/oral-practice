import type { PracticeMode, PracticeContext, AIPayload } from '../types/practiceMode'
import { formatDuration } from '../utils/formatDuration'

export const imageDescribeMode: PracticeMode = {
  id: 'image-describe',
  name: 'Image Description',
  description: 'Look at an image and describe it in English within a time limit.',
  icon: '🖼️',
  steps: [
    { id: 'show-image', type: 'display-image' },
    { id: 'record', type: 'record' },
  ],
  systemPromptTemplate: '', // uses the user's global system prompt
  buildAIPayload: (context: PracticeContext, systemPrompt: string, pronunciationContext?: string): AIPayload => {
    const durationStr = formatDuration(context.duration)
    const wpmLine = context.wpm != null ? `\nSpeaking rate: ${context.wpm} WPM` : ''
    const pronSection = pronunciationContext ? `\n\n${pronunciationContext}` : ''

    return {
      imageBase64: context.imageBase64,
      imageMimeType: context.imageMimeType,
      userMessage: `The user had ${durationStr} to describe this image.${wpmLine}\nHere is their spoken response:\n\n"${context.transcript}"${pronSection}\n\nPlease provide coaching feedback.`,
      systemPrompt,
    }
  },
  enabled: true,
}
