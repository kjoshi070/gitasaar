import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadVerseJSON, downloadChapterJSON } from '../../src/utils/download'

// Mock URL and anchor
const mockRevokeObjectURL = vi.fn()
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockClick = vi.fn()

let capturedBlob = null

beforeEach(() => {
  capturedBlob = null
  mockCreateObjectURL.mockImplementation((blob) => { capturedBlob = blob; return 'blob:mock-url' })

  vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  })

  const anchor = { href: '', download: '', click: mockClick }
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'a') return anchor
    // Fall through for non-anchor elements
    return document.createElementNS('http://www.w3.org/1999/xhtml', tag)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  mockClick.mockClear()
  mockRevokeObjectURL.mockClear()
})

// Helper: read Blob content as text
function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(blob)
  })
}

const verse = {
  verse_number: 1,
  text_sanskrit: 'धर्मक्षेत्रे',
  translations: { english_sivananda: 'Test translation' },
}
const chapterMeta = { chapter_number: 1, name_transliterated: 'Arjuna Visada Yoga' }

describe('downloadVerseJSON', () => {
  it('creates a Blob with correct MIME type', () => {
    downloadVerseJSON(verse, chapterMeta)
    expect(capturedBlob).toBeInstanceOf(Blob)
    expect(capturedBlob.type).toBe('application/json')
  })

  it('triggers a download click', () => {
    downloadVerseJSON(verse, chapterMeta)
    expect(mockClick).toHaveBeenCalledOnce()
  })

  it('includes source and license metadata in JSON', async () => {
    downloadVerseJSON(verse, chapterMeta)
    const text = await readBlob(capturedBlob)
    const parsed = JSON.parse(text)
    expect(parsed.source).toMatch(/GitaSaar/)
    expect(parsed.license).toBeTruthy()
    expect(parsed.verse).toEqual(verse)
    expect(parsed.chapter.number).toBe(1)
  })

  it('works without chapterMeta', () => {
    expect(() => downloadVerseJSON(verse, undefined)).not.toThrow()
  })

  it('calls createObjectURL with a Blob', () => {
    downloadVerseJSON(verse, chapterMeta)
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  })

  it('schedules URL revocation', () => {
    vi.useFakeTimers()
    downloadVerseJSON(verse, chapterMeta)
    vi.advanceTimersByTime(11_000)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    vi.useRealTimers()
  })
})

describe('downloadChapterJSON', () => {
  const chapter = {
    chapter_number: 2,
    name_transliterated: 'Sankhya Yoga',
    verses: [{ verse_number: 1, text_sanskrit: 'test' }],
  }

  it('creates a Blob with correct MIME type', () => {
    downloadChapterJSON(chapter)
    expect(capturedBlob).toBeInstanceOf(Blob)
    expect(capturedBlob.type).toBe('application/json')
  })

  it('triggers a download click', () => {
    downloadChapterJSON(chapter)
    expect(mockClick).toHaveBeenCalledOnce()
  })

  it('includes source attribution in JSON content', async () => {
    downloadChapterJSON(chapter)
    const text = await readBlob(capturedBlob)
    const parsed = JSON.parse(text)
    expect(parsed.source).toMatch(/GitaSaar/)
    expect(parsed.chapter.chapter_number).toBe(2)
  })
})
