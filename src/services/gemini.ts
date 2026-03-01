import type { AIServiceRequest } from '../types/practiceMode'

export async function getGeminiFeedback(
  req: AIServiceRequest & { model?: string }
): Promise<string> {
  const model = req.model || 'gemini-2.5-flash'
  const parts: unknown[] = []

  if (req.imageBase64) {
    parts.push({ inline_data: { mime_type: req.imageMimeType ?? 'image/jpeg', data: req.imageBase64 } })
  }

  parts.push({ text: req.userMessage })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${req.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: req.systemPrompt }] },
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const responseParts: { text?: string; thought?: boolean }[] =
    data.candidates?.[0]?.content?.parts ?? []
  const text = responseParts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')
  return text || (responseParts[0]?.text ?? '')
}
