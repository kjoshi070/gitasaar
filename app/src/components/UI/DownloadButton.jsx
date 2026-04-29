import { useState, useRef, useEffect, useCallback } from 'react'
import { useGita } from '../../context/GitaContext'
import {
  downloadVerseJSON,
  downloadChapterJSON,
  downloadVersePDF,
  downloadChapterPDF,
} from '../../utils/download'

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export default function DownloadButton({ context }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const { activeCommentaries, COMMENTARY_META } = useGita()
  const menuRef = useRef(null)
  const btnRef  = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const run = useCallback(async (fn) => {
    setBusy(true)
    setOpen(false)
    try { await fn() } catch (e) { console.error('Download failed', e) } finally { setBusy(false) }
  }, [])

  const items = context?.type === 'verse' ? [
    { label: '↓  This Shloka as PDF',  action: () => run(() => downloadVersePDF(context.data, context.chapterMeta, activeCommentaries, COMMENTARY_META)) },
    { label: '↓  This Shloka as JSON', action: () => run(() => downloadVerseJSON(context.data, context.chapterMeta)) },
  ] : context?.type === 'chapter' ? [
    { label: '↓  Chapter as PDF',  action: () => run(() => downloadChapterPDF(context.data)) },
    { label: '↓  Chapter as JSON', action: () => run(() => downloadChapterJSON(context.data)) },
  ] : []

  if (!items.length) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        className="download-btn"
        onClick={() => setOpen(v => !v)}
        disabled={busy}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <DownloadIcon />
        {busy ? 'Exporting…' : 'Export'}
      </button>

      {open && (
        <div ref={menuRef} className="download-menu" role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              className="download-menu__item"
              onClick={item.action}
              role="menuitem"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
