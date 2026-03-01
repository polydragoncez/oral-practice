import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { PronunciationResult } from '../types/pronunciation'

export interface SessionRecord {
  id?: number
  timestamp: number
  imageUrl: string
  imageBase64?: string   // only set for uploaded (blob:) images; remote images use imageUrl
  imageMimeType?: string
  recordingBlob: Blob | null
  transcript: string
  aiFeedback: string
  score: number | null
  duration: number
  pronunciationResult?: PronunciationResult | null
  modeId?: string
  metadata?: Record<string, unknown>
  shadowingText?: string
  shadowingSource?: { modeId: string; version: string }
}

interface OralDB extends DBSchema {
  sessions: {
    key: number
    value: SessionRecord
    indexes: { 'by-timestamp': number }
  }
}

let dbPromise: Promise<IDBPDatabase<OralDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OralDB>('oral-practice', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sessions', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('by-timestamp', 'timestamp')
      },
    })
  }
  return dbPromise
}

export async function saveSession(session: Omit<SessionRecord, 'id'>): Promise<number> {
  const db = await getDB()
  return db.add('sessions', session)
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('sessions', 'by-timestamp')
  return all.reverse()
}

export async function getSession(id: number): Promise<SessionRecord | undefined> {
  const db = await getDB()
  return db.get('sessions', id)
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDB()
  return db.delete('sessions', id)
}
