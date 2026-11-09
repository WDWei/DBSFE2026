import { screen, waitFor, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { moneyText, renderApp } from '../../test/renderApp'
import { server } from '../../test/setup'

// Each mock response takes ~500 ms, and a full transfer makes several.
const FLOW_TIMEOUT = 15_000
const LOAD_TIMEOUT = { timeout: 3000 }

function countTransferRequests() {
  const counter = { count: 0 }
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST') counter.count += 1
  })
  return counter
}

afterEach(() => server.events.removeAllListeners())

type Dialog = ReturnType<typeof within>

async function openDialog() {
  const { user } = renderApp()
  await screen.findByText('FairPrice Finest', undefined, LOAD_TIMEOUT)
  const opener = screen.getByRole('button', { name: 'New transfer' })
  await user.click(opener)
  return { user, opener, dialog: within(screen.getByRole('dialog')) }
}

async function clickContinue(user: UserEvent, dialog: Dialog) {
  await user.click(dialog.getByRole('button', { name: 'Continue' }))
}

async function pickJamie(user: UserEvent, dialog: Dialog) {
  await user.click(
    await dialog.findByRole('radio', { name: /Jamie Tan/ }, LOAD_TIMEOUT),
  )
  await clickContinue(user, dialog)
}

async function goToReview(user: UserEvent, dialog: Dialog, note = 'Dinner') {
  await pickJamie(user, dialog)
  await user.type(dialog.getByLabelText('Amount'), '120')
  if (note) await user.type(dialog.getByLabelText('Note (optional)'), note)
  await clickContinue(user, dialog)
  expect(
    dialog.getByRole('heading', { name: 'Check the details' }),
  ).toBeInTheDocument()
}

