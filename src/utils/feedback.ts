export interface ModelResponses {
  corrected: string | null
  reference: string | null
}

/** Extract dual Model Responses (Corrected + Reference) from AI feedback markdown. */
export function extractModelResponses(feedback: string): ModelResponses {
  const corrected = extractSection(feedback, 'Corrected Version')
  const reference = extractSection(feedback, 'Reference Version')

  // Backward compat: if new format not found, try old single-section format
  if (!corrected && !reference) {
    const legacy = extractLegacyModelDescription(feedback)
    return { corrected: legacy, reference: null }
  }

  return { corrected, reference }
}

function extractSection(feedback: string, label: string): string | null {
  // Match "**N. Model Response - Label**:" or "**Model Response - Label**:"
  const re = new RegExp(
    `\\*\\*(?:\\d+\\.\\s*)?Model Response\\s*[-–—]\\s*${label}\\*\\*:?\\s*\\n?([\\s\\S]*?)(?=\\n{1,2}\\*\\*(?:\\d+\\.\\s*)?Model Response|\\n{1,2}\\*\\*Overall Score\\*\\*|\\n#{1,3}\\s|$)`,
    'i'
  )
  const m = feedback.match(re)
  if (m) {
    const text = m[1].trim()
    if (text) return text
  }

  // Also try heading format: ## Model Response - Label
  const re2 = new RegExp(
    `^#{1,3}\\s*Model Response\\s*[-–—]\\s*${label}[^\\n]*\\n+([\\s\\S]*?)(?=\\n#{1,3}\\s|\\n\\*\\*Overall Score\\*\\*|$)`,
    'im'
  )
  const m2 = feedback.match(re2)
  return m2 ? m2[1].trim() || null : null
}

/** Legacy: extract old single "Model Description/Story/Answer/Argument/Summary" section. */
function extractLegacyModelDescription(feedback: string): string | null {
  const m = feedback.match(
    /\*\*(?:\d+\.\s*)?Model (?:Description|Story|Answer|Argument|Summary)\*\*:?\s*\n?([\s\S]*?)(?=\n{1,2}\*\*Overall Score\*\*|\n{1,2}\*\*\d+\.\s|\n#{1,3}\s|$)/i
  )
  if (m) {
    const text = m[1].trim()
    if (text) return text
  }
  const m2 = feedback.match(
    /^#{1,3}\s*Model (?:Description|Story|Answer|Argument|Summary)[^\n]*\n+([\s\S]*?)(?=\n#{1,3}\s|\n\*\*Overall Score\*\*|$)/im
  )
  return m2 ? m2[1].trim() || null : null
}

/** Extract the label of the Model section for backward compat display */
export function extractModelSectionLabel(feedback: string): string {
  // New format
  if (/Model Response\s*[-–—]\s*Corrected Version/i.test(feedback)) {
    return 'Model Response'
  }
  // Legacy
  const m = feedback.match(/\*\*(?:\d+\.\s*)?Model (Description|Story|Answer|Argument|Summary)\*\*/i)
  return m ? `Model ${m[1]}` : 'Model Description'
}
