import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useGita } from '../../context/GitaContext'

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  )
}

export default function LandingPage() {
  const { index, loadIndex } = useGita()

  useEffect(() => { loadIndex() }, [loadIndex])

  return (
    <div className="landing">

      {/* ── Hero — black cinematic section ── */}
      <section className="landing__hero" aria-label="Hero">
        <div className="landing__hero-fallback" />
        <img
          src="/images/krishna.jpg"
          alt="Lord Krishna"
          className="landing__hero-img"
          onError={e => { e.currentTarget.style.display = 'none' }}
          loading="eager"
        />
        <div className="landing__hero-overlay" />
        <div className="landing__hero-content">
          <div className="landing__hero-Sanskrit">श्रीमद्भगवद्गीता</div>
          <h1 className="landing__hero-title">गीतासार</h1>
          <p className="landing__hero-sub">The Song of the Lord — Sanskrit · Marathi · English</p>
          <div className="landing__hero-ctas">
            <Link to="/chapter/1" className="btn-pill btn-pill--outline-dark">
              Start Reading ›
            </Link>
            <Link to="/about" className="btn-pill btn-pill--filled">
              About
            </Link>
            <Link to="/credits" className="btn-pill btn-pill--filled">
              Credits
            </Link>
          </div>
        </div>
      </section>

      {/* ── Body — light section ── */}
      <div className="landing__body">

        {/* Intro */}
        <h2 className="landing__section-heading">The Eternal Dialogue</h2>
        <p className="landing__intro">
          The Bhagavad Gita — spoken by Sri Krishna to Arjuna on the battlefield of Kurukshetra —
          is presented here in the original Sanskrit with Marathi and English translations,
          alongside four great commentaries spanning two millennia of thought.
        </p>

        {/* Chapters Grid */}
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.31rem',
          fontWeight: 700,
          letterSpacing: '0.231px',
          lineHeight: 1.19,
          color: 'var(--text-primary)',
          marginBottom: 20,
        }}>
          All 18 Chapters
        </h2>

        {index ? (
          <div className="landing__chapters-grid">
            {index.chapters.map(ch => (
              <Link
                key={ch.chapter_number}
                to={`/chapter/${ch.chapter_number}`}
                className="chapter-card"
              >
                <div className="chapter-card__num">Chapter {ch.chapter_number}</div>
                <div className="chapter-card__sanskrit">{ch.name_sanskrit}</div>
                <div className="chapter-card__name">{ch.name_transliterated}</div>
                <div className="chapter-card__count">{ch.verse_count} shlokas</div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 8 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
