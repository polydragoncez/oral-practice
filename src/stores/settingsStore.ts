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

const DEFAULT_CHEAT_SHEETS: Record<string, string> = {
  'image-describe': `🎯 **DLASS Framework**

**D** — Describe: What do you see?

**L** — Location: Where are things?

**A** — Action: What's happening?

**S** — Speculate: Why or what might happen?

**S** — Share: Your personal reaction

⏱ 60-90 sec | 🎯 Use present continuous for actions`,

  'pro-con-debate': `🎯 **PEE Framework**

**P** — Point: State your position clearly

**E** — Evidence: Give a fact, example, or statistic

**E** — Explain: Why does this evidence matter?

📌 Stage 1: Argue FOR (30-60 sec)

📌 Stage 2: Argue AGAINST (30-60 sec)

💡 Signal words: "Furthermore..." / "However..." / "This matters because..."`,

  'random-question': `🎯 **PREP Framework**

**P** — Point: Answer the question directly

**R** — Reason: Explain why

**E** — Example: Give a specific example

**P** — Point: Restate to wrap up

⏱ 45-90 sec | 💡 Start with "I believe..." or "In my opinion..."`,

  'summarize': `🎯 **MKCO Framework**

**M** — Main idea: What's the passage about in one sentence?

**K** — Key points: 2-3 most important details

**C** — Connect: How do the ideas relate?

**O** — Own words: Rephrase, don't repeat

⏱ 30-60 sec | 💡 Start with "This passage discusses..." | 🚫 Don't add opinions`,

  'shadowing': `🎯 **Read Aloud Tips**

👂 Listen first, at least once

🐢 Clarity over speed

🔗 Link words naturally: "an apple" → "a·napple"

📈 Stress content words (nouns, verbs, adjectives)

⏸️ Pause at punctuation

🎯 Key sounds: th /θ/, r /ɹ/, v /v/, l vs r`,
}

