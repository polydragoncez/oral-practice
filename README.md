# Oral Speak Practice Feedback

An all-in-one English speaking practice web app with 5 practice modes — describe images, answer questions, debate topics, summarize passages, or read aloud — then get AI-powered feedback on your grammar, vocabulary, fluency, and pronunciation.

## Live Demo

**[speakenglish.cc](https://speakenglish.cc/)**

Try it right now — no sign-up required. The site is hosted on Cloudflare Pages as a purely static site with no backend server. You can safely enter your own API keys in Settings; they are stored only in your browser's localStorage and sent directly to the respective provider. Nothing is stored on or passes through our server.

## Features

### Practice Modes
- 📸 **Image Description** — Describe random images with structured guidance (DLASS framework)
- ⚖️ **Pro/Con Debate** — Argue both sides of a topic to build argumentation skills (PEE framework)
- ❓ **Random Question** — Answer spontaneous questions across various topics and difficulty levels (PREP framework)
- 📝 **Summarize** — Read a passage, then summarize it in your own words (MKCO framework)
- 🗣️ **Read Aloud** — Listen to a text, then read it aloud with word-by-word pronunciation scoring and phoneme-level analysis

### Core Features
- 🎙️ **Recording** — Built-in recorder with waveform visualization and countdown timer
- 📊 **Speech Analysis** — Real-time speech-to-text with WPM (words per minute) tracking
- 🤖 **AI Feedback** — Get detailed corrections and suggestions from Claude, GPT, or Gemini
- 🔊 **Model Answers** — AI generates improved versions and reads them aloud via TTS (Browser, Azure Neural, or OpenAI)
- 🎯 **Pronunciation Assessment** — Azure Speech integration for prosody, rhythm, stress, and per-word accuracy scoring
- 🗣️ **Cross-Mode Practice** — Jump from any AI feedback directly to Read Aloud mode to practice corrected sentences
- 📅 **Practice History** — All sessions saved locally with full playback and mode-specific metadata
- 📈 **Stats Dashboard** — Track daily streaks, total practice time, and sessions per mode
- 📱 **PWA** — Install as an app on mobile or desktop
- 🌙 **Dark Mode** — Easy on the eyes

### Azure Speech — Highly Recommended

> **We strongly recommend adding an Azure Speech key for the best experience.** Azure Speech unlocks:
> - **Pronunciation scoring** — Automatic accuracy, fluency, completeness, and prosody scores after every recording
> - **Word-by-word analysis** — See exactly which words need improvement with color-coded feedback
> - **Phoneme-level detail** — In Read Aloud mode, drill down to individual sound accuracy
> - **Neural TTS voices** — High-quality, natural-sounding voice playback for model answers with 7 voice options
>
> Azure offers a **free tier (5 hours/month, no credit card required)**. [Create a Speech resource at portal.azure.com](https://portal.azure.com) → search "Speech" → create a resource → copy the key and region into Settings.

## Privacy

- All data (recordings, transcripts, history) is stored **locally in your browser**
- No account needed, no tracking, no ads
- API keys are stored in localStorage and sent **only** to their respective provider
- See the in-app About & Privacy page for full details

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand (state management)
- IndexedDB via idb (local storage)
- Web Speech API (speech recognition + TTS)
- PWA (service worker + manifest)

## Getting Started

### Prerequisites
- Node.js 18+
- A modern browser (Chrome recommended for best Web Speech API support)

### Installation
```bash
git clone https://github.com/polydragoncez/oral-practice.git
cd oral-practice
npm install
npm run dev
```

Open http://localhost:5173 in Chrome.

### API Keys

The app works with free browser APIs out of the box (Web Speech API for transcription, browser TTS for audio).

For AI-powered feedback, add one or more API keys in the **Settings** page:

| Provider | What it does | Free tier | Get a key |
|----------|-------------|-----------|-----------|
| Google Gemini | AI feedback (recommended) | 250 req/day, no credit card | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Anthropic Claude | AI feedback | Paid only | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI | AI feedback + Whisper STT + TTS | Paid only | [platform.openai.com](https://platform.openai.com) |
| Unsplash | Image search | 50 req/hr | [unsplash.com/developers](https://unsplash.com/developers) |
| **Azure Speech** | **Pronunciation scoring + Neural TTS (highly recommended)** | **5 hrs/month free** | [portal.azure.com](https://portal.azure.com) |

All keys are stored in your browser's localStorage — never sent to any server except the respective API provider.

## Deployment

### Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy dist --project-name your-project-name
```

Or connect your GitHub repo in the Cloudflare Pages dashboard:
- Build command: `npm run build`
- Output directory: `dist`

### Other static hosts
Any static hosting works (Vercel, Netlify, GitHub Pages). Just deploy the `dist/` folder after `npm run build`.

No server required — all API calls go directly from the browser to the respective APIs.

## Project Structure

```
src/
├── components/             # UI components
│   ├── ImageViewer/        # Image display, search, upload
│   ├── Recorder/           # Recording with waveform
│   ├── Transcript/         # Speech-to-text display
│   ├── AIFeedback/         # AI response + Model Answer TTS
│   ├── SpeakingGuide/      # Per-mode speaking framework guides
│   ├── DebateFlow/         # Pro/Con debate lifecycle
│   ├── QuestionPrompt/     # Random question display + filters
│   ├── PassagePrompt/      # Summarize passage display
│   ├── ShadowingPrompt/    # Read Aloud text input + TTS preview
│   ├── ShadowingResult/    # Word-by-word pronunciation results
│   ├── PronunciationScore/ # Azure pronunciation score gauges
│   ├── InstallPrompt/      # PWA install banner
│   ├── UpdatePrompt/       # Service worker update notification
│   ├── WelcomeModal/       # First-visit onboarding
│   ├── About/              # About & Privacy page
│   ├── History/            # Past sessions with mode badges
│   ├── Stats/              # Practice statistics & streaks
│   └── Settings/           # API keys, engines, prompts, privacy
├── modes/                  # Practice mode definitions
│   ├── imageDescribe.ts
│   ├── proConDebate.ts
│   ├── randomQuestion.ts
│   ├── summarize.ts
│   └── shadowing.ts
├── data/                   # Built-in content
│   ├── debateTopics.ts     # 32 debate topics
│   ├── questions.ts        # 52 random questions
│   └── passages.ts         # 22 reading passages
├── hooks/                  # Custom React hooks
│   ├── useRecorder.ts      # MediaRecorder + waveform analyser
│   ├── useSpeechRecognition.ts  # Web Speech API wrapper
│   ├── useAIFeedback.ts    # AI service orchestration
│   ├── useAzurePronunciation.ts # Azure pronunciation assessment
│   └── useTTS.ts           # Multi-engine TTS (Browser/Azure/OpenAI)
├── services/               # API integrations
│   ├── claude.ts           # Anthropic Claude API
│   ├── openai.ts           # OpenAI (chat, Whisper, TTS)
│   ├── gemini.ts           # Google Gemini API
│   ├── azureSpeech.ts      # Azure pronunciation + Neural TTS
│   └── db.ts               # IndexedDB via idb
├── stores/                 # Zustand state
│   └── settingsStore.ts    # All settings + session state
├── types/                  # TypeScript types
└── utils/                  # Shared utilities
```

## Contributing

Contributions welcome! Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

Some ideas for contributions:
- New practice modes or question/topic data
- UI/UX improvements
- Bug fixes
- Translations / i18n support

## License

MIT
