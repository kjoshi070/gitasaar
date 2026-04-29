import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '../../src/context/ThemeContext'
import ThemeToggle from '../../src/components/UI/ThemeToggle'

// Helper to wrap with provider
function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders three theme options', () => {
    renderWithTheme(<ThemeToggle />)
    expect(screen.getByLabelText('Light mode')).toBeInTheDocument()
    expect(screen.getByLabelText('System default')).toBeInTheDocument()
    expect(screen.getByLabelText('Dark mode')).toBeInTheDocument()
  })

  it('defaults to system preference', () => {
    renderWithTheme(<ThemeToggle />)
    const systemBtn = screen.getByLabelText('System default')
    expect(systemBtn).toHaveClass('theme-toggle__option--active')
  })

  it('marks clicked option as active', () => {
    renderWithTheme(<ThemeToggle />)
    const darkBtn = screen.getByLabelText('Dark mode')
    fireEvent.click(darkBtn)
    expect(darkBtn).toHaveClass('theme-toggle__option--active')
  })

  it('persists selection to localStorage', () => {
    renderWithTheme(<ThemeToggle />)
    fireEvent.click(screen.getByLabelText('Light mode'))
    expect(localStorage.getItem('gitasaar-theme')).toBe('light')
  })

  it('sets data-theme attribute on html element', () => {
    renderWithTheme(<ThemeToggle />)
    fireEvent.click(screen.getByLabelText('Dark mode'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('has aria-pressed on each button', () => {
    renderWithTheme(<ThemeToggle />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-pressed')
    })
  })
})
