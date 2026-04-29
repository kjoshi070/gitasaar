import { useLocation, useParams, Link } from 'react-router-dom'
import { useGita } from '../../context/GitaContext'
import ThemeToggle  from '../UI/ThemeToggle'
import DownloadButton from '../UI/DownloadButton'

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function Sep() {
  return <span className="header__breadcrumb-sep" aria-hidden="true">›</span>
}

function Breadcrumb() {
  const { chapterId, verseId } = useParams()
  const { index } = useGita()
  const location = useLocation()

  if (location.pathname === '/') return null

  const chapter = index?.chapters?.find(c => c.chapter_number === Number(chapterId))

  return (
    <nav aria-label="Breadcrumb" className="header__breadcrumb">
      <Link to="/">Home</Link>
      {chapterId && (
        <>
          <Sep />
          <Link to={`/chapter/${chapterId}`}>
            Ch.&nbsp;{chapterId}{chapter ? ` — ${chapter.name_transliterated}` : ''}
          </Link>
        </>
      )}
      {verseId && (
        <>
          <Sep />
          <span className="header__breadcrumb-current">Verse {chapterId}.{verseId}</span>
        </>
      )}
    </nav>
  )
}

export default function Header({ onMenuToggle }) {
  const { chapterId, verseId } = useParams()
  const { index, chapters } = useGita()
  const location = useLocation()

  const downloadContext = (() => {
    if (verseId && chapterId) {
      const ch = chapters[Number(chapterId)]
      const verse = ch?.verses?.find(v => v.verse_number === Number(verseId))
      return verse ? { type: 'verse', data: verse, chapterMeta: index?.chapters?.find(c => c.chapter_number === Number(chapterId)) } : null
    }
    if (chapterId) {
      const ch = chapters[Number(chapterId)]
      return ch ? { type: 'chapter', data: ch } : null
    }
    return null
  })()

  return (
    <header className="header" role="banner">
      <button className="header__menu-btn" onClick={onMenuToggle} aria-label="Toggle navigation">
        <MenuIcon />
      </button>

      {location.pathname === '/' ? (
        <span className="header__home-label">
          GitaSaar — Bhagavad Gita
        </span>
      ) : (
        <Breadcrumb />
      )}

      <div className="header__actions">
        {downloadContext && <DownloadButton context={downloadContext} />}
        <ThemeToggle />
      </div>
    </header>
  )
}
