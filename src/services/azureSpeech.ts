import { convertBlobToWav } from '../utils/audioConverter'
import type { PronunciationResult, WordResult, WordProsodyFeedback, PhonemeResult } from '../types/pronunciation'

// ─── Azure Neural TTS voices ──────────────────────────────────────────────────

export const AZURE_TTS_VOICES = [
  { name: 'en-US-JennyNeural',   label: 'Jenny — US Female (natural)' },
  { name: 'en-US-AriaNeural',    label: 'Aria — US Female (warm)' },
  { name: 'en-US-GuyNeural',     label: 'Guy — US Male' },
  { name: 'en-US-DavisNeural',   label: 'Davis — US Male (casual)' },
  { name: 'en-GB-SoniaNeural',   label: 'Sonia — UK Female' },
  { name: 'en-GB-RyanNeural',    label: 'Ryan — UK Male' },
  { name: 'en-AU-NatashaNeural', label: 'Natasha — AU Female' },
]

export async function generateAzureTTS(
  azureKey: string,
  azureRegion: string,
  text: string,
  voice: string = 'en-US-JennyNeural'
): Promise<Blob> {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${escaped}</voice></speak>`

  const response = await fetch(
    `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      },
      body: ssml,
    }
  )

  if (!response.ok) {
    const msg = await response.text().catch(() => '')
    throw new Error(`Azure TTS error ${response.status}: ${msg || response.statusText}`)
  }

  return response.blob()
}

// ─── Pronunciation Assessment ─────────────────────────────────────────────────

interface AzurePhoneme {
  Phoneme: string
  AccuracyScore?: number
}

interface AzureWord {
  Word: string
  AccuracyScore?: number
  ErrorType?: string
  Phonemes?: AzurePhoneme[]
  Feedback?: {
    Prosody?: {
      Break?: { ErrorTypes?: string[] }
      Intonation?: { ErrorTypes?: string[] }
    }
  }
}

interface AzureNBest {
  AccuracyScore?: number
  FluencyScore?: number
  CompletenessScore?: number
  ProsodyScore?: number
  PronScore?: number
  Words?: AzureWord[]
}

interface AzureResponse {
  RecognitionStatus?: string
  NBest?: AzureNBest[]
}

// ─── WAV chunking for continuous assessment ───────────────────────────────────

const CHUNK_MAX_SECS = 15
const CHUNK_MIN_SECS = 3
const WAV_HEADER_BYTES = 44

/** Split a WAV ArrayBuffer into chunks. Each chunk is a valid WAV file. */
function splitWavIntoChunks(wavBuffer: ArrayBuffer): ArrayBuffer[] {
  const view = new DataView(wavBuffer)
  const sampleRate = view.getUint32(24, true)
  const bitsPerSample = view.getUint16(34, true)
  const numChannels = view.getUint16(22, true)
  const bytesPerSec = sampleRate * numChannels * (bitsPerSample / 8)
  const dataSize = view.getUint32(40, true)
  const maxBytes = Math.floor(CHUNK_MAX_SECS * bytesPerSec)
  const minBytes = Math.floor(CHUNK_MIN_SECS * bytesPerSec)

  if (dataSize <= maxBytes) return [wavBuffer]

  const chunks: ArrayBuffer[] = []
  let offset = 0

  while (offset < dataSize) {
    let chunkSize = Math.min(maxBytes, dataSize - offset)

    // If the leftover after this chunk would be too short, absorb it
    const remaining = dataSize - offset - chunkSize
    if (remaining > 0 && remaining < minBytes) {
      chunkSize = dataSize - offset
    }

    const chunk = new ArrayBuffer(WAV_HEADER_BYTES + chunkSize)
    // Copy original header then fix size fields
    new Uint8Array(chunk, 0, WAV_HEADER_BYTES).set(
      new Uint8Array(wavBuffer, 0, WAV_HEADER_BYTES)
    )
    const cv = new DataView(chunk)
    cv.setUint32(4, 36 + chunkSize, true)   // RIFF size
    cv.setUint32(40, chunkSize, true)        // data size
    // Copy PCM data
    new Uint8Array(chunk, WAV_HEADER_BYTES, chunkSize).set(
      new Uint8Array(wavBuffer, WAV_HEADER_BYTES + offset, chunkSize)
    )

    chunks.push(chunk)
    offset += chunkSize
  }

  return chunks
}

/** Get audio duration in seconds from a WAV ArrayBuffer. */
function wavDurationSecs(wavBuffer: ArrayBuffer): number {
  const view = new DataView(wavBuffer)
  const sampleRate = view.getUint32(24, true)
  const bitsPerSample = view.getUint16(34, true)
  const numChannels = view.getUint16(22, true)
  const dataSize = view.getUint32(40, true)
  const bytesPerSec = sampleRate * numChannels * (bitsPerSample / 8)
  return dataSize / bytesPerSec
}

// ─── Parse Azure response into our types ──────────────────────────────────────

