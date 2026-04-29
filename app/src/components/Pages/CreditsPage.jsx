import { Link } from 'react-router-dom'

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const COMMENTATORS = [
  {
    role: 'Translation & Commentary',
    name: 'Swami Sivananda',
    tradition: 'Divine Life Society (1887 – 1963)',
    desc: "A physician-turned-monk whose commentary synthesizes Advaita Vedanta, Bhakti, and Karma Yoga into a practical guide for modern seekers. His word-for-word meanings and English translation remain among the most widely used in the world.",
    source: 'Divine Life Society — Rishikesh, India',
    link: 'https://www.dlshq.org',
  },
  {
    role: 'Translation & Purport',
    name: 'A.C. Bhaktivedanta Swami Prabhupada',
    tradition: 'ISKCON — International Society for Krishna Consciousness (1896 – 1977)',
    desc: "Founder of ISKCON, whose \"Bhagavad-gita As It Is\" presents the Vaishnava Bhakti tradition with meticulous Sanskrit scholarship and extensive purports reaching millions of readers worldwide.",
    source: 'Bhaktivedanta Book Trust — Los Angeles, USA',
    link: 'https://www.bbt.info',
  },
  {
    role: 'Commentary',
    name: 'Adi Shankaracharya',
    tradition: 'Advaita Vedanta (c. 788 – 820 CE)',
    desc: "The foundational Bhashya of Advaita Vedanta — Shankaracharya's commentary interprets the Gita as pointing toward the non-dual nature of Brahman. His work shaped the entire trajectory of Hindu philosophy for over a millennium.",
    source: 'Traditional — public domain Sanskrit original',
    link: null,
  },
  {
    role: 'Essays & Commentary',
    name: 'Sri Aurobindo',
    tradition: 'Integral Yoga — Pondicherry (1872 – 1950)',
    desc: "In \"Essays on the Gita,\" Sri Aurobindo reads the text as a scripture of spiritual evolution, synthesising Western and Vedantic thought. His interpretation emphasises the transformation of human consciousness as the Gita's deepest message.",
    source: 'Sri Aurobindo Ashram — Pondicherry, India',
    link: 'https://www.sriaurobindoashram.org',
  },
]

const DATA_SOURCES = [
  {
    name: 'vedicscriptures.github.io',
    desc: 'Primary data source. A GitHub Pages JSON API providing Sanskrit text, Roman transliteration, and translations from Swami Sivananda, Swami Gambhirananda, Swami Tejomayananda, Swami Anandagiri, and Adi Shankaracharya.',
    link: 'https://vedicscriptures.github.io',
  },
  {
    name: 'Vedabase.io',
    desc: "Secondary source for Bhaktivedanta Swami Prabhupada's translation and purports, maintained by the Bhaktivedanta Book Trust — the authoritative digital home of Prabhupada's works.",
    link: 'https://vedabase.io',
  },
  {
    name: 'IIT Kanpur — Gita Supersite',
    desc: 'Comprehensive academic repository maintained by the Indian Institute of Technology Kanpur, covering all major Sanskrit commentaries and multilingual translations including Marathi.',
    link: 'https://www.gitasupersite.iitk.ac.in',
  },
]

const TECH = [
  { name: 'React 18',               desc: 'UI framework — Meta' },
  { name: 'Vite',                   desc: 'Build tool — Evan You' },
  { name: 'React Router v6',        desc: 'Navigation — Remix' },
  { name: 'jsPDF + html2canvas',    desc: 'PDF export' },
  { name: 'Vitest',                 desc: 'Unit testing' },
  { name: 'Noto Sans Devanagari',   desc: 'Sanskrit / Marathi typeface — Google Fonts' },
  { name: 'Service Worker',         desc: 'Client-side REST API — no backend needed' },
  { name: 'Vercel',                 desc: 'Static hosting — zero backend, global edge CDN' },
]

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

