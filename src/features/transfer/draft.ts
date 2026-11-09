import type { CreateTransferRequest, Payee } from '../../api/types'

/** The `selection` value for "Send to someone new"; otherwise it's a payee id. */
export const NEW_RECIPIENT = 'new'

export interface RecipientValues {
  selection: string
  name: string
  accountNumber: string
  bank: string
}

export interface AmountValues {
  fromAccountId: string
  amount: string
  note: string
}

export const EMPTY_RECIPIENT: RecipientValues = {
  selection: '',
  name: '',
  accountNumber: '',
  bank: '',
}

export interface RecipientSummary {
  name: string
  bank: string
  maskedNumber: string
}

export function summariseRecipient(
  recipient: RecipientValues,
  payees: Payee[],
): RecipientSummary | undefined {
  if (recipient.selection === NEW_RECIPIENT) {
    return {
      name: recipient.name,
      bank: recipient.bank,
      maskedNumber: `•••• ${recipient.accountNumber.slice(-4)}`,
    }
  }

  const payee = payees.find((item) => item.id === recipient.selection)
  return (
    payee && {
      name: payee.name,
      bank: payee.bank,
      maskedNumber: payee.accountNumberMasked,
    }
  )
}

export function buildTransferRequest(
  recipient: RecipientValues,
  amount: AmountValues,
): CreateTransferRequest {
  const base = {
    fromAccountId: amount.fromAccountId,
    amount: Number(amount.amount),
    note: amount.note || undefined,
  }

  return recipient.selection === NEW_RECIPIENT
    ? {
        ...base,
        recipient: {
          name: recipient.name,
          accountNumber: recipient.accountNumber,
          bank: recipient.bank,
        },
      }
    : { ...base, payeeId: recipient.selection }
}
