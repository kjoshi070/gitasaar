import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../src/context/ThemeContext'
import { GitaProvider } from '../../src/context/GitaContext'
import LandingPage from '../../src/components/Pages/LandingPage'

// Mock fetch
const mockIndex = {
  chapters: [
    { chapter_number: 1, name_sanskrit: 'अर्जुनविषादयोग', name_transliterated: 'Arjuna Visada Yoga', verse_count: 47 },
    { chapter_number: 2, name_sanskrit: 'साङ्ख्ययोग', name_transliterated: 'Sankhya Yoga', verse_count: 72 },
  ],
}

function setup() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockIndex),
  })

  return render(
    <MemoryRouter>
      <ThemeProvider>
        <GitaProvider>
          <LandingPage />
        </GitaProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LandingPage', () => {
  it('renders the brand name', () => {
    setup()
    // Hero title is rendered in Devanagari
    expect(screen.getByText('गीतासार')).toBeInTheDocument()
  })

  it('renders stat cards with correct values', () => {
    setup()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('700')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders chapter cards after data loads', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('Arjuna Visada Yoga')).toBeInTheDocument()
      expect(screen.getByText('Sankhya Yoga')).toBeInTheDocument()
    })
  })

  it('renders chapter links with correct hrefs', async () => {
    setup()
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /Arjuna Visada Yoga/i })
      expect(link).toHaveAttribute('href', '/chapter/1')
    })
  })

  it('shows Krishna image with alt text', () => {
    setup()
    const img = screen.getByAltText('Lord Krishna')
    expect(img).toBeInTheDocument()
  })

  it('shows skeleton loaders while data is loading', () => {
    // Mock a slow fetch that never resolves during test
    global.fetch = vi.fn(() => new Promise(() => {}))
    render(
      <MemoryRouter>
        <ThemeProvider>
          <GitaProvider>
            <LandingPage />
          </GitaProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
    const skeletons = document.querySelectorAll('.skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
