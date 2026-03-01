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

interface AzurePhoneme {
  Phoneme: string
  AccuracyScore?: number
}

interface AzureWord {
  Word: string
  // Scores are flat on the word object (not nested under PronunciationAssessment)
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
  // Scores are flat on the NBest object (not nested under PronunciationAssessment)
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

export async function assessPronunciation(
  azureKey: string,
  azureRegion: string,
  audioBlob: Blob,
  referenceText?: string,
  options?: { granularity?: 'Word' | 'Phoneme' }
): Promise<PronunciationResult> {
  // Convert to WAV PCM 16kHz mono (required by Azure REST API)
  const wavBlob = await convertBlobToWav(audioBlob)

  const granularity = options?.granularity ?? 'Word'

  // Build Pronunciation Assessment config
  // When referenceText is provided: scripted mode with miscue detection
  // When omitted: unscripted mode with general topic
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
    body: await wavBlob.arrayBuffer(),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Azure Speech error ${response.status}: ${text || response.statusText}`)
  }

  const data: AzureResponse = await response.json()

  if (data.RecognitionStatus !== 'Success') {
    throw new Error(`Azure recognition failed: ${data.RecognitionStatus ?? 'unknown'}`)
  }

  const nbest = data.NBest?.[0]
  if (!nbest) throw new Error('Azure returned no results')

  const words: WordResult[] = (nbest.Words ?? []).map((w): WordResult => {
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

  return {
    accuracyScore: nbest.AccuracyScore ?? 0,
    fluencyScore: nbest.FluencyScore ?? 0,
    completenessScore: nbest.CompletenessScore ?? 0,
    prosodyScore: nbest.ProsodyScore ?? 0,
    pronunciationScore: nbest.PronScore ?? 0,
    words,
  }
}
