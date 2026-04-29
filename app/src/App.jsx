import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'

const LandingPage  = lazy(() => import('./components/Pages/LandingPage'))
const ChapterPage  = lazy(() => import('./components/Pages/ChapterPage'))
const ShlokaPage   = lazy(() => import('./components/Pages/ShlokaPage'))
const AboutPage    = lazy(() => import('./components/Pages/AboutPage'))
const CreditsPage  = lazy(() => import('./components/Pages/CreditsPage'))

function PageLoader() {
  return (
    <div style={{ padding: '56px 48px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton" style={{ height: 80, marginBottom: 16, borderRadius: 8 }} />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                                    element={<LandingPage />} />
          <Route path="/chapter/:chapterId"                  element={<ChapterPage />} />
          <Route path="/chapter/:chapterId/verse/:verseId"   element={<ShlokaPage />} />
          <Route path="/about"                               element={<AboutPage />} />
          <Route path="/credits"                             element={<CreditsPage />} />
          <Route path="*"                                    element={<LandingPage />} />
        </Routes>
      </Suspense>
    </AppLayout>
  )
}
