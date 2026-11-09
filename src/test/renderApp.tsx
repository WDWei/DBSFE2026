import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { formatMoney } from '../lib/format'

/** Renders the whole app with a fresh cache and no automatic retries. */
export function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  )

  return { user: userEvent.setup() }
}

/**
 * `formatMoney` as Testing Library sees it on the page: its text matcher turns
 * the non-breaking space from `Intl` into a normal one, but only in the DOM.
 */
export function moneyText(amount: number, prefix = ''): string {
  return `${prefix}${formatMoney(amount)}`.replace(/\s/g, ' ')
}
