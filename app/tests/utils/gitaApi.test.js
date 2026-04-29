import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getChapters,
  getChapter,
  getVerses,
  getVerse,
  getTranslations,
  getTranslation,
  getCommentaries,
  getCommentary,
  search,
  gitaApi,
} from '../../src/utils/gitaApi'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CHAPTERS_RESPONSE = {
  total: 2,
  chapters: [
    { chapter_number: 1, name_transliterated: 'Arjuna Visada Yoga', verse_count: 47 },
    { chapter_number: 2, name_transliterated: 'Sankhya Yoga', verse_count: 72 },
  ],
}

const VERSE_FULL = {
  verse_number: 47,
  text_sanskrit: 'कर्मण्येवाधिकारस्ते…',
  text_transliteration: 'karmaṇy evādhikāras te…',
  translations: {
    english_sivananda:    'Your right is to work only…',
    english_bhaktivedanta:'You have a right to perform…',
    marathi:              'कर्म करण्याचाच तुला अधिकार आहे…',
  },
  commentaries: {
    sivananda:      'This is the most important verse…',
    bhaktivedanta:  'This is the perfect instruction…',
    shankaracharya: 'This verse teaches Nishkama Karma…',
    aurobindo:      'The divine teaching here…',
  },
}

// ── Mock fetch ────────────────────────────────────────────────────────────────

function mockFetch(responseBody, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(responseBody),
  })
}

function mockFetchError(errorBody, status = 404) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(errorBody),
  })
}

afterEach(() => { vi.restoreAllMocks() })

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('gitaApi.getChapters', () => {
  it('calls /api/chapters', async () => {
    mockFetch(CHAPTERS_RESPONSE)
    await getChapters()
    expect(global.fetch).toHaveBeenCalledWith('/api/chapters', expect.any(Object))
  })

  it('returns the chapters array', async () => {
    mockFetch(CHAPTERS_RESPONSE)
    const result = await getChapters()
    expect(result.chapters).toHaveLength(2)
    expect(result.total).toBe(2)
  })
})

describe('gitaApi.getChapter', () => {
  it('calls /api/chapters/:id', async () => {
    mockFetch({ chapter_number: 1, verse_count: 47 })
    await getChapter(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/chapters/1', expect.any(Object))
  })

  it('throws on 404', async () => {
    mockFetchError({ error: 'Chapter 99 not found', status: 404 }, 404)
    await expect(getChapter(99)).rejects.toThrow('Chapter 99 not found')
  })
})

describe('gitaApi.getVerses', () => {
  it('calls /api/chapters/:id/verses', async () => {
    mockFetch({ chapter_number: 2, total: 72, verses: [] })
    await getVerses(2)
    expect(global.fetch).toHaveBeenCalledWith('/api/chapters/2/verses', expect.any(Object))
  })
})

describe('gitaApi.getVerse', () => {
  it('calls /api/chapters/:id/verses/:vid', async () => {
    mockFetch(VERSE_FULL)
    await getVerse(2, 47)
    expect(global.fetch).toHaveBeenCalledWith('/api/chapters/2/verses/47', expect.any(Object))
  })

  it('returns the full verse object', async () => {
    mockFetch(VERSE_FULL)
    const v = await getVerse(2, 47)
    expect(v.verse_number).toBe(47)
    expect(v.translations.marathi).toBeTruthy()
    expect(v.commentaries.sivananda).toBeTruthy()
  })
})

describe('gitaApi.getTranslations', () => {
  it('calls /api/chapters/:id/verses/:vid/translations', async () => {
    mockFetch({ verse: '2.47', translations: VERSE_FULL.translations })
    await getTranslations(2, 47)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chapters/2/verses/47/translations',
      expect.any(Object)
    )
  })

  it('returns translations object', async () => {
    mockFetch({ verse: '2.47', translations: VERSE_FULL.translations })
    const res = await getTranslations(2, 47)
    expect(res.translations.english_sivananda).toBeTruthy()
    expect(res.translations.marathi).toBeTruthy()
  })
})

