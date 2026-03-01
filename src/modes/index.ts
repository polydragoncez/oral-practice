import type { PracticeMode } from '../types/practiceMode'
import { imageDescribeMode } from './imageDescribe'
import { proConDebateMode } from './proConDebate'
import { randomQuestionMode } from './randomQuestion'
import { summarizeMode } from './summarize'
import { shadowingMode } from './shadowing'

export const ALL_MODES: PracticeMode[] = [
  imageDescribeMode,
  proConDebateMode,
  randomQuestionMode,
  summarizeMode,
  shadowingMode,
]

export function getModeById(id: string): PracticeMode {
  return ALL_MODES.find((m) => m.id === id && m.enabled) ?? imageDescribeMode
}
