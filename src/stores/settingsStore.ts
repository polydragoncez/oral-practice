import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PronunciationResult } from '../types/pronunciation'

const DEFAULT_SYSTEM_PROMPT = `You are a concise English speaking coach. Keep all feedback brief and easy to scan — no long paragraphs.

Use this exact format:

**1. Vocabulary** — [one-line verdict]
- ✅ [strength]
- 💡 [one improvement + example]

**2. Grammar** — [one-line verdict]
- ✅ [strength]
- 💡 [one correction: "their phrase" → "better version"]

**3. Coherence** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**4. Relevance** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**5. Fluency** — [one-line verdict]
- ✅ [strength]
- 💡 [one tip]

**6. Model Description**: Rewrite the student's description at **their own level** — fix errors and unnatural phrasing, but keep the vocabulary and sentence complexity close to what they actually used. Do NOT introduce words or grammar patterns they didn't attempt. If they used simple sentences, output simple sentences done correctly. Only use more sophisticated language if they already demonstrated that level themselves. The goal is one small step up, not a complete rewrite. 3–5 sentences. This will be read aloud for the student to imitate.

**Overall Score**: X/10`

const DEFAULT_SPEAKING_GUIDE = `🎯 **Speaking Framework: DLASS**

**1. 📸 Describe** — What do you see?
> "In this picture, I can see..."
> "There is/are..."

**2. 📍 Locate** — Where are things?
> "In the foreground/background..."
> "On the left/right..."
> "In the center of the image..."

**3. 🎬 Action** — What's happening?
> "The person seems to be..."
> "It looks like they are..."

**4. 💭 Speculate** — Why? What's the story?
> "It might be because..."
> "Perhaps they are..."
> "This could be a situation where..."

**5. 🗣️ Share** — Your reaction & connection
> "What strikes me is..."
> "This reminds me of..."
> "I think/feel that..."`

export type STTEngine = 'webSpeech' | 'whisper'
export type TTSEngine = 'browser' | 'openai' | 'azure'
export type AIProvider = 'claude' | 'openai' | 'gemini'
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash'

interface Session {
  currentImage: string | null        // URL or base64
  currentImageBase64: string | null  // always base64 for AI
  currentImageMimeType: string
  transcript: string
  aiFeedback: string
  recordingBlob: Blob | null
  duration: number
  pronunciationResult: PronunciationResult | null
  modeState: Record<string, unknown>
}

interface SettingsState {
  // API Keys
  unsplashKey: string
  openaiKey: string
  anthropicKey: string
  geminiKey: string
  azureSpeechKey: string
  azureSpeechRegion: string
  geminiModel: GeminiModel

  // Engines
  sttEngine: STTEngine
  ttsEngine: TTSEngine
  aiProvider: AIProvider

  // Options
  defaultDuration: number
  dailyGoal: number
  systemPrompt: string
  speakingGuide: string
  darkMode: boolean
  currentModeId: string
  modePrompts: Record<string, string>
  thinkTime: number

  // Current session (not persisted)
  session: Session

  // Actions
  setUnsplashKey: (key: string) => void
  setOpenaiKey: (key: string) => void
  setAnthropicKey: (key: string) => void
  setGeminiKey: (key: string) => void
  setGeminiModel: (model: GeminiModel) => void
  setAzureSpeechKey: (key: string) => void
  setAzureSpeechRegion: (region: string) => void
  setSttEngine: (engine: STTEngine) => void
  setTtsEngine: (engine: TTSEngine) => void
  setAiProvider: (provider: AIProvider) => void
  setDefaultDuration: (d: number) => void
  setDailyGoal: (m: number) => void
  setSystemPrompt: (p: string) => void
  resetSystemPrompt: () => void
  setSpeakingGuide: (g: string) => void
  resetSpeakingGuide: () => void
  setDarkMode: (v: boolean) => void
  setCurrentModeId: (id: string) => void
  setModePrompt: (modeId: string, prompt: string) => void
  resetModePrompt: (modeId: string) => void
  setThinkTime: (t: number) => void
  setSession: (partial: Partial<Session>) => void
  resetSession: () => void
}

