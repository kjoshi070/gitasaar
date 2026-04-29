import { useGita } from '../../context/GitaContext'

export default function CommentaryPanel({ verse }) {
  const { COMMENTARY_IDS, COMMENTARY_META, activeCommentaries, toggleCommentary } = useGita()

  if (!verse.commentaries) return null

  // All commentary IDs present on this verse (known + any extras from scraper)
  const presentIds = Object.keys(verse.commentaries).filter(id => verse.commentaries[id])
  if (!presentIds.length) return null

  // Order: known IDs first (in their defined order), then any unknown extras
  const knownPresent   = COMMENTARY_IDS.filter(id => presentIds.includes(id))
  const unknownPresent = presentIds.filter(id => !COMMENTARY_IDS.includes(id))
  const allPresent     = [...knownPresent, ...unknownPresent]

  const visibleIds = allPresent.filter(id => activeCommentaries.has(id))

  function getMeta(id) {
    const m = COMMENTARY_META[id]
    if (m) return m
    // Fallback label for unrecognized IDs — capitalize first letter
    return { label: id.charAt(0).toUpperCase() + id.slice(1), tradition: '' }
  }

  return (
    <section className="shloka-section commentary-section" aria-label="Commentaries">
      <div className="shloka-section__label" style={{ marginBottom: 16 }}>
        <span className="shloka-section__label-dot" />
        Commentaries
      </div>

      {/* Toggle buttons */}
      <div className="commentary-toggles" role="group" aria-label="Select commentaries to display">
        {allPresent.map(id => {
          const meta   = getMeta(id)
          const active = activeCommentaries.has(id)
          return (
            <button
              key={id}
              className={`commentary-toggle-btn${active ? ' commentary-toggle-btn--active' : ''}`}
              onClick={() => toggleCommentary(id)}
              aria-pressed={active}
              title={meta.tradition}
            >
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Commentary bodies */}
      {visibleIds.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          letterSpacing: '-0.224px',
          color: 'var(--text-tertiary)',
          padding: '16px 0',
        }}>
          Select a commentary above to display it.
        </p>
      ) : (
        visibleIds.map(id => {
          const meta = getMeta(id)
          const text = verse.commentaries[id]
          return (
            <div key={id} className="commentary-panel" aria-label={`Commentary by ${meta.label}`}>
              <div className="commentary-panel__header">
                <div>
                  <div className="commentary-panel__author">{meta.label}</div>
                  {meta.tradition && (
                    <div className="commentary-panel__tradition">{meta.tradition}</div>
                  )}
                </div>
              </div>
              <div className="commentary-panel__body">{text}</div>
            </div>
          )
        })
      )}
    </section>
  )
}
