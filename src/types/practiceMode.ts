export interface AIServiceRequest {
  apiKey: string
  systemPrompt: string
  userMessage: string
  imageBase64?: string
  imageMimeType?: string
}

export interface PracticeContext {
  imageBase64?: string
  imageMimeType?: string
  imageUrl?: string
  transcript: string
  duration: number
  wpm?: number
  modeState?: Record<string, unknown>
}

export interface AIPayload {
  userMessage: string
  imageBase64?: string
  imageMimeType?: string
  systemPrompt: string
}

export interface PracticeModeStep {
  id: string
  type: 'display-image' | 'display-text' | 'display-question' | 'display-debate-topic' | 'display-passage' | 'record' | 'transition-prompt'
  duration?: number
  config?: Record<string, unknown>
}

export interface PracticeMode {
  id: string
  name: string
  description: string
  icon: string
  steps: PracticeModeStep[]
  /** Default system prompt for this mode. Empty string = use the user's global setting. */
  systemPromptTemplate: string
  /** Assemble the payload that gets sent to the AI service. */
  buildAIPayload: (context: PracticeContext, systemPrompt: string, pronunciationContext?: string) => AIPayload
  enabled: boolean
}