const defaultSession: Session = {
  currentImage: null,
  currentImageBase64: null,
  currentImageMimeType: 'image/jpeg',
  transcript: '',
  aiFeedback: '',
  recordingBlob: null,
  duration: 0,
  pronunciationResult: null,
  modeState: {},
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unsplashKey: '',
      openaiKey: '',
      anthropicKey: '',
      geminiKey: '',
      geminiModel: 'gemini-2.5-flash',
      azureSpeechKey: '',
      azureSpeechRegion: 'eastus',
      sttEngine: 'webSpeech',
      ttsEngine: 'browser',
      aiProvider: 'claude',
      defaultDuration: 60,
      dailyGoal: 10,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      speakingGuide: DEFAULT_SPEAKING_GUIDE,
      darkMode: false,
      currentModeId: 'image-describe',
      modePrompts: {},
      thinkTime: 5,
      session: defaultSession,

      setUnsplashKey: (key) => set({ unsplashKey: key }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setAnthropicKey: (key) => set({ anthropicKey: key }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      setGeminiModel: (model) => set({ geminiModel: model }),
      setAzureSpeechKey: (key) => set({ azureSpeechKey: key }),
      setAzureSpeechRegion: (region) => set({ azureSpeechRegion: region }),
      setSttEngine: (engine) => set({ sttEngine: engine }),
      setTtsEngine: (engine) => set({ ttsEngine: engine }),
      setAiProvider: (provider) => set({ aiProvider: provider }),
      setDefaultDuration: (d) => set({ defaultDuration: d }),
      setDailyGoal: (m) => set({ dailyGoal: m }),
      setSystemPrompt: (p) => set({ systemPrompt: p }),
      resetSystemPrompt: () => set({ systemPrompt: DEFAULT_SYSTEM_PROMPT }),
      setSpeakingGuide: (g) => set({ speakingGuide: g }),
      resetSpeakingGuide: () => set({ speakingGuide: DEFAULT_SPEAKING_GUIDE }),
      setDarkMode: (v) => set({ darkMode: v }),
      setCurrentModeId: (id) => set({ currentModeId: id }),
      setModePrompt: (modeId, prompt) =>
        set((state) => ({ modePrompts: { ...state.modePrompts, [modeId]: prompt } })),
      resetModePrompt: (modeId) =>
        set((state) => {
          const { [modeId]: _, ...rest } = state.modePrompts
          return { modePrompts: rest }
        }),
      setThinkTime: (t) => set({ thinkTime: t }),
      setSession: (partial) =>
        set((state) => ({ session: { ...state.session, ...partial } })),
      resetSession: () => set({ session: defaultSession }),
    }),
    {
      name: 'oral-practice-settings',
      version: 3,
      migrate: (persisted: unknown) => {
        // always reset systemPrompt to current default on version bump
        return { ...(persisted as object), systemPrompt: DEFAULT_SYSTEM_PROMPT }
      },
      partialize: (state) => ({
        unsplashKey: state.unsplashKey,
        openaiKey: state.openaiKey,
        anthropicKey: state.anthropicKey,
        geminiKey: state.geminiKey,
        geminiModel: state.geminiModel,
        azureSpeechKey: state.azureSpeechKey,
        azureSpeechRegion: state.azureSpeechRegion,
        sttEngine: state.sttEngine,
        ttsEngine: state.ttsEngine,
        aiProvider: state.aiProvider,
        defaultDuration: state.defaultDuration,
        dailyGoal: state.dailyGoal,
        systemPrompt: state.systemPrompt,
        speakingGuide: state.speakingGuide,
        darkMode: state.darkMode,
        currentModeId: state.currentModeId,
        modePrompts: state.modePrompts,
        thinkTime: state.thinkTime,
      }),
    }
  )
)

export { DEFAULT_SYSTEM_PROMPT, DEFAULT_SPEAKING_GUIDE }
