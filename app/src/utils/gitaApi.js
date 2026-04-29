/**
 * GitaSaar API Client
 * ====================
 * Thin wrapper around the Service Worker REST API.
 * All calls go to /api/* and are handled client-side by sw.js — no backend needed.
 *
 * Usage:
 *   import { gitaApi } from '@/utils/gitaApi'
 *
 *   const chapters = await gitaApi.getChapters()
 *   const verse    = await gitaApi.getVerse(2, 47)
 *   const results  = await gitaApi.search('karma')
 */

const BASE = '/api'

// ── Internal fetch helper ─────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.error || `API error ${res.status}`)
    err.status  = res.status
    err.payload = data
    throw err
  }

  return data
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * GET /api
 * Returns API info and available endpoints.
 */
function getApiInfo() {
  return apiFetch('/')
}

/**
 * GET /api/chapters
 * Returns { total, chapters: [...] }
 */
function getChapters() {
  return apiFetch('/chapters')
}

/**
 * GET /api/chapters/:id
 * Returns chapter metadata (no verses).
 */
function getChapter(chapterId) {
  return apiFetch(`/chapters/${chapterId}`)
}

/**
 * GET /api/chapters/:id/verses
 * Returns { chapter_number, total, verses: [...] }
 * Commentaries are omitted from the list for performance; use getVerse() for full data.
 */
function getVerses(chapterId) {
  return apiFetch(`/chapters/${chapterId}/verses`)
}

/**
 * GET /api/chapters/:id/verses/:vid
 * Returns the full verse object (Sanskrit, transliteration, translations, commentaries).
 */
function getVerse(chapterId, verseId) {
  return apiFetch(`/chapters/${chapterId}/verses/${verseId}`)
}

/**
 * GET /api/chapters/:id/verses/:vid/translations
 * Returns { verse, translations: { english_sivananda, english_bhaktivedanta, marathi } }
 */
function getTranslations(chapterId, verseId) {
  return apiFetch(`/chapters/${chapterId}/verses/${verseId}/translations`)
}

/**
 * GET /api/chapters/:id/verses/:vid/translations/:lang
 * lang: 'english_sivananda' | 'english_bhaktivedanta' | 'marathi'
 * Returns { verse, language, text }
 */
function getTranslation(chapterId, verseId, lang) {
  return apiFetch(`/chapters/${chapterId}/verses/${verseId}/translations/${lang}`)
}

/**
 * GET /api/chapters/:id/verses/:vid/commentaries
 * Returns { verse, commentaries: { sivananda, bhaktivedanta, shankaracharya, aurobindo } }
 */
function getCommentaries(chapterId, verseId) {
  return apiFetch(`/chapters/${chapterId}/verses/${verseId}/commentaries`)
}

/**
 * GET /api/chapters/:id/verses/:vid/commentaries/:author
 * author: 'sivananda' | 'bhaktivedanta' | 'shankaracharya' | 'aurobindo'
 * Returns { verse, author, text }
 */
function getCommentary(chapterId, verseId, author) {
  return apiFetch(`/chapters/${chapterId}/verses/${verseId}/commentaries/${author}`)
}

/**
 * GET /api/search?q=:query[&chapter=:id]
 * Returns { query, total, results: [{ chapter_number, verse_number, ref, text_sanskrit, snippet }] }
 * Optionally scoped to a single chapter.
 */
function search(query, chapterId = null) {
  const params = new URLSearchParams({ q: query })
  if (chapterId) params.set('chapter', chapterId)
  return apiFetch(`/search?${params}`)
}

// ── Exported API object ───────────────────────────────────────────────────────

export const gitaApi = {
  getApiInfo,
  getChapters,
  getChapter,
  getVerses,
  getVerse,
  getTranslations,
  getTranslation,
  getCommentaries,
  getCommentary,
  search,
}

// Also export named functions for tree-shaking
export {
  getApiInfo,
  getChapters,
  getChapter,
  getVerses,
  getVerse,
  getTranslations,
  getTranslation,
  getCommentaries,
  getCommentary,
  search,
}
