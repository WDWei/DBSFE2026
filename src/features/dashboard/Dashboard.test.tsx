import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { moneyText, renderApp } from '../../test/renderApp'
import { server } from '../../test/setup'

const LOAD_TIMEOUT = { timeout: 3000 }

describe('dashboard', () => {
  it('totals the deposit accounts only and shows what the credit card owes', async () => {
    renderApp()

    expect(
      await screen.findByText(moneyText(17120.55), undefined, LOAD_TIMEOUT),
    ).toBeInTheDocument()
    expect(screen.getByText('Across 2 deposit accounts')).toBeInTheDocument()
    expect(screen.getByText(moneyText(-420.3))).toBeInTheDocument()
    expect(screen.getByText('Amount due')).toBeInTheDocument()
  })

  it('shows the 8 newest transactions, newest first', async () => {
    renderApp()

    await screen.findByText('FairPrice Finest', undefined, LOAD_TIMEOUT)

    const list = screen
      .getByRole('heading', { name: 'Recent transactions' })
      .closest('section')!
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(8)
    expect(rows[0]).toHaveTextContent('FairPrice Finest')
    expect(rows[7]).toHaveTextContent('Uniqlo')
    expect(rows[1]).toHaveTextContent('Pending')
    expect(within(rows[4]).getByText(moneyText(45, '+'))).toBeInTheDocument()
  })

  it('searches by description or category, and can clear the search', async () => {
    const { user } = await renderLoaded()
    const search = screen.getByRole('searchbox', {
      name: 'Search transactions',
    })

    await user.type(search, 'GROCERIES')
    expect(screen.getByRole('status')).toHaveTextContent('1 result')
    expect(screen.getByText('FairPrice Finest')).toBeInTheDocument()
    expect(screen.queryByText('Uniqlo')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'no such thing')
    expect(
      screen.getByText('No transactions match your search.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(search).toHaveValue('')
    await waitFor(() => expect(search).toHaveFocus())
    expect(screen.getByText('Uniqlo')).toBeInTheDocument()
  })

  it('shows an error when a request fails, and Retry loads the dashboard', async () => {
    server.use(
      http.get(
        '*/api/accounts',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
            { status: 500 },
          ),
        { once: true },
      ),
    )
    const { user } = renderApp()

    const alert = await screen.findByRole('alert', {}, LOAD_TIMEOUT)
    expect(alert).toHaveTextContent("We couldn't load your dashboard.")
    expect(screen.queryByText('Total available')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(
      await screen.findByText(moneyText(17120.55), undefined, LOAD_TIMEOUT),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an empty state when there are no transactions', async () => {
    server.use(
      http.get('*/api/transactions', () =>
        HttpResponse.json({ transactions: [], total: 0 }),
      ),
    )
    renderApp()

    expect(
      await screen.findByText('No transactions yet.', undefined, LOAD_TIMEOUT),
    ).toBeInTheDocument()
  })
})

async function renderLoaded() {
  const result = renderApp()
  await screen.findByText('FairPrice Finest', undefined, LOAD_TIMEOUT)
  return result
}
