import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSettingsStore, DEFAULT_SPEAKING_GUIDES } from '../../stores/settingsStore'

interface SpeakingGuideProps {
  modeId: string
}

export function SpeakingGuide({ modeId }: SpeakingGuideProps) {
  const [open, setOpen] = useState(false)
  const customGuide = useSettingsStore((s) => s.speakingGuides[modeId])
  const guide = customGuide || DEFAULT_SPEAKING_GUIDES[modeId] || ''

  if (!guide) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 self-start text-sm px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 transition-colors"
      >
        <span>💡</span>
        <span className="font-medium">Speaking Guide</span>
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="prose prose-sm dark:prose-invert max-w-none prose-blockquote:border-amber-400 prose-blockquote:text-amber-800 dark:prose-blockquote:text-amber-300 prose-blockquote:bg-amber-100/50 dark:prose-blockquote:bg-amber-900/20 prose-blockquote:rounded prose-blockquote:not-italic prose-blockquote:py-0.5 prose-blockquote:px-3">
            <ReactMarkdown>{guide}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
