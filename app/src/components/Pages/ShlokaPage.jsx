import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGita } from '../../context/GitaContext'
import CommentaryPanel from '../Shloka/CommentaryPanel'

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
    </svg>
  )
}
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="shloka-section__label">
      <span className="shloka-section__label-dot" />
      {children}
    </div>
  )
}

function NoDataNotice({ chapterId, verseId }) {
  return (
    <div className="shloka-content">
      <div className="empty-state" style={{ padding: '60px 40px' }}>
        <div className="empty-state__icon">🕉</div>
        <div className="empty-state__title">Verse {chapterId}.{verseId}</div>
        <div className="empty-state__body">
          This verse hasn’t been fetched yet. Run the data collection script to download
          all 700 shlokas with translations and commentaries.
        </div>
        <code style={{
          display: 'block',
          marginTop: 20,
          padding: '10px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          fontFamily: "'SF Mono', Menlo, monospace",
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}>
          cd data-collection && python3 fetch_gita_data.py
        </code>
      </div>
    </div>
  )
}

// English-language translation keys in display order
const ENGLISH_TRANSLATION_KEYS = [
  'english_sivananda',
  'english_bhaktivedanta',
  'english_gambhirananda',
  'english_purohit',
]

export default function ShlokaPage() {
  const { chapterId, verseId } = useParams()
  const id   = Number(chapterId)
  const vidx = Number(verseId)
  const { index, chapters, loading, loadChapter, TRANSLATION_META } = useGita()

  useEffect(() => { loadChapter(id) }, [id, loadChapter])

  const chapterMeta = useMemo(
    () => index?.chapters?.find(c => c.chapter_number === id),
    [index, id]
  )
  const chapterData = chapters[id]
  const verse = useMemo(
    () => chapterData?.verses?.find(v => v.verse_number === vidx),
    [chapterData, vidx]
  )

  const verseCount = chapterMeta?.verse_count ?? chapterData?.verses?.length ?? 0
  const prevVerse  = vidx > 1          ? vidx - 1 : null
  const nextVerse  = vidx < verseCount ? vidx + 1 : null
  const isLoading  = loading[id]

  function handleDownload() {
    if (!verse) return
    const lines = []
    const heading = `Bhagavad Gita — Chapter ${id}, Verse ${vidx}`
    lines.push(heading)
    lines.push('='.repeat(heading.length))
    lines.push('')

    if (verse.text_sanskrit) {
      lines.push('── Sanskrit ──')
      lines.push(verse.text_sanskrit)
    }
    if (verse.text_transliteration) {
      lines.push('')
      lines.push(verse.text_transliteration)
    }
    lines.push('')

    if (englishTranslations.length > 0) {
      lines.push('── English Translations ──')
      englishTranslations.forEach(({ label, text }) => {
        lines.push('')
        lines.push(`${label}:`)
        lines.push(text)
      })
      lines.push('')
    }

    if (verse.translations?.marathi) {
      lines.push('── Marathi / मराठी अनुवाद ──')
      lines.push(verse.translations.marathi)
      lines.push('')
    }

    if (verse.commentaries && Object.keys(verse.commentaries).length > 0) {
      lines.push('── Commentaries ──')
      Object.entries(verse.commentaries).forEach(([key, text]) => {
        const label = TRANSLATION_META?.[key]?.label ?? key
        lines.push('')
        lines.push(`${label}:`)
        lines.push(text)
      })
      lines.push('')
    }

    lines.push('─'.repeat(40))
    lines.push('Downloaded from GitaSaar')

    const blob = new Blob([lines.join('\n')], { type: 'text/plain; charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `gita-${id}-${vidx}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // A stub verse only has { verse_number: N } — no text content
  const hasContent = verse && (verse.text_sanskrit || verse.translations || verse.commentaries)

  // Collect available English translations in display order
  const englishTranslations = useMemo(() => {
    if (!verse?.translations) return []
    return ENGLISH_TRANSLATION_KEYS
      .filter(k => verse.translations[k])
      .map(k => ({
        key: k,
        label: TRANSLATION_META?.[k]?.label ?? k,
        text:  verse.translations[k],
      }))
  }, [verse, TRANSLATION_META])

  return (
    <div className="shloka-page">
      {/* ── Prev / Next nav ── */}
      <nav className="shloka-nav" aria-label="Verse navigation">
        {prevVerse ? (
          <Link
            to={`/chapter/${id}/verse/${prevVerse}`}
            className="shloka-nav__btn"
            aria-label={`Previous verse ${id}.${prevVerse}`}
          >
            <ArrowLeft /> {id}.{prevVerse}
          </Link>
        ) : (
          <span className="shloka-nav__btn shloka-nav__btn--disabled" aria-hidden="true">
            <ArrowLeft /> —
          </span>
        )}

        <span className="shloka-nav__label">
          {chapterMeta?.name_transliterated && <>{chapterMeta.name_transliterated} · </>}
          Verse {id}.{vidx}
        </span>

        {nextVerse ? (
          <Link
            to={`/chapter/${id}/verse/${nextVerse}`}
            className="shloka-nav__btn"
            aria-label={`Next verse ${id}.${nextVerse}`}
          >
            {id}.{nextVerse} <ArrowRight />
          </Link>
        ) : (
          <span className="shloka-nav__btn shloka-nav__btn--disabled" aria-hidden="true">
            — <ArrowRight />
          </span>
        )}
      </nav>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="shloka-content">
          {[1, 2, 3].map(i => (
            <div key={i} className="shloka-section">
              <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 16 }} />
              <div className="skeleton" style={{ height: 80 }} />
            </div>
          ))}
        </div>
      ) : !hasContent ? (
        <NoDataNotice chapterId={id} verseId={vidx} />
      ) : (
        <article className="shloka-content" aria-label={`Chapter ${id}, Verse ${vidx}`}>

          {/* Sanskrit + transliteration */}
          <section className="shloka-section">
            <SectionLabel>Sanskrit</SectionLabel>
            <p className="sanskrit-text" lang="sa">{verse.text_sanskrit}</p>
            {verse.text_transliteration && (
              <p className="transliteration-text">{verse.text_transliteration}</p>
            )}
          </section>

          {/* Translations — English & Marathi side by side */}
          {(englishTranslations.length > 0 || verse.translations?.marathi) && (
            <section className="shloka-section translations-section">
              <div className="translations-row">
                {englishTranslations.length > 0 && (
                  <div className="translations-col">
                    <SectionLabel>English Translation</SectionLabel>
                    {englishTranslations.map(({ key, label, text }, idx) => (
                      <div key={key} style={{ marginBottom: idx < englishTranslations.length - 1 ? 24 : 0 }}>
                        <div className="translation-author">{label}</div>
                        <p className="translation-text">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {verse.translations?.marathi && (
                  <div className="translations-col">
                    <SectionLabel>Marathi — मराठी अनुवाद</SectionLabel>
                    <p className="marathi-text" lang="mr">{verse.translations.marathi}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Commentaries */}
          {verse.commentaries && Object.keys(verse.commentaries).length > 0 && (
            <CommentaryPanel verse={verse} />
          )}

          {/* Download */}
          <div className="shloka-download-bar">
            <button className="shloka-download-btn" onClick={handleDownload} aria-label="Download this verse as text file">
              <DownloadIcon /> Download Verse
            </button>
          </div>

        </article>
      )}
    </div>
  )
}
