import { describe, expect, it } from 'vitest'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { NEW_RECIPIENT } from './draft'
import { createAmountSchema, recipientSchema } from './schemas'

const checking: Account = {
  id: 'acc_checking',
  name: 'Everyday Checking',
  type: 'checking',
  maskedNumber: '•••• 4821',
  balance: 4280.55,
  currency: 'SGD',
}
const savings: Account = { ...checking, id: 'acc_savings', balance: 12840 }

const amountSchema = createAmountSchema({
  accounts: [checking, savings],
  remainingLimit: 5000,
})

function amountErrors(amount: string, fromAccountId = checking.id, note = '') {
  const result = amountSchema.safeParse({ fromAccountId, amount, note })
  return result.error?.issues.map((issue) => issue.message) ?? []
}

function recipientErrorPaths(values: {
  name?: string
  accountNumber?: string
  bank?: string
}) {
  const result = recipientSchema.safeParse({
    selection: NEW_RECIPIENT,
    name: 'Alex Lim',
    accountNumber: '12345678',
    bank: 'OCBC',
    ...values,
  })
  return result.error?.issues.map((issue) => issue.path[0]) ?? []
}

describe('amount rules', () => {
  it.each(['1', '1.00', '120.5', '4280.55'])('accepts %s', (amount) => {
    expect(amountErrors(amount)).toEqual([])
  })

  // Zod reports every failing check; the form shows the first one per field.
  it.each([
    ['', 'Enter an amount.'],
    ['0.99', `Enter an amount of at least ${formatMoney(1)}.`],
    ['10.123', 'Enter a number with at most 2 decimal places.'],
    ['abc', 'Enter a number with at most 2 decimal places.'],
    ['-5', 'Enter a number with at most 2 decimal places.'],
    ['1,000', 'Enter a number with at most 2 decimal places.'],
  ])('rejects %j', (amount, message) => {
    expect(amountErrors(amount)[0]).toBe(message)
  })

  it('checks the balance of the chosen account', () => {
    expect(amountErrors('4280.56')).toEqual([
      `Amount can't be more than your available balance (${formatMoney(4280.55)}).`,
    ])
    expect(amountErrors('4280.56', savings.id)).toEqual([])
  })

  it('checks the remaining daily limit', () => {
    expect(amountErrors('5000.01', savings.id)).toEqual([
      `This transfer exceeds your remaining daily limit (${formatMoney(5000)}).`,
    ])
  })

  it('allows a note of up to 50 characters', () => {
    expect(amountErrors('10', checking.id, 'x'.repeat(50))).toEqual([])
    expect(amountErrors('10', checking.id, 'x'.repeat(51))).toHaveLength(1)
  })
})

describe('recipient rules', () => {
  it('requires a selection', () => {
    const result = recipientSchema.safeParse({
      selection: '',
      name: '',
      accountNumber: '',
      bank: '',
    })
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      'selection',
    ])
  })

  it('ignores the new-recipient fields when a saved payee is picked', () => {
    const result = recipientSchema.safeParse({
      selection: 'pay_001',
      name: 'x',
      accountNumber: '1',
      bank: '',
    })
    expect(result.success).toBe(true)
  })

  it('validates a new recipient', () => {
    expect(recipientErrorPaths({})).toEqual([])
    expect(recipientErrorPaths({ name: 'A' })).toEqual(['name'])
    expect(recipientErrorPaths({ name: 'x'.repeat(51) })).toEqual(['name'])
    expect(recipientErrorPaths({ accountNumber: '1234567' })).toEqual([
      'accountNumber',
    ])
    expect(recipientErrorPaths({ accountNumber: '1234567a' })).toEqual([
      'accountNumber',
    ])
    expect(recipientErrorPaths({ bank: '' })).toEqual(['bank'])
  })
})
