import { useState } from 'react'
import { useSettingsStore, DEFAULT_SPEAKING_GUIDES } from '../../stores/settingsStore'
import type { STTEngine, TTSEngine, AIProvider, GeminiModel } from '../../stores/settingsStore'
import { ALL_MODES, getModeById } from '../../modes'
import { AZURE_TTS_VOICES } from '../../services/azureSpeech'

function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  const isSet = value.trim().length > 0

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isSet
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}
        >
          {isSet ? '✓ Set' : 'Not set'}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={() => setShow((v) => !v)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors"
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  )
}

export function Settings() {
  const store = useSettingsStore()
  const [selectedModeId, setSelectedModeId] = useState<string>(ALL_MODES[0]?.id ?? '')

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  const selectedMode = getModeById(selectedModeId)
  const currentModePrompt = store.modePrompts[selectedModeId] ?? ''
  const effectivePrompt = currentModePrompt || selectedMode.systemPromptTemplate || store.systemPrompt

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Settings</h2>

      {/* API Keys */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          API Keys
        </h3>
        <ApiKeyInput
          label="Anthropic API Key"
          value={store.anthropicKey}
          onChange={store.setAnthropicKey}
          placeholder="sk-ant-..."
        />
        <ApiKeyInput
          label="OpenAI API Key"
          value={store.openaiKey}
          onChange={store.setOpenaiKey}
          placeholder="sk-..."
        />
        <ApiKeyInput
          label="Unsplash Access Key"
          value={store.unsplashKey}
          onChange={store.setUnsplashKey}
          placeholder="Your Unsplash access key"
        />
        <div className="flex flex-col gap-1">
          <ApiKeyInput
            label="Gemini API Key"
            value={store.geminiKey}
            onChange={store.setGeminiKey}
            placeholder="AIza..."
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Free quota, no credit card required.{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-500 hover:underline"
            >
              Get a key at aistudio.google.com/apikey
            </a>
          </p>
        </div>
      </section>

      {/* Azure Speech */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Azure Speech (Pronunciation Assessment + TTS)
        </h3>
        <ApiKeyInput
          label="Azure Speech Key"
          value={store.azureSpeechKey}
          onChange={store.setAzureSpeechKey}
          placeholder="Your Azure Speech resource key"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Azure Region
          </label>
          <input
            type="text"
            value={store.azureSpeechRegion}
            onChange={(e) => store.setAzureSpeechRegion(e.target.value.trim())}
            placeholder="eastus"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Azure TTS Voice
          </label>
          <select
            value={store.azureTtsVoice}
            onChange={(e) => store.setAzureTtsVoice(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            {AZURE_TTS_VOICES.map((v) => (
              <option key={v.name} value={v.name}>{v.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Free tier: 5 hours/month, no credit card required.{' '}
          <a
            href="https://portal.azure.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            Create a Speech resource at portal.azure.com
          </a>{' '}
          to get your key. When set, pronunciation scores appear automatically after each recording,
          and Azure TTS buttons appear on model response cards.
        </p>
      </section>

      {/* Engines */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Engines
        </h3>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Speech-to-Text
          </label>
          <select
            value={store.sttEngine}
            onChange={(e) => store.setSttEngine(e.target.value as STTEngine)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="webSpeech">Browser Web Speech API (free)</option>
            <option value="whisper">OpenAI Whisper (requires OpenAI key)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Text-to-Speech
          </label>
          <select
            value={store.ttsEngine}
            onChange={(e) => store.setTtsEngine(e.target.value as TTSEngine)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="browser">Browser TTS (free)</option>
            <option value="azure">Azure Neural TTS (requires Azure key, high quality)</option>
            <option value="openai">OpenAI TTS (requires OpenAI key)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Provider
          </label>
          <select
            value={store.aiProvider}
            onChange={(e) => store.setAiProvider(e.target.value as AIProvider)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="claude">Anthropic Claude</option>
            <option value="openai">OpenAI GPT-4o-mini</option>
            <option value="gemini">Google Gemini (free tier available)</option>
          </select>
        </div>

        {store.aiProvider === 'gemini' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Gemini Model
            </label>
            <select
              value={store.geminiModel}
              onChange={(e) => store.setGeminiModel(e.target.value as GeminiModel)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash — fast, free tier</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro — most capable</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash — previous gen</option>
            </select>
          </div>
        )}
      </section>

      {/* Daily Practice Goal */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Daily Practice Goal
        </h3>
        <label className="text-sm text-gray-700 dark:text-gray-300">
          {store.dailyGoal} min
        </label>
        <input
          type="range"
          min={1}
          max={60}
          step={1}
          value={store.dailyGoal}
          onChange={(e) => store.setDailyGoal(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1 min</span>
          <span>60 min</span>
        </div>
      </section>

      {/* Default Duration */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Default Duration
        </h3>
        <label className="text-sm text-gray-700 dark:text-gray-300">
          {formatTime(store.defaultDuration)}
        </label>
        <input
          type="range"
          min={10}
          max={300}
          step={10}
          value={store.defaultDuration}
          onChange={(e) => store.setDefaultDuration(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>10s</span>
          <span>5m</span>
        </div>
      </section>

      {/* Think Time (Random Question) */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Think Time (Random Question)
        </h3>
        <label className="text-sm text-gray-700 dark:text-gray-300">
          {store.thinkTime}s
        </label>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={store.thinkTime}
          onChange={(e) => store.setThinkTime(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0s (off)</span>
          <span>30s</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Time to think before recording in Random Question mode. Set to 0 to disable.
        </p>
      </section>

      {/* System Prompt */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            AI System Prompt (Global Default)
          </h3>
          <button
            onClick={store.resetSystemPrompt}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
          >
            Reset to default
          </button>
        </div>
        <textarea
          value={store.systemPrompt}
          onChange={(e) => store.setSystemPrompt(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-y outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
        />
      </section>

      {/* Per-Mode Prompts */}
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Per-Mode AI Prompts
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Override the system prompt for a specific mode. Leave empty to use the mode's default prompt (or the global prompt if the mode has none).
        </p>

        <div className="flex gap-2 flex-wrap">
          {ALL_MODES.filter((m) => m.enabled).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedModeId(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedModeId === mode.id
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedMode.icon} {selectedMode.name}
            {currentModePrompt ? (
              <span className="ml-2 text-xs text-green-500">(custom)</span>
            ) : selectedMode.systemPromptTemplate ? (
              <span className="ml-2 text-xs text-gray-400">(mode default)</span>
            ) : (
              <span className="ml-2 text-xs text-gray-400">(global prompt)</span>
            )}
          </span>
          <button
            onClick={() => store.resetModePrompt(selectedModeId)}
            disabled={!currentModePrompt}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors disabled:opacity-50"
          >
            Reset to default
          </button>
        </div>

        <textarea
          value={currentModePrompt}
          onChange={(e) => store.setModePrompt(selectedModeId, e.target.value)}
          placeholder={effectivePrompt}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-y outline-none focus:ring-2 focus:ring-indigo-400 font-mono placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
      </section>

      {/* Per-Mode Speaking Guides */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Speaking Guides (Per-Mode)
          </h3>
          <button
            onClick={store.resetAllSpeakingGuides}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
          >
            Reset all to default
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Each mode has its own speaking guide shown as a collapsible panel on the Practice page. Supports Markdown.
        </p>

        <div className="flex gap-2 flex-wrap">
          {ALL_MODES.filter((m) => m.enabled).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedModeId(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedModeId === mode.id
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-amber-400'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.name}</span>
            </button>
          ))}
        </div>

        {(() => {
          const customGuide = store.speakingGuides[selectedModeId] ?? ''
          const defaultGuide = DEFAULT_SPEAKING_GUIDES[selectedModeId] ?? ''
          const effectiveGuide = customGuide || defaultGuide
          return (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMode.icon} {selectedMode.name}
                  {customGuide ? (
                    <span className="ml-2 text-xs text-green-500">(custom)</span>
                  ) : (
                    <span className="ml-2 text-xs text-gray-400">(default)</span>
                  )}
                </span>
                <button
                  onClick={() => store.resetSpeakingGuide(selectedModeId)}
                  disabled={!customGuide}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors disabled:opacity-50"
                >
                  Reset to default
                </button>
              </div>

              <textarea
                value={customGuide}
                onChange={(e) => store.setSpeakingGuide(selectedModeId, e.target.value)}
                placeholder={effectiveGuide}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-y outline-none focus:ring-2 focus:ring-amber-400 font-mono placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </>
          )
        })()}
      </section>

      {/* Dark Mode */}
      <section className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Dark Mode
        </h3>
        <button
          onClick={() => store.setDarkMode(!store.darkMode)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            store.darkMode ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              store.darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {store.darkMode ? '🌙 Dark' : '☀️ Light'}
        </span>
      </section>

      {/* Privacy & Data */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          🔒 Privacy & Data
        </h3>

        {/* Data Storage */}
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Storage</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All your practice data is stored locally in your browser using IndexedDB and localStorage.
            This includes: recordings, transcripts, AI feedback, practice history, settings, and API keys.
            No data is sent to or stored on any server.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ Clearing your browser data will permanently delete all your practice history.
          </p>
        </div>

        {/* AI Provider Data Usage */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Provider Data Usage</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            When you request AI feedback, the following data is sent to your selected AI provider:
          </p>

          {/* Responsive table: cards on mobile, table on desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Provider</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Data Sent</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">Google Gemini</td>
                  <td className="px-3 py-2">Transcript, image (base64), WPM, prompt</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">Anthropic Claude</td>
                  <td className="px-3 py-2">Transcript, image (base64), WPM, prompt</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">OpenAI GPT</td>
                  <td className="px-3 py-2">Transcript, image (base64), WPM, prompt</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">OpenAI Whisper</td>
                  <td className="px-3 py-2">Audio recording (for transcription)</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">OpenAI TTS</td>
                  <td className="px-3 py-2">Text (for speech synthesis)</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">Azure Speech</td>
                  <td className="px-3 py-2">Audio recording (for pronunciation score)</td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2 font-medium">Unsplash</td>
                  <td className="px-3 py-2">Search queries only</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="sm:hidden flex flex-col gap-2">
            {[
              ['Google Gemini', 'Transcript, image (base64), WPM, prompt'],
              ['Anthropic Claude', 'Transcript, image (base64), WPM, prompt'],
              ['OpenAI GPT', 'Transcript, image (base64), WPM, prompt'],
              ['OpenAI Whisper', 'Audio recording (for transcription)'],
              ['OpenAI TTS', 'Text (for speech synthesis)'],
              ['Azure Speech', 'Audio recording (for pronunciation score)'],
              ['Unsplash', 'Search queries only'],
            ].map(([provider, data]) => (
              <div key={provider} className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{provider}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy policies */}
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

        {/* API Keys note */}
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">API Keys</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your API keys are stored in localStorage and sent only to their respective provider. They are never sent anywhere else.
          </p>
        </div>

        {/* Clear All Data */}
        <button
          onClick={async () => {
            if (!confirm('This will delete ALL your data including practice history, settings, and API keys. This cannot be undone. Are you sure?')) return
            localStorage.clear()
            try { indexedDB.deleteDatabase('oral-practice') } catch {}
            window.location.reload()
          }}
          className="self-start px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Clear All Data
        </button>
      </section>
    </div>
  )
}
