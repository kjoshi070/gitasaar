/**
 * GitaSaar Service Worker — Client-side REST API
 * ================================================
 * Intercepts requests to /api/* and serves Gita data from cached static JSON.
 * This is a fully frontend-only "REST API" — no backend, no server, Vercel-compatible.
 *
 * Available endpoints:
 *   GET /api                                          — API info
 *   GET /api/chapters                                 — all 18 chapters (metadata)
 *   GET /api/chapters/:id                             — single chapter metadata
 *   GET /api/chapters/:id/verses                      — all verses in a chapter
 *   GET /api/chapters/:id/verses/:vid                 — single verse (full)
 *   GET /api/chapters/:id/verses/:vid/translations    — all translations for a verse
 *   GET /api/chapters/:id/verses/:vid/translations/:lang  — one translation
 *   GET /api/chapters/:id/verses/:vid/commentaries    — all commentaries for a verse
 *   GET /api/chapters/:id/verses/:vid/commentaries/:author — one commentary
 *   GET /api/search?q=:query[&chapter=:id]            — full-text search
 *
 * :lang values   → english_sivananda | english_bhaktivedanta | marathi
 * :author values → sivananda | bhaktivedanta | shankaracharya | aurobindo
 */

const CACHE_NAME   = 'gitasaar-data-v1'
const API_PREFIX   = '/api'
const INDEX_URL    = '/data/index.json'
const CHAPTER_URL  = (id) => `/data/chapter-${id}.json`

// ── Cache helpers ─────────────────────────────────────────────────────────────

async function fetchWithCache(url) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(url)
  if (cached) return cached.json()
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  cache.put(url, res.clone())
  return res.json()
}

// ── Response helpers ──────────────────────────────────────────────────────────

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type':                'application/json; charset=utf-8',
      'Cache-Control':               'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function notFound(message = 'Not found') {
  return jsonResponse({ error: message, status: 404 }, 404)
}

function badRequest(message) {
  return jsonResponse({ error: message, status: 400 }, 400)
}

function serverError(message) {
  return jsonResponse({ error: message, status: 500 }, 500)
}

// ── Route parser ──────────────────────────────────────────────────────────────

