import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSettingsStore, DEFAULT_SPEAKING_GUIDES, DEFAULT_CHEAT_SHEETS } from '../../stores/settingsStore'

type TabId = 'cheat' | 'guide'

interface SpeakingGuideProps {
  modeId: string
}

export function SpeakingGuide({ modeId }: SpeakingGuideProps) {
  const [activeTab, setActiveTab] = useState<TabId>('cheat')
  const [open, setOpen] = useState(false)

  const customCheat = useSettingsStore((s) => s.cheatSheets[modeId])
  const customGuide = useSettingsStore((s) => s.speakingGuides[modeId])

  const cheat = customCheat || DEFAULT_CHEAT_SHEETS[modeId] || ''
  const guide = customGuide || DEFAULT_SPEAKING_GUIDES[modeId] || ''

  if (!cheat && !guide) return null

  const content = activeTab === 'cheat' ? cheat : guide

  const handleTabClick = (tab: TabId) => {
    if (open && activeTab === tab) {
      setOpen(false)
    } else {
      setActiveTab(tab)
      setOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <button
          onClick={() => handleTabClick('cheat')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            open && activeTab === 'cheat'
              ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}
        >
          <span>📋</span>
          <span className="font-medium">Cheat Sheet</span>
          {open && activeTab === 'cheat' && <span className="text-xs opacity-70">▲</span>}
        </button>
        <button
          onClick={() => handleTabClick('guide')}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            open && activeTab === 'guide'
              ? 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}
        >
          <span>📖</span>
          <span className="font-medium">Speaking Guide</span>
          {open && activeTab === 'guide' && <span className="text-xs opacity-70">▲</span>}
        </button>
      </div>

      {open && content && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-blockquote:border-amber-400 prose-blockquote:text-amber-800 dark:prose-blockquote:text-amber-300 prose-blockquote:bg-amber-100/50 dark:prose-blockquote:bg-amber-900/20 prose-blockquote:rounded prose-blockquote:not-italic prose-blockquote:py-0.5 prose-blockquote:px-3">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
