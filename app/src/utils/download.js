/**
 * Download utilities — JSON and PDF export for shlokas / chapters.
 */

// ── JSON ──────────────────────────────────────────────────────────────────────

export function downloadVerseJSON(verse, chapterMeta) {
  const payload = {
    source:  'GitaSaar — https://gitasaar.vercel.app',
    license: 'Public Domain / CC0',
    chapter: chapterMeta
      ? { number: chapterMeta.chapter_number, name: chapterMeta.name_transliterated }
      : undefined,
    verse,
  }
  triggerJSONDownload(payload, `gita-ch${verse.verse_number}-bg.json`)
}

export function downloadChapterJSON(chapter) {
  const payload = {
    source:  'GitaSaar — https://gitasaar.vercel.app',
    license: 'Public Domain / CC0',
    chapter,
  }
  triggerJSONDownload(payload, `gita-chapter-${chapter.chapter_number}.json`)
}

function triggerJSONDownload(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  triggerDownload(blob, filename)
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function downloadVersePDF(verse, chapterMeta, activeCommentaries, commentaryMeta) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })

  const W = doc.internal.pageSize.getWidth()
  const margin = 60
  const contentW = W - margin * 2
  let y = 60

  const addPage = () => { doc.addPage(); y = 60 }
  const checkY = (needed = 40) => { if (y + needed > doc.internal.pageSize.getHeight() - 60) addPage() }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(200, 80, 0)
  doc.text('GitaSaar', margin, y)
  y += 28

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  const ref = chapterMeta
    ? `Chapter ${chapterMeta.chapter_number}: ${chapterMeta.name_transliterated} — Verse ${verse.verse_number}`
    : `Verse ${verse.verse_number}`
  doc.text(ref, margin, y)
  y += 18

  // Divider
  doc.setDrawColor(230, 130, 0)
  doc.setLineWidth(1.5)
  doc.line(margin, y, W - margin, y)
  y += 20

  // Sanskrit
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(180, 50, 0)
  doc.text('SANSKRIT', margin, y)
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const skLines = doc.splitTextToSize(verse.text_sanskrit || '', contentW)
  skLines.forEach(l => { checkY(); doc.text(l, margin, y); y += 15 })
  y += 6

  if (verse.text_transliteration) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    const trLines = doc.splitTextToSize(verse.text_transliteration, contentW)
    trLines.forEach(l => { checkY(); doc.text(l, margin, y); y += 13 })
    y += 8
  }

  // Translations
  const translations = [
    { key: 'english_sivananda',    label: 'ENGLISH — Swami Sivananda' },
    { key: 'english_bhaktivedanta', label: 'ENGLISH — A.C. Bhaktivedanta' },
    { key: 'marathi',              label: 'MARATHI' },
  ]

  translations.forEach(({ key, label }) => {
    const text = verse.translations?.[key]
    if (!text) return
    checkY(50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(80, 80, 80)
    doc.text(label, margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    const lines = doc.splitTextToSize(text, contentW)
    lines.forEach(l => { checkY(); doc.text(l, margin, y); y += 14 })
    y += 8
  })

  // Commentaries
  if (activeCommentaries?.size && verse.commentaries) {
    checkY(40)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, W - margin, y)
    y += 18

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(200, 80, 0)
    doc.text('COMMENTARIES', margin, y)
    y += 20

    activeCommentaries.forEach(id => {
      const text = verse.commentaries?.[id]
      if (!text) return
      const meta = commentaryMeta?.[id]
      checkY(60)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      doc.text(meta?.label || id, margin, y)
      if (meta?.tradition) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(140, 140, 140)
        doc.text(meta.tradition, margin + doc.getTextWidth(meta.label || id) + 8, y)
      }
      y += 14
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(50, 50, 50)
      const cLines = doc.splitTextToSize(text, contentW)
      cLines.forEach(l => { checkY(); doc.text(l, margin, y); y += 13 })
      y += 12
    })
  }

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text('GitaSaar · gitasaar.vercel.app · Public Domain', margin, doc.internal.pageSize.getHeight() - 30)

  doc.save(`gita-ch${chapterMeta?.chapter_number || '?'}-v${verse.verse_number}.pdf`)
}

export async function downloadChapterPDF(chapter) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })

  const W = doc.internal.pageSize.getWidth()
  const margin = 60
  const contentW = W - margin * 2
  let y = 60

  const addPage = () => { doc.addPage(); y = 60 }
  const checkY = (needed = 40) => { if (y + needed > doc.internal.pageSize.getHeight() - 60) addPage() }

  // Title page
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(200, 80, 0)
  doc.text('GitaSaar', margin, y); y += 36

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text(`Chapter ${chapter.chapter_number}: ${chapter.name_transliterated}`, margin, y); y += 22

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(chapter.name_meaning || '', margin, y); y += 30

  if (chapter.chapter_summary) {
    doc.setFontSize(10)
    doc.setTextColor(70, 70, 70)
    const sumLines = doc.splitTextToSize(chapter.chapter_summary, contentW)
    sumLines.forEach(l => { checkY(); doc.text(l, margin, y); y += 14 })
    y += 20
  }

  doc.setDrawColor(200, 130, 0)
  doc.setLineWidth(1)
  doc.line(margin, y, W - margin, y); y += 28

  // Verses
  chapter.verses?.forEach(verse => {
    checkY(80)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(180, 60, 0)
    doc.text(`Verse ${chapter.chapter_number}.${verse.verse_number}`, margin, y); y += 18

    if (verse.text_sanskrit) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(60, 60, 60)
      const lines = doc.splitTextToSize(verse.text_sanskrit, contentW)
      lines.forEach(l => { checkY(); doc.text(l, margin, y); y += 14 })
      y += 4
    }

    const eng = verse.translations?.english_sivananda || verse.translations?.english_bhaktivedanta
    if (eng) {
      doc.setFontSize(9.5)
      doc.setTextColor(50, 50, 50)
      const lines = doc.splitTextToSize(eng, contentW)
      lines.forEach(l => { checkY(); doc.text(l, margin, y); y += 13 })
      y += 4
    }

    y += 16
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    checkY(10)
    doc.line(margin, y, W - margin, y)
    y += 16
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text('GitaSaar · gitasaar.vercel.app · Public Domain', margin, doc.internal.pageSize.getHeight() - 30)

  doc.save(`gita-chapter-${chapter.chapter_number}.pdf`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
