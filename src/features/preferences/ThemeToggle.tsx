import { MoonIcon, SunIcon } from '../../components/Icons'
import styles from './Themetoggle.module.css'
import { useTheme } from './userPreferences'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={styles.themeToggle}
      aria-label="Dark mode"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
