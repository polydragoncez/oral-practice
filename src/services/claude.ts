import type { AIServiceRequest } from '../types/practiceMode'

export async function getClaudeFeedback(req: AIServiceRequest): Promise<string> {
  const content: unknown[] = []

  if (req.imageBase64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: (req.imageMimeType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: req.imageBase64,
      },
    })
  }

  content.push({ type: 'text', text: req.userMessage })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': req.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: req.systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}
