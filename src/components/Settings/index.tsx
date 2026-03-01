import { useState } from 'react'
import { useSettingsStore, DEFAULT_SPEAKING_GUIDE } from '../../stores/settingsStore'
import type { STTEngine, TTSEngine, AIProvider, GeminiModel } from '../../stores/settingsStore'
import { ALL_MODES, getModeById } from '../../modes'

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
          to get your key. When set, pronunciation scores appear automatically after each recording.
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

      {/* Speaking Guide Template */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Speaking Guide Template
          </h3>
          <button
            onClick={store.resetSpeakingGuide}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
          >
            Reset to default
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Shown as a collapsible "💡 Speaking Guide" panel on the Practice page. Supports Markdown.
        </p>
        <textarea
          value={store.speakingGuide}
          onChange={(e) => store.setSpeakingGuide(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-y outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Default template:{' '}
          <button
            onClick={() => store.setSpeakingGuide(DEFAULT_SPEAKING_GUIDE)}
            className="text-indigo-500 hover:underline"
          >
            DLASS framework
          </button>
        </p>
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
    </div>
  )
}
