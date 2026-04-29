import { createContext, useContext, useReducer, useCallback } from 'react'

const GitaContext = createContext(null)

// All known commentary IDs — CommentaryPanel uses this for toggle buttons
// and for persisting user preferences. Unknown IDs found in verse data are
// shown dynamically even if not listed here (see CommentaryPanel).
const COMMENTARY_IDS = [
  'sivananda',
  'bhaktivedanta',
  'shankaracharya',
  'aurobindo',
  'anandagiri',
  'chinmayananda',
  'tejomayananda',
  'gambhirananda',
]

const COMMENTARY_META = {
  sivananda:      { label: 'Swami Sivananda',        tradition: 'Divine Life Society' },
  bhaktivedanta:  { label: 'A.C. Bhaktivedanta',     tradition: 'ISKCON / Vaishnava' },
  shankaracharya: { label: 'Adi Shankaracharya',      tradition: 'Advaita Vedanta (8th c.)' },
  aurobindo:      { label: 'Sri Aurobindo',           tradition: 'Integral Yoga' },
  anandagiri:     { label: 'Swami Anandagiri',        tradition: 'Advaita Vedanta' },
  chinmayananda:  { label: 'Swami Chinmayananda',     tradition: 'Chinmaya Mission' },
  tejomayananda:  { label: 'Swami Tejomayananda',     tradition: 'Chinmaya Mission' },
  gambhirananda:  { label: 'Swami Gambhirananda',     tradition: 'Ramakrishna Mission' },
}

// Translation display names — used to render each translation block
const TRANSLATION_META = {
  english_sivananda:     { label: 'Swami Sivananda',        lang: 'en' },
  english_bhaktivedanta: { label: 'A.C. Bhaktivedanta',     lang: 'en' },
  english_gambhirananda: { label: 'Swami Gambhirananda',    lang: 'en' },
  english_purohit:       { label: 'Purohit Swami',          lang: 'en' },
  marathi:               { label: 'मराठी अनुवाद',           lang: 'mr' },
}

const COMMENTARY_STORAGE_KEY = 'gitasaar-commentaries-v3'

function loadCommentaryPrefs() {
  try {
    const raw = localStorage.getItem(COMMENTARY_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Accept any string array (allows forward-compatibility with new IDs)
      if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
        return new Set(parsed)
      }
    }
  } catch (_e) { /* storage unavailable */ }
  // Default: only Adi Shankaracharya enabled — user can toggle others on
  return new Set(['shankaracharya'])
}

function saveCommentaryPrefs(set) {
  try {
    localStorage.setItem(COMMENTARY_STORAGE_KEY, JSON.stringify([...set]))
  } catch (_e) { /* storage unavailable */ }
}

const initialState = {
  index: null,
  chapters: {},
  loading: {},
  errors: {},
  activeCommentaries: loadCommentaryPrefs(),
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INDEX':
      return { ...state, index: action.payload }
    case 'CHAPTER_LOADING':
      return { ...state, loading: { ...state.loading, [action.id]: true } }
    case 'CHAPTER_LOADED':
      return {
        ...state,
        chapters: { ...state.chapters, [action.id]: action.payload },
        loading:  { ...state.loading, [action.id]: false },
      }
    case 'CHAPTER_ERROR':
      return {
        ...state,
        errors:  { ...state.errors, [action.id]: action.error },
        loading: { ...state.loading, [action.id]: false },
      }
    case 'TOGGLE_COMMENTARY': {
      const next = new Set(state.activeCommentaries)
      next.has(action.id) ? next.delete(action.id) : next.add(action.id)
      saveCommentaryPrefs(next)
      return { ...state, activeCommentaries: next }
    }
    default:
      return state
  }
}

export function GitaProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadIndex = useCallback(async () => {
    if (state.index) return
    try {
      const res = await fetch('/data/index.json')
      const data = await res.json()
      dispatch({ type: 'SET_INDEX', payload: data })
    } catch (e) {
      console.error('Failed to load index.json', e)
    }
  }, [state.index])

  const loadChapter = useCallback(async (chapterId) => {
    const id = Number(chapterId)
    if (state.chapters[id] || state.loading[id]) return
    dispatch({ type: 'CHAPTER_LOADING', id })
    try {
      const res = await fetch(`/data/chapter-${id}.json`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      dispatch({ type: 'CHAPTER_LOADED', id, payload: data })
    } catch (e) {
      dispatch({ type: 'CHAPTER_ERROR', id, error: e.message })
    }
  }, [state.chapters, state.loading])

  const toggleCommentary = useCallback((id) => {
    dispatch({ type: 'TOGGLE_COMMENTARY', id })
  }, [])

  return (
    <GitaContext.Provider value={{
      ...state,
      COMMENTARY_IDS,
      COMMENTARY_META,
      TRANSLATION_META,
      loadIndex,
      loadChapter,
      toggleCommentary,
    }}>
      {children}
    </GitaContext.Provider>
  )
}

export function useGita() {
  const ctx = useContext(GitaContext)
  if (!ctx) throw new Error('useGita must be inside GitaProvider')
  return ctx
}
