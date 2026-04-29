import { useTheme } from '../../context/ThemeContext'

const OPTIONS = [
  { value: 'light',  icon: '☀', label: 'Light mode' },
  { value: 'system', icon: '⊙', label: 'System default' },
  { value: 'dark',   icon: '☾', label: 'Dark mode' },
]

export default function ThemeToggle() {
  const { preference, setTheme } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      {OPTIONS.map(({ value, icon, label }) => (
        <button
          key={value}
          className={`theme-toggle__option${preference === value ? ' theme-toggle__option--active' : ''}`}
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={preference === value}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
