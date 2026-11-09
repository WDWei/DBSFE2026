import { z } from 'zod'
import type { Account } from '../../api/types'
import { formatMoney } from '../../lib/format'
import { NEW_RECIPIENT } from './draft'

/**
 * Every transfer rule lives here, once. React Hook Form runs these schemas both
 * when a field is left and on Continue, through `zodResolver`.
 */

export const NOTE_MAX_LENGTH = 50

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 50
const MIN_AMOUNT = 1
const ACCOUNT_NUMBER_FORMAT = /^\d{8}$/
const AMOUNT_FORMAT = /^\d+(\.\d{1,2})?$/

/** The new-recipient rules only apply once "Send to someone new" is chosen. */
export const recipientSchema = z
  .object({
    selection: z.string().min(1, 'Choose who to send to.'),
    name: z.string().trim(),
    accountNumber: z.string().trim(),
    bank: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.selection !== NEW_RECIPIENT) return

    if (
      values.name.length < NAME_MIN_LENGTH ||
      values.name.length > NAME_MAX_LENGTH
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: `Enter a name between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters.`,
      })
    }
    if (!ACCOUNT_NUMBER_FORMAT.test(values.accountNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['accountNumber'],
        message: 'Enter a valid 8-digit account number.',
      })
    }
    if (!values.bank) {
      ctx.addIssue({
        code: 'custom',
        path: ['bank'],
        message: 'Choose a bank.',
      })
    }
  })

interface AmountLimits {
  accounts: Account[]
  remainingLimit: number
}

/** A factory, because the balance and daily limit come from live API data. */
export function createAmountSchema({ accounts, remainingLimit }: AmountLimits) {
  return z
    .object({
      fromAccountId: z.string().min(1, 'Choose an account.'),
      amount: z
        .string()
        .trim()
        .min(1, 'Enter an amount.')
        .regex(AMOUNT_FORMAT, 'Enter a number with at most 2 decimal places.')
        .refine(
          (amount) => Number(amount) >= MIN_AMOUNT,
          `Enter an amount of at least ${formatMoney(MIN_AMOUNT)}.`,
        ),
      note: z
        .string()
        .trim()
        .max(
          NOTE_MAX_LENGTH,
          `Keep the note to ${NOTE_MAX_LENGTH} characters or fewer.`,
        ),
    })
    .superRefine((values, ctx) => {
      // Also runs when the amount failed above, where a limit error would be
      // noise on top of the real problem.
      if (!AMOUNT_FORMAT.test(values.amount)) return

      const amount = Number(values.amount)
      const account = accounts.find((item) => item.id === values.fromAccountId)

      if (account && amount > account.balance) {
        ctx.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `Amount can't be more than your available balance (${formatMoney(account.balance)}).`,
        })
      } else if (amount > remainingLimit) {
        ctx.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `This transfer exceeds your remaining daily limit (${formatMoney(remainingLimit)}).`,
        })
      }
    })
}
