import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useGita } from '../../context/GitaContext'

export default function ChapterPage() {
  const { chapterId } = useParams()
  const id = Number(chapterId)
  const { index, chapters, loading, errors, loadChapter } = useGita()

  useEffect(() => { loadChapter(id) }, [id, loadChapter])

  const chapterMeta = useMemo(
    () => index?.chapters?.find(c => c.chapter_number === id),
    [index, id]
  )
  const chapterData = chapters[id]
  const isLoading   = loading[id]
  const error       = errors[id]

  // Build verse list from loaded data or metadata stub
  const verseList = useMemo(() => {
    if (chapterData?.verses?.length) return chapterData.verses
    if (chapterMeta?.verse_count) {
      return Array.from({ length: chapterMeta.verse_count }, (_, i) => ({
        verse_number: i + 1,
        _stub: true,
      }))
    }
    return []
  }, [chapterData, chapterMeta])

  if (!chapterMeta && !isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🕉</div>
        <div className="empty-state__title">Chapter not found</div>
        <Link to="/" className="btn-primary">← Back Home</Link>
      </div>
    )
  }

  return (
    <div className="chapter-page">
      {/* Header */}
      <header className="chapter-page__header">
        <div className="chapter-page__num">Chapter {id}</div>

        {chapterMeta ? (
          <>
            <h1 className="chapter-page__title">{chapterMeta.name_sanskrit}</h1>
            <h2 className="chapter-page__subtitle">{chapterMeta.name_transliterated}</h2>
            {chapterMeta.chapter_summary && (
              <p className="chapter-page__summary">{chapterMeta.chapter_summary}</p>
            )}
          </>
        ) : (
          <>
            <div className="skeleton" style={{ height: 48, width: 280, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 28, width: 200, marginBottom: 20 }} />
            <div className="skeleton" style={{ height: 72, width: '100%', maxWidth: 680 }} />
          </>
        )}

        {!chapterData && !isLoading && !error && (
          <div className="no-data-notice" style={{ marginTop: 20 }}>
            ⚠ Run <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '1px 4px', borderRadius: 3 }}>data-collection/fetch_gita_data.py</code> to populate full verse content.
          </div>
        )}

        {error && (
          <div className="no-data-notice" style={{ marginTop: 20, borderColor: 'rgba(255,60,0,0.3)', color: '#c0392b' }}>
            ⚠ Could not load chapter data. Have you run the data collection script?
          </div>
        )}
      </header>

      {/* Verse grid */}
      {isLoading ? (
        <div className="shloka-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div className="shloka-grid">
          {verseList.map(verse => (
            <Link
              key={verse.verse_number}
              to={`/chapter/${id}/verse/${verse.verse_number}`}
              className={`shloka-card${!verse._stub ? ' shloka-card--sample' : ''}`}
            >
              <div className="shloka-card__chapter">Chapter {id}</div>
              <div className="shloka-card__verse">Verse {verse.verse_number}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
