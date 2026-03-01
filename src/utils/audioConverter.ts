/**
 * Convert any browser-recorded audio Blob (webm/opus, etc.)
 * to WAV PCM 16-bit 16 kHz mono, which Azure Speech requires.
 *
 * Uses OfflineAudioContext for reliable resampling — AudioContext({ sampleRate })
 * is unreliable on Chrome/macOS and may be ignored by the browser.
 */
export async function convertBlobToWav(blob: Blob): Promise<Blob> {
  const TARGET_SAMPLE_RATE = 16000

  const arrayBuffer = await blob.arrayBuffer()

  // 1. Decode at the browser's native rate (reliable)
  const audioCtx = new AudioContext()
  let audioBuffer: AudioBuffer
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  } finally {
    await audioCtx.close()
  }

  // 2. Mix down to mono (Float32)
  const numChannels = audioBuffer.numberOfChannels
  const numSamples = audioBuffer.length
  const monoData = new Float32Array(numSamples)
  for (let i = 0; i < numSamples; i++) {
    let sum = 0
    for (let c = 0; c < numChannels; c++) sum += audioBuffer.getChannelData(c)[i]
    monoData[i] = sum / numChannels
  }

  // 3. Resample to 16 kHz via OfflineAudioContext (correct approach)
  const sourceSampleRate = audioBuffer.sampleRate
  const targetLength = Math.ceil(numSamples * TARGET_SAMPLE_RATE / sourceSampleRate)
  const offlineCtx = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE)
  const srcBuffer = offlineCtx.createBuffer(1, numSamples, sourceSampleRate)
  srcBuffer.copyToChannel(monoData, 0)
  const srcNode = offlineCtx.createBufferSource()
  srcNode.buffer = srcBuffer
  srcNode.connect(offlineCtx.destination)
  srcNode.start()
  const rendered = await offlineCtx.startRendering()

  // 4. Convert Float32 → Int16
  const channelData = rendered.getChannelData(0)
  const pcmData = new Int16Array(channelData.length)
  for (let i = 0; i < channelData.length; i++) {
    pcmData[i] = Math.max(-32768, Math.min(32767, Math.round(channelData[i] * 32767)))
  }

  return new Blob([buildWavBuffer(pcmData, TARGET_SAMPLE_RATE)], { type: 'audio/wav' })
}

function buildWavBuffer(pcmData: Int16Array, sampleRate: number): ArrayBuffer {
  const channels = 1
  const bytesPerSample = 2
  const dataSize = pcmData.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const str = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  str(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  view.setUint32(16, 16, true)                                       // fmt chunk size
  view.setUint16(20, 1, true)                                        // PCM
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * bytesPerSample, true)   // byte rate
  view.setUint16(32, channels * bytesPerSample, true)                // block align
  view.setUint16(34, 16, true)                                       // bits per sample
  str(36, 'data')
  view.setUint32(40, dataSize, true)

  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(44 + i * 2, pcmData[i], true)
  }

  return buffer
}
