/** Extract the "Model Description/Story/Answer/Argument/Summary" section from AI feedback markdown. */
export function extractModelDescription(feedback: string): string | null {
  // Matches "**6. Model Description**:" or "**Model Summary**:" etc.
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

/** Extract the label of the Model section (e.g. "Model Description", "Model Summary") */
export function extractModelSectionLabel(feedback: string): string {
  const m = feedback.match(/\*\*(?:\d+\.\s*)?Model (Description|Story|Answer|Argument|Summary)\*\*/i)
  return m ? `Model ${m[1]}` : 'Model Description'
}
