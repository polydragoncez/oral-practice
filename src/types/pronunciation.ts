export interface WordProsodyFeedback {
  breakErrors?: string[]       // e.g. ['UnexpectedBreak', 'MissingBreak']
  intonationErrors?: string[]  // e.g. ['Monotone']
}

export interface WordResult {
  word: string
  accuracyScore: number
  errorType: string            // None | Omission | Insertion | Mispronunciation
  prosodyFeedback?: WordProsodyFeedback
}

export interface PronunciationResult {
  accuracyScore: number
  fluencyScore: number
  completenessScore: number
  prosodyScore: number
  pronunciationScore: number
  words: WordResult[]
}