describe('transfer dialog', () => {
  it('moves focus in, closes with the close button, and returns focus', async () => {
    const { user, opener, dialog } = await openDialog()

    expect(
      dialog.getByRole('heading', { name: 'Who are you sending to?' }),
    ).toHaveFocus()

    await user.click(dialog.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it(
    'keeps what the user entered when going back from review',
    async () => {
      const { user, dialog } = await openDialog()
      await goToReview(user, dialog)

      expect(dialog.getByText(/Jamie Tan · DBS/)).toBeInTheDocument()

      await user.click(dialog.getByRole('button', { name: 'Back' }))
      expect(dialog.getByLabelText('Amount')).toHaveValue('120')
      expect(dialog.getByLabelText('Note (optional)')).toHaveValue('Dinner')

      await user.click(dialog.getByRole('button', { name: 'Back' }))
      expect(dialog.getByRole('radio', { name: /Jamie Tan/ })).toBeChecked()
    },
    FLOW_TIMEOUT,
  )
})

describe('validation', () => {
  it(
    'shows an error for an amount over the balance and sends no request',
    async () => {
      const requests = countTransferRequests()
      const { user, dialog } = await openDialog()
      await pickJamie(user, dialog)

      const amount = dialog.getByLabelText('Amount')
      await user.type(amount, '4280.56')
      await clickContinue(user, dialog)

      expect(
        await dialog.findByText(
          `Amount can't be more than your available balance (${moneyText(4280.55)}).`,
        ),
      ).toBeInTheDocument()
      expect(amount).toHaveAttribute('aria-invalid', 'true')
      expect(amount).toHaveAccessibleDescription(
        expect.stringContaining("Amount can't be more"),
      )
      expect(amount).toHaveFocus()

      // Still on this step, and the money never moved.
      expect(
        dialog.getByRole('heading', { name: 'How much?' }),
      ).toBeInTheDocument()
      expect(requests.count).toBe(0)
    },
    FLOW_TIMEOUT,
  )

  it('checks a field when the user leaves it', async () => {
    const { user, dialog } = await openDialog()

    await user.click(
      await dialog.findByRole('radio', { name: 'Send to someone new' }),
    )
    await user.type(dialog.getByLabelText('Account number (8 digits)'), '123')
    await user.tab()

    expect(
      await dialog.findByText('Enter a valid 8-digit account number.'),
    ).toBeInTheDocument()
  })

  it('focuses the first invalid field on Continue', async () => {
    const { user, dialog } = await openDialog()

    await user.click(
      await dialog.findByRole('radio', { name: 'Send to someone new' }),
    )
    await clickContinue(user, dialog)

    await waitFor(() =>
      expect(dialog.getByLabelText('Recipient name')).toHaveFocus(),
    )
    expect(
      dialog.getByRole('heading', { name: 'Who are you sending to?' }),
    ).toBeInTheDocument()
  })

  it('requires a recipient before moving on', async () => {
    const { user, dialog } = await openDialog()
    await dialog.findByRole('radio', { name: /Jamie Tan/ }, LOAD_TIMEOUT)

    await clickContinue(user, dialog)

    expect(await dialog.findByText('Choose who to send to.')).toBeInTheDocument()
    expect(dialog.getByRole('radio', { name: /Jamie Tan/ })).toHaveFocus()
  })
})

describe('sending', () => {
  it(
    'shows the success screen and updates the dashboard',
    async () => {
      const requests = countTransferRequests()
      const { user, opener, dialog } = await openDialog()
      await goToReview(user, dialog)

      await user.click(dialog.getByRole('button', { name: 'Confirm transfer' }))

      expect(dialog.getByRole('button', { name: 'Sending…' })).toBeDisabled()

      expect(
        await dialog.findByRole(
          'heading',
          { name: 'Transfer sent' },
          LOAD_TIMEOUT,
        ),
      ).toBeInTheDocument()
      expect(dialog.getByText(/^TRF-/)).toBeInTheDocument()
      expect(dialog.getByRole('status')).toHaveTextContent(/Transfer sent/)
      expect(requests.count).toBe(1)

      await user.click(dialog.getByRole('button', { name: 'Back to dashboard' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      await waitFor(() => expect(opener).toHaveFocus())

      // 4,280.55 - 120.00 on the account, and 17,120.55 - 120.00 in total.
      expect(screen.getByText(moneyText(4160.55))).toBeInTheDocument()
      expect(screen.getByText(moneyText(17000.55))).toBeInTheDocument()
      expect(
        screen.getByText(`${moneyText(4880)} remaining today`),
      ).toBeInTheDocument()
      expect(screen.getByText('Transfer to Jamie Tan')).toBeInTheDocument()
    },
    FLOW_TIMEOUT,
  )

  it(
    'sends a new recipient by account number',
    async () => {
      const { user, dialog } = await openDialog()

      await user.click(
        await dialog.findByRole('radio', { name: 'Send to someone new' }),
      )
      await user.type(dialog.getByLabelText('Recipient name'), 'Alex Lim')
      await user.type(
        dialog.getByLabelText('Account number (8 digits)'),
        '12345678',
      )
      await user.selectOptions(dialog.getByLabelText('Bank'), 'OCBC')
      await clickContinue(user, dialog)
      await user.click(dialog.getByRole('button', { name: 'Set amount to SGD 50' }))
      await clickContinue(user, dialog)

      expect(dialog.getByText(/Alex Lim · OCBC · •••• 5678/)).toBeInTheDocument()

      await user.click(dialog.getByRole('button', { name: 'Confirm transfer' }))

      expect(
        await dialog.findByRole(
          'heading',
          { name: 'Transfer sent' },
          LOAD_TIMEOUT,
        ),
      ).toBeInTheDocument()
    },
    FLOW_TIMEOUT,
  )

  it(
    'only sends once when Confirm is double-clicked',
    async () => {
      const requests = countTransferRequests()
      const { user, dialog } = await openDialog()
      await goToReview(user, dialog)

      await user.dblClick(dialog.getByRole('button', { name: 'Confirm transfer' }))
      await dialog.findByRole('heading', { name: 'Transfer sent' }, LOAD_TIMEOUT)

      expect(requests.count).toBe(1)
    },
    FLOW_TIMEOUT,
  )

  it(
    'stays on review with the data intact after a failure, and can retry',
    async () => {
      server.use(
        http.post(
          '*/api/transfers',
          () =>
            HttpResponse.json(
              { error: { code: 'INTERNAL_ERROR', message: 'Down' } },
              { status: 500 },
            ),
          { once: true },
        ),
      )
      const { user, dialog } = await openDialog()
      await goToReview(user, dialog)

      await user.click(dialog.getByRole('button', { name: 'Confirm transfer' }))

      expect(await dialog.findByRole('alert')).toHaveTextContent(
        "Something went wrong. Your money hasn't left your account. Try again.",
      )
      expect(
        dialog.queryByRole('heading', { name: 'Transfer sent' }),
      ).not.toBeInTheDocument()
      expect(dialog.getByText(/Jamie Tan · DBS/)).toBeInTheDocument()
      expect(dialog.getByText('Dinner')).toBeInTheDocument()

      await user.click(dialog.getByRole('button', { name: 'Confirm transfer' }))

      expect(
        await dialog.findByRole(
          'heading',
          { name: 'Transfer sent' },
          LOAD_TIMEOUT,
        ),
      ).toBeInTheDocument()
    },
    FLOW_TIMEOUT,
  )

  it(
    'treats the #fail note hook as a failure and moves no money',
    async () => {
      const { user, dialog } = await openDialog()
      await goToReview(user, dialog, '#fail')

      await user.click(dialog.getByRole('button', { name: 'Confirm transfer' }))

      await dialog.findByRole('alert', {}, LOAD_TIMEOUT)
      expect(screen.getByText(moneyText(4280.55))).toBeInTheDocument()
    },
    FLOW_TIMEOUT,
  )

  it(
    'shows the message and field error when the API rejects a transfer',
    async () => {
      server.use(
        http.post('*/api/transfers', () =>
          HttpResponse.json(
            {
              error: {
                code: 'DAILY_LIMIT_EXCEEDED',
                message: 'Amount exceeds remaining daily limit.',
                fields: { amount: 'This transfer exceeds your remaining daily limit.' },
              },
            },
            { status: 422 },
          ),
        ),
      )
      const { user, dialog } = await openDialog()
      await goToReview(user, dialog)

      await user.click(dialog.getByRole('button', { name: 'Confirm transfer' }))

      expect(await dialog.findByRole('alert', {}, LOAD_TIMEOUT)).toHaveTextContent(
        'Amount exceeds remaining daily limit.',
      )
      expect(
        dialog.getByText('This transfer exceeds your remaining daily limit.'),
      ).toBeInTheDocument()
    },
    FLOW_TIMEOUT,
  )
})