function parseRoute(pathname) {
  // Strip trailing slash
  const p = pathname.replace(/\/$/, '') || '/'

  if (p === '/api') return { route: 'info' }

  if (p === '/api/chapters') return { route: 'chapters' }

  let m = p.match(/^\/api\/chapters\/(\d+)$/)
  if (m) return { route: 'chapter', chapterId: +m[1] }

  m = p.match(/^\/api\/chapters\/(\d+)\/verses$/)
  if (m) return { route: 'verses', chapterId: +m[1] }

  m = p.match(/^\/api\/chapters\/(\d+)\/verses\/(\d+)$/)
  if (m) return { route: 'verse', chapterId: +m[1], verseId: +m[2] }

  m = p.match(/^\/api\/chapters\/(\d+)\/verses\/(\d+)\/translations$/)
  if (m) return { route: 'translations', chapterId: +m[1], verseId: +m[2] }

  m = p.match(/^\/api\/chapters\/(\d+)\/verses\/(\d+)\/translations\/([^/]+)$/)
  if (m) return { route: 'translation', chapterId: +m[1], verseId: +m[2], lang: m[3] }

  m = p.match(/^\/api\/chapters\/(\d+)\/verses\/(\d+)\/commentaries$/)
  if (m) return { route: 'commentaries', chapterId: +m[1], verseId: +m[2] }

  m = p.match(/^\/api\/chapters\/(\d+)\/verses\/(\d+)\/commentaries\/([^/]+)$/)
  if (m) return { route: 'commentary', chapterId: +m[1], verseId: +m[2], author: m[3] }

  m = p.match(/^\/api\/search$/)
  if (m) return { route: 'search' }

  return null
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleInfo() {
  return jsonResponse({
    name:    'GitaSaar API',
    version: '1.0.0',
    note:    'Client-side REST API powered by a Service Worker. No backend required.',
    endpoints: [
      'GET /api',
      'GET /api/chapters',
      'GET /api/chapters/:id',
      'GET /api/chapters/:id/verses',
      'GET /api/chapters/:id/verses/:vid',
      'GET /api/chapters/:id/verses/:vid/translations',
      'GET /api/chapters/:id/verses/:vid/translations/:lang',
      'GET /api/chapters/:id/verses/:vid/commentaries',
      'GET /api/chapters/:id/verses/:vid/commentaries/:author',
      'GET /api/search?q=:query[&chapter=:id]',
    ],
    lang_values:   ['english_sivananda', 'english_bhaktivedanta', 'marathi'],
    author_values: ['sivananda', 'bhaktivedanta', 'shankaracharya', 'aurobindo'],
  })
}

async function handleChapters() {
  const index = await fetchWithCache(INDEX_URL)
  return jsonResponse({
    total: index.chapters.length,
    chapters: index.chapters,
  })
}

async function handleChapter(chapterId) {
  const index = await fetchWithCache(INDEX_URL)
  const meta  = index.chapters.find(c => c.chapter_number === chapterId)
  if (!meta) return notFound(`Chapter ${chapterId} not found`)
  return jsonResponse(meta)
}

async function handleVerses(chapterId) {
  let chapterData
  try { chapterData = await fetchWithCache(CHAPTER_URL(chapterId)) }
  catch { return notFound(`Chapter ${chapterId} data not found. Run data-collection/fetch_gita_data.py first.`) }

  const verses = (chapterData.verses || []).map(v => ({
    verse_number:       v.verse_number,
    text_sanskrit:      v.text_sanskrit,
    text_transliteration: v.text_transliteration,
    translations:       v.translations,
    // Omit commentaries for list view (keeps payload small)
    has_commentaries:   Object.keys(v.commentaries || {}).length > 0,
  }))

  return jsonResponse({
    chapter_number: chapterId,
    total:          verses.length,
    verses,
  })
}

async function handleVerse(chapterId, verseId) {
  let chapterData
  try { chapterData = await fetchWithCache(CHAPTER_URL(chapterId)) }
  catch { return notFound(`Chapter ${chapterId} data not available.`) }

  const verse = (chapterData.verses || []).find(v => v.verse_number === verseId)
  if (!verse) return notFound(`Verse ${chapterId}.${verseId} not found`)
  return jsonResponse(verse)
}

async function handleTranslations(chapterId, verseId) {
  let chapterData
  try { chapterData = await fetchWithCache(CHAPTER_URL(chapterId)) }
  catch { return notFound(`Chapter ${chapterId} data not available.`) }

  const verse = (chapterData.verses || []).find(v => v.verse_number === verseId)
  if (!verse) return notFound(`Verse ${chapterId}.${verseId} not found`)
  if (!verse.translations) return jsonResponse({ verse: `${chapterId}.${verseId}`, translations: {} })
  return jsonResponse({ verse: `${chapterId}.${verseId}`, translations: verse.translations })
}

async function handleTranslation(chapterId, verseId, lang) {
  let chapterData
  try { chapterData = await fetchWithCache(CHAPTER_URL(chapterId)) }
  catch { return notFound(`Chapter ${chapterId} data not available.`) }

  const verse = (chapterData.verses || []).find(v => v.verse_number === verseId)
  if (!verse) return notFound(`Verse ${chapterId}.${verseId} not found`)
  const text = verse.translations?.[lang]
  if (!text) return notFound(`Translation '${lang}' not found for ${chapterId}.${verseId}`)
  return jsonResponse({ verse: `${chapterId}.${verseId}`, language: lang, text })
}

async function handleCommentaries(chapterId, verseId) {
  let chapterData
  try { chapterData = await fetchWithCache(CHAPTER_URL(chapterId)) }
  catch { return notFound(`Chapter ${chapterId} data not available.`) }

  const verse = (chapterData.verses || []).find(v => v.verse_number === verseId)
  if (!verse) return notFound(`Verse ${chapterId}.${verseId} not found`)
  if (!verse.commentaries) return jsonResponse({ verse: `${chapterId}.${verseId}`, commentaries: {} })
  return jsonResponse({ verse: `${chapterId}.${verseId}`, commentaries: verse.commentaries })
}

async function handleCommentary(chapterId, verseId, author) {
  let chapterData
  try { chapterData = await fetchWithCache(CHAPTER_URL(chapterId)) }
  catch { return notFound(`Chapter ${chapterId} data not available.`) }

  const verse = (chapterData.verses || []).find(v => v.verse_number === verseId)
  if (!verse) return notFound(`Verse ${chapterId}.${verseId} not found`)
  const text = verse.commentaries?.[author]
  if (!text) return notFound(`Commentary by '${author}' not found for ${chapterId}.${verseId}`)
  return jsonResponse({ verse: `${chapterId}.${verseId}`, author, text })
}

async function handleSearch(url) {
  const q         = (url.searchParams.get('q') || '').trim().toLowerCase()
  const chapterFilter = url.searchParams.get('chapter')
    ? +url.searchParams.get('chapter')
    : null

  if (!q) return badRequest('Missing query parameter: q')
  if (q.length < 2) return badRequest('Query too short (min 2 characters)')

  const index    = await fetchWithCache(INDEX_URL)
  const results  = []
  const chapIds  = chapterFilter
    ? [chapterFilter]
    : index.chapters.map(c => c.chapter_number)

  for (const id of chapIds) {
    let chData
    try { chData = await fetchWithCache(CHAPTER_URL(id)) }
    catch { continue } // Skip chapters with no data yet

    for (const verse of (chData.verses || [])) {
      const haystack = [
        verse.text_sanskrit,
        verse.text_transliteration,
        ...Object.values(verse.translations || {}),
        ...Object.values(verse.commentaries || {}),
      ].join(' ').toLowerCase()

      if (haystack.includes(q)) {
        results.push({
          chapter_number: id,
          verse_number:   verse.verse_number,
          ref:            `${id}.${verse.verse_number}`,
          text_sanskrit:  verse.text_sanskrit,
          snippet: Object.values(verse.translations || {})
            .find(t => t?.toLowerCase().includes(q)) || '',
        })
      }
    }
  }

  return jsonResponse({ query: q, total: results.length, results })
}

// ── Main fetch handler ────────────────────────────────────────────────────────

async function handleApiRequest(event) {
  const url      = new URL(event.request.url)
  const pathname = url.pathname

  // Only handle GET
  if (event.request.method !== 'GET') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405)
  }

  const matched = parseRoute(pathname)
  if (!matched) return notFound(`Unknown API path: ${pathname}`)

  try {
    switch (matched.route) {
      case 'info':          return handleInfo()
      case 'chapters':      return handleChapters()
      case 'chapter':       return handleChapter(matched.chapterId)
      case 'verses':        return handleVerses(matched.chapterId)
      case 'verse':         return handleVerse(matched.chapterId, matched.verseId)
      case 'translations':  return handleTranslations(matched.chapterId, matched.verseId)
      case 'translation':   return handleTranslation(matched.chapterId, matched.verseId, matched.lang)
      case 'commentaries':  return handleCommentaries(matched.chapterId, matched.verseId)
      case 'commentary':    return handleCommentary(matched.chapterId, matched.verseId, matched.author)
      case 'search':        return handleSearch(url)
      default:              return notFound()
    }
  } catch (err) {
    console.error('[GitaSaar SW]', err)
    return serverError(err.message || 'Internal error')
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(handleApiRequest(event))
  }
  // All other requests pass through normally (Vite assets, HTML, etc.)
})
