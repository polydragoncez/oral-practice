import type { AIServiceRequest } from '../types/practiceMode'

export async function getOpenAIFeedback(req: AIServiceRequest): Promise<string> {
  const content: unknown[] = []

  if (req.imageBase64) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${req.imageMimeType ?? 'image/jpeg'};base64,${req.imageBase64}` },
    })
  }

  content.push({ type: 'text', text: req.userMessage })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${req.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: req.systemPrompt },
        { role: 'user', content },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function transcribeAudio(apiKey: string, audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', 'en')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Whisper API error: ${response.status}`)
  }

  const data = await response.json()
  return data.text ?? ''
}

export async function generateTTS(
  apiKey: string,
  text: string,
  voice: string = 'nova'
): Promise<Blob> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: text,
      voice,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `TTS API error: ${response.status}`)
  }

  return response.blob()
}