const DEFAULT_SPEAKING_GUIDES: Record<string, string> = {
  'image-describe': `🎯 **DLASS Framework — Full Guide**

**1. Describe** — What do you see?
Name the main subjects and their appearance.

> ✅ "In this image, I can see a young woman wearing a red jacket."
> ❌ "There is a person." (too vague)

Useful starters:
- "This image shows..."
- "In the foreground/background, there is..."
- "The main focus of this picture is..."

**2. Location** — Where are things?
Describe spatial relationships and setting.

> ✅ "She is standing on a wooden bridge overlooking a river."
> ❌ "She is outside." (not specific enough)

Position words:
- in the foreground / background / center
- on the left / right side
- next to / beside / between / behind
- in the top-left corner / along the bottom

**3. Action** — What's happening?
Use present continuous tense to describe ongoing actions.

> ✅ "The children are playing with a ball while their parents are watching from a bench."
> ❌ "Children play." (wrong tense, too brief)

Grammar pattern: subject + is/are + verb-ing
- "A man is walking his dog along the path."
- "Two people are sitting at a table, having coffee."

**4. Speculate** — Why or what might happen?
Make inferences using modal verbs.

> ✅ "Based on the warm lighting and decorations, this might be a holiday celebration."
> ❌ "It's Christmas." (stating as fact without evidence)

Speculation language:
- "It looks like... / It seems as though..."
- "This might be... / This could be..."
- "Perhaps... / I would guess that..."
- "Judging by..., it's likely that..."

**5. Share** — Your personal reaction
Connect the image to your own experience or opinion.

> ✅ "This scene reminds me of weekend mornings at my local café. I find it very peaceful."
> ❌ "Nice picture." (too shallow)

Reaction starters:
- "This reminds me of..."
- "I find this image [adjective] because..."
- "If I were in this scene, I would..."
- "What strikes me most is..."

**Common mistakes to avoid:**
- Listing items without connecting them ("There is a tree. There is a car. There is a man.")
  → Instead, link ideas: "A man is leaning against his car, parked beneath a large tree."
- Forgetting to speculate or share — these steps show critical thinking
- Using only simple vocabulary — push yourself to use adjectives and adverbs`,

  'pro-con-debate': `🎯 **PEE Framework — Full Guide**

**1. Point** — State your position
Open with a clear, direct stance on the topic.

FOR side:
> ✅ "I strongly believe that remote work should become the standard for office jobs."
> ❌ "Remote work is kind of good I guess." (weak, uncertain)

AGAINST side:
> ✅ "Despite its advantages, I would argue that remote work creates more problems than it solves."
> ❌ "Remote work is bad." (too blunt, no nuance)

Strong opinion starters:
- "I firmly believe that..."
- "There is a strong case for/against..."
- "From my perspective, the advantages of... clearly outweigh..."
- "While I understand the appeal of..., I would argue that..."

**2. Evidence** — Support with proof
Give concrete facts, statistics, examples, or expert opinions.

> ✅ "A Stanford study found that remote workers were 13% more productive than their office counterparts."
> ✅ "For instance, many tech companies like GitLab have operated fully remote since their founding."
> ❌ "Everyone knows remote work is better." (no actual evidence)

Evidence types:
- Statistics: "Research shows that... / According to a study by..."
- Examples: "For instance... / A clear example of this is..."
- Expert opinion: "As [expert] pointed out..."
- Personal experience: "In my own experience working remotely..."
- Comparison: "Compared to traditional offices, remote work..."

**3. Explain** — Connect evidence to your point
Show WHY your evidence supports your argument. This is where most people fall short.

> ✅ "This statistic is significant because it demonstrates that the flexibility of remote work directly translates to measurable output gains, challenging the assumption that physical supervision is necessary."
> ❌ "So that's why it's good." (doesn't actually explain anything)

Explanation connectors:
- "This is significant because..."
- "This demonstrates that..."
- "What this means in practice is..."
- "The implication of this is..."
- "This directly supports the idea that..."

**Switching sides — Transition phrases:**
When moving from FOR to AGAINST (Stage 2):
- "Having considered the benefits, let me now examine the drawbacks."
- "On the other hand, there are compelling reasons to oppose this."
- "However, looking at the other side of this issue..."

**Common mistakes to avoid:**
- Giving opinion without evidence ("I think X is true because I feel it is")
- Evidence without explanation (stating a fact but not connecting it to your argument)
- Being one-sided — even when arguing FOR, briefly acknowledge the other side to show nuance
- Repeating the same point in different words instead of adding new evidence`,

  'random-question': `🎯 **PREP Framework — Full Guide**

**1. Point** — Answer directly
Don't ramble into the answer. State your position in the first sentence.

> ✅ "I believe the most important skill in today's world is adaptability."
> ❌ "Well, that's an interesting question. I think there are many skills that are important, and it really depends on the situation, but if I had to choose..." (too much hedging)

Direct openers:
- "I believe / I think / In my opinion..."
- "Without a doubt, I would say..."
- "The way I see it..."
- "If I had to choose, I'd say..."

**2. Reason** — Explain why
Give one or two clear reasons. Don't try to list five — depth beats breadth.

> ✅ "The main reason is that technology and industries change so rapidly that specific skills can become obsolete within a few years."
> ❌ "Because it's important." (not a real reason)

Reason connectors:
- "The main reason is that..."
- "I say this because..."
- "This is primarily because..."
- "What makes this so important is..."

**3. Example** — Make it concrete
The example is what makes your answer memorable and convincing. Be specific.

> ✅ "For example, my friend studied print journalism in university, but by graduation, most newspapers had shifted online. Because she was adaptable, she quickly learned digital media skills and now leads a successful content team."
> ❌ "For example, many people have to adapt." (too vague to be useful)

Example patterns:
- Personal: "In my own experience... / When I was..."
- Someone you know: "A friend of mine... / My colleague once..."
- Well-known: "Take Steve Jobs, for instance... / A good example is..."
- Hypothetical: "Imagine a situation where..."

**4. Point** — Wrap up
Restate your main point, ideally adding a final thought or broader perspective.

> ✅ "So that's why I firmly believe adaptability is the most crucial skill — in a world that never stops changing, the ability to learn and pivot is what separates those who thrive from those who get left behind."
> ❌ "So yeah, that's my answer." (weak ending)

Closing phrases:
- "That's why I believe..."
- "All things considered..."
- "In short... / To sum up..."
- "This is exactly why I feel that..."

**Common mistakes to avoid:**
- Answering a different question than what was asked — listen carefully
- Spending too long on the reason and running out of time for the example
- Giving a generic example that could apply to anything
- Forgetting to circle back — the final P ties everything together
- Filler words: "um, like, you know" — pause silently instead`,

  'summarize': `🎯 **MKCO Framework — Full Guide**

**1. Main Idea** — One sentence overview
Capture the central topic or argument of the passage.

> ✅ "This passage discusses how urban green spaces contribute to both mental health and biodiversity in modern cities."
> ❌ "This passage is about cities and nature." (too vague)
> ❌ "This passage talks about how parks are nice and people should go to them more." (adds opinion)

Main idea starters:
- "This passage discusses / examines / explores..."
- "The central argument of this passage is..."
- "The author focuses on..."
- "The main point is that..."

**2. Key Points** — 2-3 essential details
Select the most important supporting ideas. You don't need to cover everything.

> ✅ "The author highlights three key benefits: first, that access to parks reduces stress hormones by up to 20%; second, that native plant gardens support pollinator populations; and third, that green corridors connect fragmented habitats."
> ❌ "The passage mentions parks, stress, plants, bees, corridors, funding, city planning, and community programs." (listing everything instead of selecting key points)

Selecting key points:
- Ask: "If I could only keep 2-3 ideas, which ones?"
- Focus on: main argument, strongest evidence, most surprising finding
- Skip: minor details, repeated information, tangential examples

Sequencing language:
- "First... Second... Finally..."
- "The author begins by... then explains... and concludes with..."
- "One key point is... Another important finding is..."

**3. Connect** — Show relationships
Explain how the key points relate to each other and the main idea.

> ✅ "These points together suggest that urban green spaces serve a dual purpose — they are not only beneficial for human wellbeing but also essential for maintaining ecological balance within cities."
> ❌ (Skipping this step entirely — just listing disconnected facts)

Connection language:
- "These points together suggest..."
- "This connects to the main idea because..."
- "The relationship between X and Y shows that..."
- "What ties these ideas together is..."
- "As a result... / Consequently... / This leads to..."

**4. Own Words** — Rephrase everything
The most critical rule of summarizing: never quote the original. Prove you understood it.

> ✅ Original: "Metropolitan green infrastructure yields measurable psychophysiological benefits"
>    Your words: "City parks and gardens have real, measurable positive effects on both our minds and bodies."
> ❌ Repeating: "Metropolitan green infrastructure yields psychophysiological benefits." (just copying)

Paraphrasing strategies:
- Change the sentence structure (active ↔ passive)
- Use synonyms (but keep technical terms if needed)
- Combine or split sentences
- Change the order of information

**Common mistakes to avoid:**
- Adding your own opinion ("I think this is very important") — summaries are objective
- Including too many details — summarizing means selecting, not compressing everything
- Following the exact same order as the original — reorganize to show understanding
- Using the same vocabulary as the passage — push yourself to rephrase
- Starting with "The passage says..." for every sentence — vary your language`,

  'shadowing': `🎯 **Read Aloud — Full Guide**

**1. Listen Before You Speak**
Always play the audio at least once before recording.
- First listen: Focus on overall rhythm and melody
- Second listen: Notice which words are stressed
- Third listen (optional): Pay attention to difficult sounds

**2. Pronunciation Priorities**
Focus on sounds that are commonly difficult:

**th /θ/ and /ð/:**
- "think" — tongue between teeth, blow air (voiceless)
- "this" — tongue between teeth, vibrate (voiced)
- Common error: replacing with /s/ or /z/ → "sink" instead of "think"

**r /ɹ/:**
- Tongue curls back, doesn't touch the roof of mouth
- Practice: "red", "right", "world", "girl"
- Common error: replacing with /l/ or tapping like Spanish r

**l /l/ (light vs dark):**
- Light L (before vowels): "light", "love" — tongue tip touches ridge behind top teeth
- Dark L (end of words): "all", "feel" — tongue tip up, back of tongue rises
- Common error: dropping the dark L → "fee" instead of "feel"

**v /v/ vs b /b/:**
- v: top teeth touch lower lip, vibrate
- b: both lips together, then release
- Practice pairs: "very/berry", "vest/best", "vine/wine"

**3. Word Stress**
English is a stress-timed language. Getting stress wrong changes meaning.

- PHOtograph → phoTOGraphy → photoGRAPHic
- reCORD (verb) → REcord (noun)
- Content words (nouns, verbs, adjectives) = STRESSED
- Function words (a, the, is, to, and) = unstressed, reduced

Practice: "I NEED to GO to the STORE to BUY some BREAD."
Not: "I need to go to the store to buy some bread." (flat, robotic)

**4. Connected Speech**
Native speakers don't pronounce each word separately.

Linking patterns:
- Consonant → Vowel: "an apple" → "a·napple"
- Same consonant: "black coat" → "bla·coat" (one /k/)
- /t/ + /j/: "meet you" → "mee·chu"
- /d/ + /j/: "did you" → "di·ju"

Reductions:
- "going to" → "gonna" (informal)
- "want to" → "wanna" (informal)
- "him" → "'im", "her" → "'er" (in fast speech)
- Note: For this exercise, pronounce clearly. Learn reductions for listening comprehension.

**5. Intonation Patterns**
Your pitch should rise and fall naturally.

- Statements: pitch falls at the end ↘
  "I went to the store." ↘
- Yes/no questions: pitch rises ↗
  "Did you go to the store?" ↗
- Lists: rise on each item, fall on last ↗↗↘
  "I bought apples ↗, bananas ↗, and oranges ↘."
- Emphasis: pitch jumps up on the important word
  "I didn't say HE stole it." (someone else said it)
  "I didn't say he STOLE it." (he just borrowed it)

**6. Pacing and Pausing**
- Commas = short pause (0.3 sec)
- Periods = longer pause (0.5-0.7 sec)
- Paragraph breaks = full breath
- Don't rush through — a steady 130-150 WPM is ideal for clarity
- If you stumble, pause and restart the sentence calmly

**Common mistakes to avoid:**
- Reading word by word like a robot — practice chunking phrases together
- Ignoring punctuation — pauses give your listener time to process
- Speaking too fast to "get it over with" — slow and clear beats fast and mumbled
- Flat intonation — exaggerate your pitch at first, then dial it back`,
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
  cheatSheets: Record<string, string>
  darkMode: boolean
  currentModeId: string
  modePrompts: Record<string, string>
  thinkTime: number
  azureTtsVoice: string
  unsplashTopic: string

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
  setCheatSheet: (modeId: string, text: string) => void
  resetCheatSheet: (modeId: string) => void
  resetAllCheatSheets: () => void
  setDarkMode: (v: boolean) => void
  setCurrentModeId: (id: string) => void
  setModePrompt: (modeId: string, prompt: string) => void
  resetModePrompt: (modeId: string) => void
  setThinkTime: (t: number) => void
  setAzureTtsVoice: (v: string) => void
  setUnsplashTopic: (topic: string) => void
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
      cheatSheets: {},
      darkMode: false,
      currentModeId: 'image-describe',
      modePrompts: {},
      thinkTime: 5,
      azureTtsVoice: 'en-US-JennyNeural',
      unsplashTopic: 'landscape',
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
      setCheatSheet: (modeId, text) =>
        set((state) => ({ cheatSheets: { ...state.cheatSheets, [modeId]: text } })),
      resetCheatSheet: (modeId) =>
        set((state) => {
          const { [modeId]: _, ...rest } = state.cheatSheets
          return { cheatSheets: rest }
        }),
      resetAllCheatSheets: () => set({ cheatSheets: {} }),
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
      setUnsplashTopic: (topic) => set({ unsplashTopic: topic }),
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
      version: 6,
      migrate: (persisted: unknown) => {
        // always reset systemPrompt to current default on version bump
        // preserve existing cheatSheets/speakingGuides custom overrides
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
        cheatSheets: state.cheatSheets,
        darkMode: state.darkMode,
        currentModeId: state.currentModeId,
        modePrompts: state.modePrompts,
        thinkTime: state.thinkTime,
        azureTtsVoice: state.azureTtsVoice,
        unsplashTopic: state.unsplashTopic,
      }),
    }
  )
)

export { DEFAULT_SYSTEM_PROMPT, DEFAULT_SPEAKING_GUIDES, DEFAULT_CHEAT_SHEETS }
