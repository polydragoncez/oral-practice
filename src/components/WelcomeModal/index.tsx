import { useState, useEffect } from 'react'

const WELCOME_KEY = 'hasSeenWelcome'

export function WelcomeModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(WELCOME_KEY)) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem(WELCOME_KEY, 'true')
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center">
          Welcome to Oral Speak Practice Feedback! 👋
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          Practice English speaking with AI-powered feedback.
        </p>

        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            🔒 Your Privacy
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside flex flex-col gap-1">
            <li>All your data (recordings, transcripts, history) is stored locally in your browser</li>
            <li>Nothing is saved on any server — clear your browser data and it's gone</li>
            <li>No account needed, no tracking, no ads</li>
          </ul>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            🤖 AI Analysis
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            When you use AI feedback, your data is sent to the AI provider you choose:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside flex flex-col gap-1">
            <li><strong>Google Gemini</strong> — transcript + image (if applicable)</li>
            <li><strong>Anthropic Claude</strong> — transcript + image (if applicable)</li>
            <li><strong>OpenAI</strong> — transcript + image (if applicable)</li>
            <li><strong>Azure Speech</strong> — audio recording (for pronunciation assessment only)</li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Only the data needed for analysis is sent. No data is stored by us.
            You choose which provider to use in Settings.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            API keys are stored in your browser's localStorage and sent only to their respective provider.
          </p>
        </div>

        <button
          onClick={dismiss}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
        >
          Got it, let's start!
        </button>
      </div>
    </div>
  )
}
