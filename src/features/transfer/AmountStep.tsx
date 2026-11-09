import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Account, Customer } from '../../api/types'
import { Button } from '../../components/Button'
import { Field, inputClassName } from '../../components/Field'
import { remainingDailyLimit } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'
import styles from './AmountStep.module.css'
import type { AmountValues } from './draft'
import { createAmountSchema, NOTE_MAX_LENGTH } from './schemas'
import { StepFrame } from './StepFrame'

const QUICK_AMOUNTS = ['50', '100', '250', '500']

interface AmountStepProps {
  values: AmountValues
  /** Deposit accounts only: the credit card can't be a from-account. */
  accounts: Account[]
  customer: Customer
  onBack: (values: AmountValues) => void
  onContinue: (values: AmountValues) => void
}

export function AmountStep({
  values,
  accounts,
  customer,
  onBack,
  onContinue,
}: AmountStepProps) {
  const remainingLimit = remainingDailyLimit(customer)
  const schema = useMemo(
    () => createAmountSchema({ accounts, remainingLimit }),
    [accounts, remainingLimit],
  )

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<AmountValues>({
    defaultValues: values,
    mode: 'onTouched',
    resolver: zodResolver(schema),
  })

  const fromAccountId = useWatch({ control, name: 'fromAccountId' })
  const note = useWatch({ control, name: 'note' })
  const fromAccount = accounts.find((account) => account.id === fromAccountId)

  return (
    <StepFrame
      title="How much?"
      onSubmit={handleSubmit(onContinue)}
      actions={
        <>
          <Button variant="secondary" onClick={() => onBack(getValues())}>
            Back
          </Button>
          <Button type="submit">Continue</Button>
        </>
      }
    >
      <Field
        label="From account"
        hint="Deposit accounts only"
        error={errors.fromAccountId?.message}
      >
        {(control) => (
          <select
            {...control}
            {...register('fromAccountId', {
              // A different balance can make an entered amount (in)valid.
              onChange: () => {
                if (getValues('amount')) void trigger('amount')
              },
            })}
            className={inputClassName}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.maskedNumber}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Amount"
        error={errors.amount?.message}
        hint={
          <dl className={styles.limits}>
            <div className={styles.limit}>
              <dt>Available</dt>
              <dd className="amount">
                {fromAccount && formatMoney(fromAccount.balance)}
              </dd>
            </div>
            <div className={styles.limit}>
              <dt>Remaining daily limit</dt>
              <dd className="amount">{formatMoney(remainingLimit)}</dd>
            </div>
          </dl>
        }
      >
        {(control) => (
          <>
            <div className={styles.amountInput}>
              <span aria-hidden="true" className={styles.currency}>
                SGD
              </span>
              <input
                {...control}
                {...register('amount')}
                className={`${inputClassName} amount ${styles.amountField}`}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
              />
            </div>
            <div className={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="secondary"
                  aria-label={`Set amount to SGD ${quickAmount}`}
                  onClick={() =>
                    setValue('amount', quickAmount, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {quickAmount}
                </Button>
              ))}
            </div>
          </>
        )}
      </Field>

      <Field
        label="Note (optional)"
        error={errors.note?.message}
        labelAside={
          <span className={styles.counter}>
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
        }
      >
        {(control) => (
          <input
            {...control}
            {...register('note')}
            className={inputClassName}
            autoComplete="off"
          />
        )}
      </Field>
    </StepFrame>
  )
}
