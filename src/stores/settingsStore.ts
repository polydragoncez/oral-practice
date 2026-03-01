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

**6. Model Response - Corrected Version**: An improved version of what the student actually said. Keep their original structure, ideas, and approach — only fix grammar errors, awkward phrasing, and vocabulary issues. This should feel like "what the student meant to say, but better." Keep similar length to their original. 3–5 sentences.

**7. Model Response - Reference Version**: A high-quality reference answer that demonstrates how a proficient English speaker would approach this task, following the DLASS framework (Describe, Locate, Action, Speculate, Share), demonstrating rich spatial vocabulary and natural speculation language. This is the "gold standard" for the student to aspire to. 4–6 sentences.

**Overall Score**: X/10`

const DEFAULT_SPEAKING_GUIDES: Record<string, string> = {
  'image-describe': `🎯 **Speaking Framework: DLASS**

**1. 📸 Describe** — What do you see?
> "In this picture, I can see..."
> "There is/are..."

**2. 📍 Locate** — Where are things?
> "In the foreground/background..."
> "On the left/right side..."
> "In the center of the image..."

**3. 🎬 Action** — What's happening?
> "The person seems to be..."
> "It looks like they are..."
> "...appears to be taking place"

**4. 💭 Speculate** — Why? What's the story?
> "It might be because..."
> "Perhaps they are..."
> "This could be a situation where..."

**5. 🗣️ Share** — Your reaction & connection
> "What strikes me is..."
> "This reminds me of..."
> "I think/feel that..."

