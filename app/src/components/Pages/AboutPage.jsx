import { Link } from 'react-router-dom'

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function SectionEyebrow({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '-0.12px',
      textTransform: 'uppercase',
      color: 'var(--accent)',
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
      fontWeight: 600,
      lineHeight: 1.10,
      letterSpacing: 'normal',
      color: 'var(--text-primary)',
      marginBottom: 24,
      paddingBottom: 16,
      borderBottom: '1px solid var(--divider)',
    }}>
      {children}
    </h2>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="credits-page">

      {/* ══ HERO — black cinematic section ══════════════════════════════════════ */}
      <div className="credits-hero">
        <div className="credits-hero__eyebrow">About GitaSaar</div>
        <h1 className="credits-hero__title">
          Everything in one place.
        </h1>
        <p className="credits-hero__subtitle">
          The original Sanskrit. A Marathi translation. Two English translations, commentaries. All in one reader — free, open, and deployable anywhere.
        </p>
      </div>

      {/* ══ THE STORY ════════════════════════════════════════════════════════════ */}
      <section className="credits-section">
        <SectionEyebrow>Why I built this</SectionEyebrow>
        <SectionHeading>The motivation behind this website:</SectionHeading>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 32,
          marginBottom: 8,
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.0625rem',
              lineHeight: 1.47,
              letterSpacing: '-0.374px',
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}>
              I grew up in Pune, Maharashtra and completed my basic school education in a Marathi school. 
              Hence reading any text in Marathi is more appealing to me than any other language. 
              I wanted to read the Bhagavad Gita the way it deserves to be read — in
              the original Sanskrit, followed by its translation into one’s most comfortable language and 
              finally in authoritative English renderings, and with the great commentaries
              available for deeper study.
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.0625rem',
              lineHeight: 1.47,
              letterSpacing: '-0.374px',
              color: 'var(--text-secondary)',
            }}>
              I searched for a single place that offered all of this together. I found
              sites with Sanskrit only, sites with one English translation, sites
              buried in ads, and sites with commentaries but no Marathi. I could not find
              a single source online which has the original Sanskrit shloka, Marathi
              translation, English translations and commentaries — all in one place.
            </p>
          </div>
          <div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.0625rem',
              lineHeight: 1.47,
              letterSpacing: '-0.374px',
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}>
              So I decided to build one. GitaSaar is that reader — a clean, fast,
              open-source interface to all 700 shlokas across 18 chapters, presented
              without clutter, without ads, and without barriers.
            </p>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.0625rem',
              lineHeight: 1.47,
              letterSpacing: '-0.374px',
              color: 'var(--text-secondary)',
            }}>
              The name <em>GitaSaar</em> — गीतासार — means “the essence of the Gita.”
              That is the aspiration: not just to store the text, but to make its wisdom
              genuinely accessible to anyone who seeks it, in whichever language feels
              closest to home.
            </p>
          </div>
        </div>
      </section>

      {/* ══ CONTACT — Apple Blue callout ═════════════════════════════════════════ */}
      <section className="credits-section">
        <div style={{
          background: 'var(--hero-bg)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          transition: 'background var(--transition-slow)',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '-0.12px',
            textTransform: 'uppercase',
            color: 'var(--accent-dark)',
          }}>
            Get in touch
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 600,
            lineHeight: 1.10,
            color: 'var(--hero-text)',
            letterSpacing: '-0.28px',
          }}>
            Have questions or comments?
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            lineHeight: 1.47,
            letterSpacing: '-0.374px',
            color: 'var(--hero-text-sub)',
            maxWidth: 520,
          }}>
            Spotted an error in a translation? Have a suggestion for improving the
            reader? Know of a better data source for Marathi translations? I’d love
            to hear from you.
          </p>
          <div style={{ marginTop: 8 }}>
            <a
              href="mailto:kedar.joshi070@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'var(--font-display)',
                fontSize: '1.31rem',
                fontWeight: 700,
                letterSpacing: '0.231px',
                color: 'var(--accent-dark)',
                textDecoration: 'none',
                lineHeight: 1.19,
              }}
            >
              kedar.joshi070@gmail.com ↗
            </a>
          </div>
        </div>
      </section>

      {/* ══ CREDITS CALLOUT ══════════════════════════════════════════════════════ */}
      <section className="credits-section">
        <div style={{
          background: 'var(--bg-subtle, var(--bg-page))',
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '-0.12px',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}>
            Acknowledgements
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 600,
            lineHeight: 1.10,
            color: 'var(--text-primary)',
            letterSpacing: '-0.28px',
          }}>
            Commentators, data sources &amp; technology
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            lineHeight: 1.47,
            letterSpacing: '-0.374px',
            color: 'var(--text-secondary)',
            maxWidth: 520,
          }}>
            GitaSaar stands on the shoulders of scholars, saints, and software engineers
            across two millennia. See the full credits page for every acknowledgement.
          </p>
          <div style={{ marginTop: 8 }}>
            <Link to="/credits" className="btn-pill btn-pill--outline-dark">
              View Credits ›
            </Link>
          </div>
        </div>
      </section>

      {/* ══ BACK LINK ════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 48 }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            letterSpacing: '-0.224px',
            color: 'var(--link)',
            textDecoration: 'none',
          }}
        >
          ← Back to GitaSaar
        </Link>
      </div>

    </div>
  )
}
