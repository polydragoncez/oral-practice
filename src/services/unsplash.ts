export interface UnsplashPhoto {
  id: string
  urls: { regular: string; small: string; raw: string }
  alt_description: string | null
  user: { name: string }
}

export async function fetchRandomPhoto(apiKey: string): Promise<UnsplashPhoto> {
  const res = await fetch(
    `https://api.unsplash.com/photos/random?client_id=${apiKey}&orientation=landscape`
  )
  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)
  return res.json()
}

export async function searchPhotos(
  apiKey: string,
  query: string
): Promise<UnsplashPhoto[]> {
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${apiKey}&orientation=landscape&per_page=12`
  )
  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)
  const data = await res.json()
  return data.results
}

export function getPicsumUrl(): string {
  return `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 10000)}`
}

export async function urlToBase64(
  url: string
): Promise<{ base64: string; mimeType: string; finalUrl: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch image')
  const finalUrl = res.url  // resolved URL after any redirects
  const blob = await res.blob()
  const mimeType = blob.type || 'image/jpeg'
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType, finalUrl })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const mimeType = file.type || 'image/jpeg'
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
