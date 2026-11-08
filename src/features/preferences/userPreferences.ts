import { useEffect, useState } from 'react'
import type { Segment } from '../../api/types'

export type Theme = 'light' | 'dark'
// The inline script in index.html reads these keys too, before first paint.
const THEME_KEY = 'meridian-theme'
const SEGMENT_KEY = 'meridian-segment'

/** Storage can throw (e.g. when blocked); the app just won't remember then. */
function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
   // Nothing to do: the choice still applies until the page is reloaded.
  }
}

function readStoredTheme(): Theme {
  const stored = readStored(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function readStoredSegment(): Segment {
  const stored = readStored(SEGMENT_KEY)
  return stored === 'premium' ? 'premium' : 'retail'
}

/**
 * The customer's segment from the API is the default. Only an explicit choice
 * is kept in state, so the API value is never copied into it.
 */
export function useSegment(customerSegment: Segment | undefined) {
  const [chosen, setChosen] = useState<Segment | null>(readStoredSegment)
  const segment = chosen ?? customerSegment ?? 'retail'

  useEffect(() => {
    document.documentElement.dataset.segment = segment
  }, [segment])

  const chooseSegment = (next: Segment) => {
    writeStored(SEGMENT_KEY, next)
    setChosen(next)
  }

  return { segment, setSegment: chooseSegment }
}

export function useTheme() {
  // The inline script has already resolved stored choice vs system setting.
  const [theme, setTheme] = useState<Theme>(readStoredTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  
  const chooseTheme = (next: Theme) => {
    writeStored(THEME_KEY, next)
    setTheme(next)
  }

  return { theme, setTheme: chooseTheme }
}