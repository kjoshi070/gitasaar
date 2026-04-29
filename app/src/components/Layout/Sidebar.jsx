import { useState, useMemo } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useGita } from '../../context/GitaContext'

function ChevronIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function ChapterItem({ chapter, isActive, currentVerseId }) {
  const [open, setOpen] = useState(isActive)
  const { loadChapter, chapters } = useGita()
  const chapterData = chapters[chapter.chapter_number]

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) loadChapter(chapter.chapter_number)
  }

  const verseLinks = useMemo(() => {
    if (chapterData?.verses?.length) {
      return chapterData.verses.map(v => ({ num: v.verse_number, hasData: true }))
    }
    return Array.from({ length: chapter.verse_count }, (_, i) => ({ num: i + 1, hasData: false }))
  }, [chapterData, chapter.verse_count])

  return (
    <div className="chapter-item">
      <button
        className={`chapter-toggle${open ? ' chapter-toggle--open' : ''}${isActive ? ' chapter-toggle--active' : ''}`}
        onClick={handleToggle}
        aria-expanded={open}
      >
        <span className="chapter-toggle__number">{chapter.chapter_number}</span>
        <span className="chapter-toggle__name">{chapter.name_transliterated}</span>
        <ChevronIcon className="chapter-toggle__chevron" />
      </button>

      <div className={`verse-list${open ? ' verse-list--open' : ''}`}>
        {verseLinks.map(({ num }) => {
          const isVerseActive = isActive && Number(currentVerseId) === num
          return (
            <Link
              key={num}
              to={`/chapter/${chapter.chapter_number}/verse/${num}`}
              className={`verse-link${isVerseActive ? ' verse-link--active' : ''}`}
            >
              {chapter.chapter_number}.{num}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function Sidebar({ isOpen }) {
  const { index } = useGita()
  const { chapterId, verseId } = useParams()
  const location = useLocation()
  const isHome    = location.pathname === '/'
  const isAbout   = location.pathname === '/about'
  const isCredits = location.pathname === '/credits'

  return (
    <aside
      className={`sidebar${isOpen ? ' sidebar--open' : ''}`}
      aria-label="Navigation"
    >
      {/* Logo */}
      <div className="sidebar__logo">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="sidebar__logo-title" style={{ fontFamily: 'var(--font-devanagari)' }}>गीतासार</div>
          <div className="sidebar__logo-sub">श्रीमद्भगवद्गीता</div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        {/* Home link */}
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 20px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            letterSpacing: '-0.224px',
            color: isHome ? 'var(--accent)' : 'var(--text-secondary)',
            background: isHome ? 'var(--bg-active)' : 'none',
            fontWeight: isHome ? 500 : 400,
            transition: 'all var(--transition)',
          }}
        >
          <HomeIcon />
          Home
        </Link>

        {/* Chapter section label */}
        <div className="sidebar__section-label">Bhagavad Gita</div>

        {/* Chapters */}
        {index?.chapters?.map(ch => (
          <ChapterItem
            key={ch.chapter_number}
            chapter={ch}
            isActive={Number(chapterId) === ch.chapter_number}
            currentVerseId={verseId}
          />
        ))}

        {/* Placeholder while loading */}
        {!index && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 38, margin: '4px 12px', borderRadius: 8 }} />
          ))
        )}
      </nav>

      {/* About & Credits links in footer */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Link
          to="/about"
          className="sidebar__credits-link"
          style={isAbout ? { color: 'var(--accent)' } : undefined}
        >
          <InfoIcon />
          About
        </Link>
        <Link
          to="/credits"
          className="sidebar__credits-link"
          style={isCredits ? { color: 'var(--accent)' } : undefined}
        >
          <InfoIcon />
          Credits
        </Link>
      </div>
    </aside>
  )
}