describe('gitaApi.getTranslation', () => {
  it('calls /api/chapters/:id/verses/:vid/translations/:lang', async () => {
    mockFetch({ verse: '2.47', language: 'marathi', text: 'कर्म करण्याचाच…' })
    await getTranslation(2, 47, 'marathi')
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chapters/2/verses/47/translations/marathi',
      expect.any(Object)
    )
  })

  it('returns a single translation text', async () => {
    mockFetch({ verse: '2.47', language: 'marathi', text: 'कर्म करण्याचाच…' })
    const res = await getTranslation(2, 47, 'marathi')
    expect(res.text).toBeTruthy()
    expect(res.language).toBe('marathi')
  })

  it('throws 404 for unknown language', async () => {
    mockFetchError({ error: "Translation 'klingon' not found", status: 404 }, 404)
    await expect(getTranslation(2, 47, 'klingon')).rejects.toThrow()
  })
})

describe('gitaApi.getCommentaries', () => {
  it('calls /api/chapters/:id/verses/:vid/commentaries', async () => {
    mockFetch({ verse: '2.47', commentaries: VERSE_FULL.commentaries })
    await getCommentaries(2, 47)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chapters/2/verses/47/commentaries',
      expect.any(Object)
    )
  })

  it('returns all four commentaries', async () => {
    mockFetch({ verse: '2.47', commentaries: VERSE_FULL.commentaries })
    const res = await getCommentaries(2, 47)
    expect(Object.keys(res.commentaries)).toEqual(
      expect.arrayContaining(['sivananda', 'bhaktivedanta', 'shankaracharya', 'aurobindo'])
    )
  })
})

describe('gitaApi.getCommentary', () => {
  it('calls /api/chapters/:id/verses/:vid/commentaries/:author', async () => {
    mockFetch({ verse: '2.47', author: 'sivananda', text: 'This is the most important…' })
    await getCommentary(2, 47, 'sivananda')
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chapters/2/verses/47/commentaries/sivananda',
      expect.any(Object)
    )
  })

  it('returns a single commentary text', async () => {
    mockFetch({ verse: '2.47', author: 'aurobindo', text: 'The divine teaching here…' })
    const res = await getCommentary(2, 47, 'aurobindo')
    expect(res.author).toBe('aurobindo')
    expect(res.text).toBeTruthy()
  })
})

describe('gitaApi.search', () => {
  it('calls /api/search with q param', async () => {
    mockFetch({ query: 'karma', total: 3, results: [] })
    await search('karma')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/search?q=karma'),
      expect.any(Object)
    )
  })

  it('includes chapter param when provided', async () => {
    mockFetch({ query: 'dharma', total: 0, results: [] })
    await search('dharma', 2)
    const url = global.fetch.mock.calls[0][0]
    expect(url).toContain('chapter=2')
  })

  it('returns results array', async () => {
    const mockResults = [{ ref: '2.47', text_sanskrit: '…', snippet: 'karma' }]
    mockFetch({ query: 'karma', total: 1, results: mockResults })
    const res = await search('karma')
    expect(res.results).toHaveLength(1)
    expect(res.total).toBe(1)
  })

  it('throws on 400 for short query', async () => {
    mockFetchError({ error: 'Query too short', status: 400 }, 400)
    await expect(search('a')).rejects.toThrow('Query too short')
  })
})

describe('gitaApi object', () => {
  it('exports all expected methods', () => {
    const methods = [
      'getApiInfo', 'getChapters', 'getChapter',
      'getVerses', 'getVerse',
      'getTranslations', 'getTranslation',
      'getCommentaries', 'getCommentary',
      'search',
    ]
    methods.forEach(m => expect(typeof gitaApi[m]).toBe('function'))
  })
})
