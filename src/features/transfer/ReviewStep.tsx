import { useEffect, useRef, type ReactNode } from 'react'
import { ApiError } from '../../api/client'
import type { Account } from '../../api/types'
import { Button } from '../../components/Button'
import { formatMoney } from '../../lib/format'
import type { AmountValues, RecipientSummary } from './draft'
import styles from './ReviewStep.module.css'
import { StepFrame } from './StepFrame'

const SEND_ERROR =
  "Something went wrong. Your money hasn't left your account. Try again."

/** A 4xx says what to fix. Anything else is on our side, so reassure instead. */
function sendErrorMessage(error: Error): string {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : SEND_ERROR
}

/** The first message the API gave for any of these fields. */
function apiFieldError(error: Error | null, ...fields: string[]) {
  if (!(error instanceof ApiError)) return undefined
  const key = fields.find((field) => error.fields?.[field])
  return key && error.fields?.[key]
}

function Row({
  label,
  error,
  children,
  className = '',
  valueClassName,
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={`${styles.row} ${className}`}>
      <dt>{label}</dt>
      <dd className={valueClassName}>
        {children}
        {error && <span className={styles.fieldError}>{error}</span>}
      </dd>
    </div>
  )
}

interface ReviewStepProps {
  amount: AmountValues
  fromAccount?: Account
  recipient?: RecipientSummary
  isSending: boolean
  error: Error | null
  onBack: () => void
  onConfirm: () => void
}

export function ReviewStep({
  amount,
  fromAccount,
  recipient,
  isSending,
  error,
  onBack,
  onConfirm,
}: ReviewStepProps) {
  const alertRef = useRef<HTMLParagraphElement>(null)

  // The Confirm button loses focus while it's disabled, so hand focus to the
  // error instead of letting it fall out of the dialog.
  useEffect(() => {
    if (error) alertRef.current?.focus()
  }, [error])

  const value = Number(amount.amount)

  return (
    <StepFrame
      title="Check the details"
      onSubmit={(event) => {
        event.preventDefault()
        onConfirm()
      }}
      actions={
        <>
          <Button variant="secondary" disabled={isSending} onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={isSending}>
            {isSending ? 'Sending…' : 'Confirm transfer'}
          </Button>
        </>
      }
    >
      {error && (
        <p ref={alertRef} role="alert" tabIndex={-1} className={styles.alert}>
          {sendErrorMessage(error)}
        </p>
      )}

      <dl className={styles.summary}>
        <Row label="From" error={apiFieldError(error, 'fromAccountId')}>
          {fromAccount && `${fromAccount.name} · ${fromAccount.maskedNumber}`}
        </Row>
        <Row
          label="To"
          error={apiFieldError(
            error,
            'payeeId',
            'recipient.name',
            'recipient.accountNumber',
            'recipient.bank',
          )}
        >
          {recipient &&
            `${recipient.name} · ${recipient.bank} · ${recipient.maskedNumber}`}
        </Row>
        <Row
          label="Amount"
          valueClassName="amount"
          error={apiFieldError(error, 'amount')}
        >
          {formatMoney(value)}
        </Row>
        <Row label="Fee" valueClassName="amount">
          {formatMoney(0)}
        </Row>
        <Row label="Note" error={apiFieldError(error, 'note')}>
          {amount.note || 'None'}
        </Row>
        <Row label="Total" className={styles.total} valueClassName="amount">
          {formatMoney(value)}
        </Row>
      </dl>
    </StepFrame>
  )
}