💡 **Tips:**
- Use present continuous for actions: "is walking", "are sitting"
- Use spatial prepositions: beside, between, among, near
- Don't just list — connect your observations into a narrative`,

  'pro-con-debate': `🎯 **Debate Framework: PEE (Point-Evidence-Explain)**

For EACH side (Pro & Con), structure your argument:

**1. 📌 Point** — State your position clearly
> "I believe that... because..."
> "The main argument for/against this is..."
> "My position is that..."

**2. 📊 Evidence** — Support with reasons or examples
> "For example,..."
> "Studies have shown that..."
> "We can see this in everyday life when..."
> "A clear example of this is..."

**3. 💡 Explain** — Connect evidence to your point
> "This means that..."
> "This is important because..."
> "As a result,..."
> "Therefore, we can conclude that..."

🔄 **Transition phrases** (when switching sides):
> "On the other hand,..."
> "However, looking at the other side,..."
> "Conversely,..."
> "While that may be true, we must also consider..."
> "Nevertheless,..."

💡 **Tips:**
- Start strong — your first sentence should clearly state your stance
- Use discourse markers: firstly, moreover, furthermore, in addition
- Acknowledge the opposing view before countering it
- Keep each side balanced in length and depth
- Don't just list points — explain WHY each point matters`,

  'random-question': `🎯 **Speaking Framework: PREP**

**1. 📌 Point** — Answer the question directly
> "I think/believe that..."
> "In my opinion,..."
> "If I could..., I would..."

**2. 💭 Reason** — Explain why
> "The reason is..."
> "This is because..."
> "I feel this way because..."

**3. 📖 Example** — Give a specific example
> "For instance,..."
> "I remember a time when..."
> "A good example would be..."
> "In my experience,..."

**4. 🎯 Point** — Wrap up by restating your answer
> "So that's why I believe..."
> "In conclusion,..."
> "All things considered,..."

💡 **Tips:**
- Don't panic — take a breath before speaking
- It's OK to think aloud: "That's an interesting question, let me think..."
- Use fillers naturally: "well", "you know", "I mean"
- Be specific — vague answers are less engaging
- Personal stories make your answer memorable`,

  'shadowing': `🎯 **Read Aloud Tips**

**1. 👂 Listen First** — Play the audio at least once before recording
**2. 🐢 Start Slow** — It's better to be clear than fast
**3. 🔗 Link Words** — Connect words naturally: "an apple" → "a·napple"
**4. 📈 Stress Key Words** — Emphasize nouns, verbs, adjectives
**5. ⏸️ Pause at Punctuation** — Commas = short pause, periods = longer pause

💡 **Focus on:**
- Difficult sounds: th /θ/, r /ɹ/, l /l/, v /v/
- Word stress: phOtograph vs photoGraphic
- Sentence rhythm: stress content words, reduce function words
- Intonation: voice goes up for questions, down for statements`,

  'summarize': `🎯 **Summarize Framework: MKCO**

**1. 📌 Main Idea** — What is the passage mainly about?
> "This passage is about..."
> "The article mainly discusses..."
> "The author's main point is..."

**2. 🔑 Key Points** — What are the important details?
> "The author mentions that..."
> "One key point is..."
> "According to the passage..."
> "The text highlights..."

**3. 🔗 Connect** — How do the ideas relate?
> "This is because..."
> "As a result..."
> "In other words..."
> "This leads to..."

**4. 🎁 Own Words** — Rephrase, don't repeat!
> ✅ "The writer argues that working from home boosts efficiency"
> ❌ "Remote work increases productivity" (too close to original)

💡 **Tips:**
- Aim for 30-50% of the original length
- Don't add your own opinion — just report what the text says
- Use reporting verbs: states, explains, argues, suggests, highlights, emphasizes
- Start with the big picture, then add supporting details
- Skip minor details — focus on what matters most`,
}

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
  speakingGuides: Record<string, string>
  darkMode: boolean
  currentModeId: string
  modePrompts: Record<string, string>
  thinkTime: number
  azureTtsVoice: string

  // Shadowing cross-mode (not persisted)
  shadowingText: string | null
  shadowingSource: { modeId: string; version: string } | null

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
  setSpeakingGuide: (modeId: string, guide: string) => void
  resetSpeakingGuide: (modeId: string) => void
  resetAllSpeakingGuides: () => void
  setDarkMode: (v: boolean) => void
  setCurrentModeId: (id: string) => void
  setModePrompt: (modeId: string, prompt: string) => void
  resetModePrompt: (modeId: string) => void
  setThinkTime: (t: number) => void
  setAzureTtsVoice: (v: string) => void
  setShadowingText: (text: string, source?: { modeId: string; version: string }) => void
  clearShadowingText: () => void
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
      speakingGuides: {},
      darkMode: false,
      currentModeId: 'image-describe',
      modePrompts: {},
      thinkTime: 5,
      azureTtsVoice: 'en-US-JennyNeural',
      shadowingText: null,
      shadowingSource: null,
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
      setSpeakingGuide: (modeId, guide) =>
        set((state) => ({ speakingGuides: { ...state.speakingGuides, [modeId]: guide } })),
      resetSpeakingGuide: (modeId) =>
        set((state) => {
          const { [modeId]: _, ...rest } = state.speakingGuides
          return { speakingGuides: rest }
        }),
      resetAllSpeakingGuides: () => set({ speakingGuides: {} }),
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
      setAzureTtsVoice: (v) => set({ azureTtsVoice: v }),
      setShadowingText: (text, source) =>
        set({ shadowingText: text, shadowingSource: source ?? null }),
      clearShadowingText: () =>
        set({ shadowingText: null, shadowingSource: null }),
      setSession: (partial) =>
        set((state) => ({ session: { ...state.session, ...partial } })),
      resetSession: () => set({ session: defaultSession }),
    }),
    {
      name: 'oral-practice-settings',
      version: 5,
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
        speakingGuides: state.speakingGuides,
        darkMode: state.darkMode,
        currentModeId: state.currentModeId,
        modePrompts: state.modePrompts,
        thinkTime: state.thinkTime,
        azureTtsVoice: state.azureTtsVoice,
      }),
    }
  )
)

export { DEFAULT_SYSTEM_PROMPT, DEFAULT_SPEAKING_GUIDES }