function parseAzureWords(azureWords: AzureWord[]): WordResult[] {
  return azureWords.map((w): WordResult => {
    const prosody = w.Feedback?.Prosody

    let prosodyFeedback: WordProsodyFeedback | undefined
    if (prosody) {
      const breakErrors = (prosody.Break?.ErrorTypes ?? []).filter((e) => e !== 'None')
      const intonationErrors = (prosody.Intonation?.ErrorTypes ?? []).filter((e) => e !== 'None')
      if (breakErrors.length > 0 || intonationErrors.length > 0) {
        prosodyFeedback = {
          ...(breakErrors.length > 0 ? { breakErrors } : {}),
          ...(intonationErrors.length > 0 ? { intonationErrors } : {}),
        }
      }
    }

    let phonemes: PhonemeResult[] | undefined
    if (w.Phonemes && w.Phonemes.length > 0) {
      phonemes = w.Phonemes.map((p) => ({
        phoneme: p.Phoneme,
        accuracyScore: p.AccuracyScore ?? 0,
      }))
    }

    return {
      word: w.Word,
      accuracyScore: w.AccuracyScore ?? 0,
      errorType: w.ErrorType ?? 'None',
      ...(prosodyFeedback ? { prosodyFeedback } : {}),
      ...(phonemes ? { phonemes } : {}),
    }
  })
}

// ─── Single-chunk assessment request ──────────────────────────────────────────

async function assessChunk(
  azureKey: string,
  azureRegion: string,
  wavArrayBuffer: ArrayBuffer,
  configBase64: string
): Promise<PronunciationResult | null> {
  const endpoint =
    `https://${azureRegion}.stt.speech.microsoft.com` +
    `/speech/recognition/conversation/cognitiveservices/v1` +
    `?language=en-US&format=detailed`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': azureKey,
      'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      'Pronunciation-Assessment': configBase64,
    },
    body: wavArrayBuffer,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Azure Speech error ${response.status}: ${text || response.statusText}`)
  }

  const data: AzureResponse = await response.json()

  // Silence / no speech in this chunk — skip, don't error
  if (data.RecognitionStatus === 'NoMatch' || data.RecognitionStatus === 'InitialSilenceTimeout') {
    return null
  }

  if (data.RecognitionStatus !== 'Success') {
    throw new Error(`Azure recognition failed: ${data.RecognitionStatus ?? 'unknown'}`)
  }

  const nbest = data.NBest?.[0]
  if (!nbest) return null

  return {
    accuracyScore: nbest.AccuracyScore ?? 0,
    fluencyScore: nbest.FluencyScore ?? 0,
    completenessScore: nbest.CompletenessScore ?? 0,
    prosodyScore: nbest.ProsodyScore ?? 0,
    pronunciationScore: nbest.PronScore ?? 0,
    words: parseAzureWords(nbest.Words ?? []),
  }
}

// ─── Merge multiple chunk results ─────────────────────────────────────────────

function mergeResults(results: PronunciationResult[]): PronunciationResult {
  if (results.length === 1) return results[0]

  const allWords = results.flatMap((r) => r.words)
  const totalWords = allWords.length || 1

  // Weighted average by word count per chunk
  let acc = 0, flu = 0, comp = 0, pros = 0, pron = 0
  for (const r of results) {
    const w = (r.words.length || 0) / totalWords
    acc += r.accuracyScore * w
    flu += r.fluencyScore * w
    comp += r.completenessScore * w
    pros += r.prosodyScore * w
    pron += r.pronunciationScore * w
  }

  return {
    accuracyScore: Math.round(acc),
    fluencyScore: Math.round(flu),
    completenessScore: Math.round(comp),
    prosodyScore: Math.round(pros),
    pronunciationScore: Math.round(pron),
    words: allWords,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function assessPronunciation(
  azureKey: string,
  azureRegion: string,
  audioBlob: Blob,
  referenceText?: string,
  options?: { granularity?: 'Word' | 'Phoneme' }
): Promise<PronunciationResult> {
  // Convert to WAV PCM 16kHz mono (required by Azure REST API)
  const wavBlob = await convertBlobToWav(audioBlob)
  const wavBuffer = await wavBlob.arrayBuffer()
  const durationSecs = wavDurationSecs(wavBuffer)

  const granularity = options?.granularity ?? 'Word'

  // Build assessment config
  const assessmentConfig = referenceText
    ? {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: granularity,
        Dimension: 'Comprehensive',
        EnableMiscue: true,
        EnableProsodyAssessment: true,
      }
    : {
        Topic: 'General',
        GradingSystem: 'HundredMark',
        Granularity: granularity,
        Dimension: 'Comprehensive',
        EnableProsodyAssessment: true,
      }
  const configBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(assessmentConfig))))

  // Scripted mode (shadowing) — single request, reference text alignment matters
  // Unscripted mode with short audio — single request
  if (referenceText || durationSecs <= CHUNK_MAX_SECS) {
    const result = await assessChunk(azureKey, azureRegion, wavBuffer, configBase64)
    if (!result) throw new Error('Azure returned no results')
    return result
  }

  // Unscripted mode with long audio — split into chunks for continuous coverage
  // Send sequentially: Azure free tier (F0) only allows 1 concurrent request
  const chunks = splitWavIntoChunks(wavBuffer)
  const results: PronunciationResult[] = []

  for (const chunk of chunks) {
    try {
      const result = await assessChunk(azureKey, azureRegion, chunk, configBase64)
      if (result) results.push(result)
    } catch {
      // Skip failed chunks (silence, rate limit, etc.) — partial results are still useful
    }
  }

  if (results.length === 0) {
    throw new Error('Azure returned no results for any audio segment')
  }

  return mergeResults(results)
}