function CreditCard({ card }) {
  return (
    <div className="credits-card">
      <div className="credits-card__role">{card.role}</div>
      <div className="credits-card__name">{card.name}</div>
      {card.tradition && <div className="credits-card__tradition">{card.tradition}</div>}
      <div className="credits-card__desc">{card.desc}</div>
      {card.source && (
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-tertiary)', letterSpacing: '-0.12px' }}>
          {card.link
            ? <a href={card.link} target="_blank" rel="noreferrer" style={{ color: 'var(--link)' }}>{card.source} ↗</a>
            : card.source}
        </div>
      )}
    </div>
  )
}

function TechPill({ name, desc }) {
  return (
    <div style={{
      background: 'var(--bg-page)',
      borderRadius: 'var(--radius-sm)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '-0.374px',
        color: 'var(--text-primary)',
      }}>
        {name}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.75rem',
        letterSpacing: '-0.12px',
        color: 'var(--text-tertiary)',
        lineHeight: 1.33,
      }}>
        {desc}
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function CreditsPage() {
  return (
    <div className="credits-page">

      {/* ══ HERO — black cinematic section ══════════════════════════════════════ */}
      <div className="credits-hero">
        <div className="credits-hero__eyebrow">GitaSaar</div>
        <h1 className="credits-hero__title">
          Credits &amp; Sources
        </h1>
        <p className="credits-hero__subtitle">
          GitaSaar stands on the shoulders of scholars, saints, and software engineers
          across two millennia. This page acknowledges every voice that made it possible.
        </p>
      </div>

      {/* ══ COMMENTATORS ═════════════════════════════════════════════════════════ */}
      <section className="credits-section">
        <SectionEyebrow>Acknowledgements</SectionEyebrow>
        <SectionHeading>Commentators &amp; Translators</SectionHeading>
        <div className="credits-grid">
          {COMMENTATORS.map(c => <CreditCard key={c.name} card={c} />)}
        </div>
      </section>

      {/* ══ DATA SOURCES ═════════════════════════════════════════════════════════ */}
      <section className="credits-section">
        <SectionEyebrow>Data</SectionEyebrow>
        <SectionHeading>Sources</SectionHeading>
        <div className="credits-grid">
          {DATA_SOURCES.map(s => (
            <CreditCard
              key={s.name}
              card={{
                role: 'Data Source',
                name: s.name,
                tradition: null,
                desc: s.desc,
                source: s.link ? s.link : null,
                link: s.link,
              }}
            />
          ))}
        </div>
      </section>

      {/* ══ TECHNOLOGY ═══════════════════════════════════════════════════════════ */}
      <section className="credits-section">
        <SectionEyebrow>Built with</SectionEyebrow>
        <SectionHeading>Technology</SectionHeading>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {TECH.map(t => <TechPill key={t.name} name={t.name} desc={t.desc} />)}
        </div>
      </section>

      {/* ══ LEGAL ════════════════════════════════════════════════════════════════ */}
      <section className="credits-section">
        <SectionEyebrow>Legal</SectionEyebrow>
        <SectionHeading>Licensing &amp; Copyright</SectionHeading>
        <div className="credits-legal">
          <p style={{ marginBottom: 12 }}>
            <strong>GitaSaar application code</strong> is released under the{' '}
            <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer">MIT License</a>.
            You are free to use, modify, and distribute it with attribution.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Gita text and Sanskrit content</strong> is in the public domain.
            The Bhagavad Gita was composed thousands of years ago by Bhagwan Krishna; no copyright
            applies to the original text.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Swami Sivananda’s translation</strong> is © The Divine Life Society
            and used under their open distribution terms for non-commercial, educational use.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Bhaktivedanta Swami’s translation and purports</strong> are ©
            Bhaktivedanta Book Trust. Used via vedabase.io under their terms for
            non-commercial spiritual education.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Sri Aurobindo’s essays</strong> are © Sri Aurobindo Ashram Trust
            and distributed freely for non-commercial spiritual and educational purposes.
          </p>
          <p>
            <strong>Adi Shankaracharya’s Bhashya</strong> (c. 8th century CE) is in
            the public domain.
          </p>
        </div>
      </section>

      {/* ══ BACK LINKS ═══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 48, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          to="/about"
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
          ← About GitaSaar
        </Link>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            letterSpacing: '-0.224px',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
          }}
        >
          ← Back to GitaSaar
        </Link>
      </div>

    </div>
  )
}
