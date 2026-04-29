import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { GitaProvider } from '../../src/context/GitaContext'
import CommentaryPanel from '../../src/components/Shloka/CommentaryPanel'

const verse = {
  verse_number: 1,
  commentaries: {
    sivananda:      'Sivananda commentary body.',
    bhaktivedanta:  'Bhaktivedanta commentary body.',
    shankaracharya: 'Shankaracharya commentary body.',
    aurobindo:      'Aurobindo commentary body.',
  },
}

function renderPanel(v = verse) {
  return render(
    <GitaProvider>
      <CommentaryPanel verse={v} />
    </GitaProvider>
  )
}

// Helper: get the toggle button group (aria-label="Select commentaries to display")
function getToggleGroup() {
  return screen.getByRole('group', { name: /Select commentaries/i })
}

beforeEach(() => {
  localStorage.clear()
})

describe('CommentaryPanel', () => {
  it('renders toggle buttons for all available commentaries', () => {
    renderPanel()
    const group = getToggleGroup()
    expect(within(group).getByText(/Swami Sivananda/i)).toBeInTheDocument()
    expect(within(group).getByText(/Bhaktivedanta/i)).toBeInTheDocument()
    expect(within(group).getByText(/Shankaracharya/i)).toBeInTheDocument()
    expect(within(group).getByText(/Sri Aurobindo/i)).toBeInTheDocument()
  })

  it('shows only Shankaracharya commentary by default', () => {
    renderPanel()
    // Default preference: only Shankaracharya enabled
    expect(screen.queryByText('Sivananda commentary body.')).not.toBeInTheDocument()
    expect(screen.queryByText('Bhaktivedanta commentary body.')).not.toBeInTheDocument()
    expect(screen.getByText('Shankaracharya commentary body.')).toBeInTheDocument()
    expect(screen.queryByText('Aurobindo commentary body.')).not.toBeInTheDocument()
  })

  it('hides a commentary body when its toggle is clicked', () => {
    renderPanel()
    const group = getToggleGroup()
    // Shankaracharya is active by default — click to disable
    const btn = within(group).getByText(/Shankaracharya/i)
    fireEvent.click(btn)
    expect(screen.queryByText('Shankaracharya commentary body.')).not.toBeInTheDocument()
  })

  it('re-shows commentary when toggle is clicked again', () => {
    renderPanel()
    const group = getToggleGroup()
    // Shankaracharya is active by default
    const btn = within(group).getByText(/Shankaracharya/i)
    fireEvent.click(btn)   // disable
    fireEvent.click(btn)   // re-enable
    expect(screen.getByText('Shankaracharya commentary body.')).toBeInTheDocument()
  })

  it('shows "Select a commentary" message when all active toggles are turned off', () => {
    renderPanel()
    const group = getToggleGroup()
    const activeButtons = within(group).getAllByRole('button')
    activeButtons.forEach(btn => {
      if (btn.getAttribute('aria-pressed') === 'true') fireEvent.click(btn)
    })
    expect(screen.getByText(/Select a commentary/i)).toBeInTheDocument()
  })

  it('renders nothing when verse has no commentaries', () => {
    const { container } = renderPanel({ verse_number: 1, commentaries: {} })
    expect(container.firstChild).toBeNull()
  })

  it('each toggle button has aria-pressed attribute', () => {
    renderPanel()
    const group = getToggleGroup()
    const buttons = within(group).getAllByRole('button')
    buttons.forEach(b => expect(b).toHaveAttribute('aria-pressed'))
  })

  it('only Shankaracharya toggle starts active (aria-pressed=true)', () => {
    renderPanel()
    const group = getToggleGroup()
    const buttons = within(group).getAllByRole('button')
    // Default: only Shankaracharya is active; others start inactive
    const activeButtons = buttons.filter(b => b.getAttribute('aria-pressed') === 'true')
    expect(activeButtons).toHaveLength(1)
    expect(activeButtons[0].textContent).toMatch(/Shankaracharya/i)
  })
})
