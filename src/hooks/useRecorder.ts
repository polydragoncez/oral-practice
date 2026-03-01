import { useState, useRef, useCallback } from 'react'

export interface RecorderResult {
  blob: Blob
  duration: number
}

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [analyserData, setAnalyserData] = useState<Uint8Array>(new Uint8Array(128))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const resolveRef = useRef<((r: RecorderResult) => void) | null>(null)
  const startTimeRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    intervalRef.current = null
    rafRef.current = null
    analyserRef.current = null
  }, [])

  const start = useCallback(
    (duration: number): Promise<RecorderResult> => {
      return new Promise(async (resolve, reject) => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          streamRef.current = stream

          const audioCtx = new AudioContext()
          audioCtxRef.current = audioCtx
          const source = audioCtx.createMediaStreamSource(stream)
          const analyser = audioCtx.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          analyserRef.current = analyser

          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : ''

          const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
          mediaRecorderRef.current = mr
          chunksRef.current = []
          resolveRef.current = resolve
          startTimeRef.current = Date.now()

          mr.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
          }

          mr.onstop = () => {
            const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
            const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
            cleanup()
            setIsRecording(false)
            resolveRef.current?.({ blob, duration: elapsed })
          }

          mr.start(100)
          setIsRecording(true)
          setTimeLeft(duration)

          // Countdown
          intervalRef.current = window.setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                mr.stop()
                return 0
              }
              return prev - 1
            })
          }, 1000)

          // Waveform RAF
          const drawWaveform = () => {
            if (!analyserRef.current) return
            const data = new Uint8Array(analyserRef.current.frequencyBinCount)
            analyserRef.current.getByteTimeDomainData(data)
            setAnalyserData(new Uint8Array(data))
            rafRef.current = requestAnimationFrame(drawWaveform)
          }
          drawWaveform()
        } catch (err) {
          cleanup()
          reject(err)
        }
      })
    },
    [cleanup]
  )

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      mediaRecorderRef.current.stop()
    }
  }, [])

  return { isRecording, timeLeft, analyserData, start, stop }
}
