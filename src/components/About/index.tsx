const PROVIDER_DATA = [
  ['Google Gemini', 'Transcript, image (base64), WPM, prompt'],
  ['Anthropic Claude', 'Transcript, image (base64), WPM, prompt'],
  ['OpenAI GPT', 'Transcript, image (base64), WPM, prompt'],
  ['OpenAI Whisper', 'Audio recording (for transcription)'],
  ['OpenAI TTS', 'Text (for speech synthesis)'],
  ['Azure Speech', 'Audio recording (for pronunciation score)'],
  ['Unsplash', 'Search queries only'],
] as const

export function About() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* App Intro */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          🗣 Oral Speak Practice Feedback
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          An all-in-one English speaking practice web app. Look at images, answer questions, debate topics, or summarize passages — then get AI-powered feedback on your grammar, vocabulary, fluency, and pronunciation.
        </p>
      </section>

      {/* Features */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ['📸', 'Image Description', 'Describe random images with the DLASS framework'],
            ['⚖️', 'Pro/Con Debate', 'Argue both sides of a topic to build argumentation skills'],
            ['❓', 'Random Question', 'Answer spontaneous questions across topics and difficulty levels'],
            ['📝', 'Summarize', 'Read a passage, then summarize it in your own words'],
            ['🎙️', 'Recording', 'Built-in recorder with waveform visualization and countdown timer'],
            ['📊', 'Speech Analysis', 'Real-time speech-to-text with WPM tracking'],
            ['🤖', 'AI Feedback', 'Detailed corrections and suggestions from Claude, GPT, or Gemini'],
            ['🔊', 'Model Answers', 'AI-generated improved versions read aloud via TTS'],
            ['🎯', 'Pronunciation', 'Optional Azure Speech integration for prosody and stress analysis'],
            ['📅', 'Practice History', 'All sessions saved locally with full playback'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-2.5 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-lg shrink-0">{icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-white">{title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy & Data */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          🔒 Privacy & Data
        </h3>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Storage</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            All your practice data is stored locally in your browser using IndexedDB and localStorage.
            This includes: recordings, transcripts, AI feedback, practice history, settings, and API keys.
            No data is sent to or stored on any server.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ Clearing your browser data will permanently delete all your practice history.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Provider Data Usage</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            When you request AI feedback, the following data is sent to your selected AI provider:
          </p>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Provider</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Data Sent</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                {PROVIDER_DATA.map(([provider, data]) => (
                  <tr key={provider} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 font-medium">{provider}</td>
                    <td className="px-3 py-2">{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {PROVIDER_DATA.map(([provider, data]) => (
              <div key={provider} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{provider}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each provider's own privacy policy applies to data sent to them:
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Google</a>
            <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Anthropic</a>
            <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">OpenAI</a>
            <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">Microsoft</a>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">API Keys</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your API keys are stored in localStorage and sent only to their respective provider. They are never sent anywhere else.
          </p>
        </div>
      </section>

      {/* Open Source */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Open Source
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This project is open source under the MIT License.
        </p>
        <a
          href="https://github.com/polydragoncez/oral-practice"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 self-start px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
          View on GitHub
        </a>
      </section>

      {/* Tech Stack */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'IndexedDB', 'Web Speech API'].map((tech) => (
            <span key={tech} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
