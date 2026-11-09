import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { useController, useForm } from 'react-hook-form'
import { payeesQuery } from '../../api/queries'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { ErrorPanel } from '../../components/ErrorPanel'
import { Field, inputClassName } from '../../components/Field'
import { Skeleton } from '../../components/Skeleton'
import { NEW_RECIPIENT, type RecipientValues } from './draft'
import styles from './RecipientStep.module.css'
import { recipientSchema } from './schemas'
import { StepFrame } from './StepFrame'

const BANKS = ['DBS', 'POSB', 'OCBC', 'UOB', 'Standard Chartered', 'HSBC', 'Maybank']

interface RecipientStepProps {
  values: RecipientValues
  onCancel: () => void
  onContinue: (values: RecipientValues) => void
}

export function RecipientStep({ values, onCancel, onContinue }: RecipientStepProps) {
  const payees = useQuery(payeesQuery)
  const [search, setSearch] = useState('')
  const selectionErrorId = useId()

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipientValues>({
    defaultValues: values,
    mode: 'onTouched',
    resolver: zodResolver(recipientSchema),
  })

  // Controlled, because searching unmounts radios and that mustn't lose the pick.
  const { field: selection } = useController({ control, name: 'selection' })
  const isNewRecipient = selection.value === NEW_RECIPIENT

  const term = search.trim().toLowerCase()
  const matches = payees.data?.filter(
    (payee) =>
      payee.name.toLowerCase().includes(term) ||
      payee.bank.toLowerCase().includes(term),
  )

  return (
    <StepFrame
      title="Who are you sending to?"
      onSubmit={handleSubmit(onContinue)}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Continue</Button>
        </>
      }
    >
      <Field label="Search payees" hideLabel>
        {(control) => (
          <input
            {...control}
            type="search"
            className={inputClassName}
            placeholder="Search payees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              // Enter here means "search", not "continue to the next step".
              if (event.key === 'Enter') event.preventDefault()
            }}
          />
        )}
      </Field>

      {payees.isError && (
        <ErrorPanel
          message="We couldn't load your payees."
          onRetry={() => void payees.refetch()}
          isRetrying={payees.isFetching}
        />
      )}

      {/* Native radios give the list its arrow-key and Tab behaviour for free. */}
      <fieldset
        className={styles.options}
        aria-describedby={errors.selection ? selectionErrorId : undefined}
      >
        <legend className="visually-hidden">Recipient</legend>

        {payees.isPending &&
          [0, 1, 2, 3].map((index) => (
            <div key={index} className={styles.option}>
              <Skeleton width="60%" />
            </div>
          ))}

        {payees.data?.length === 0 && (
          <EmptyState message="You don't have any saved payees yet." />
        )}
        {payees.data && payees.data.length > 0 && matches?.length === 0 && (
          <EmptyState message="No payees match your search." />
        )}

        {matches?.map((payee, index) => (
          <label key={payee.id} className={styles.option}>
            <input
              type="radio"
              name={selection.name}
              ref={index === 0 ? selection.ref : undefined}
              checked={selection.value === payee.id}
              onChange={() => selection.onChange(payee.id)}
              onBlur={selection.onBlur}
              aria-invalid={errors.selection ? true : undefined}
            />
            <span aria-hidden="true" className={styles.initials}>
              {payee.initials}
            </span>
            <span className={styles.payee}>
              <span className={styles.payeeName}>{payee.name}</span>
              <span className={`${styles.payeeMeta} amount`}>
                {payee.bank} · {payee.accountNumberMasked}
              </span>
            </span>
          </label>
        ))}

        <label className={styles.option}>
          <input
            type="radio"
            name={selection.name}
            ref={matches?.length ? undefined : selection.ref}
            checked={isNewRecipient}
            onChange={() => selection.onChange(NEW_RECIPIENT)}
            onBlur={selection.onBlur}
            aria-invalid={errors.selection ? true : undefined}
          />
          <span className={styles.payeeName}>Send to someone new</span>
        </label>
      </fieldset>

      {errors.selection && (
        <p id={selectionErrorId} className={styles.error}>
          {errors.selection.message}
        </p>
      )}

      {isNewRecipient && (
        <div className={styles.newRecipient}>
          <Field label="Recipient name" error={errors.name?.message}>
            {(control) => (
              <input
                {...control}
                {...register('name')}
                className={inputClassName}
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            label="Account number (8 digits)"
            error={errors.accountNumber?.message}
          >
            {(control) => (
              <input
                {...control}
                {...register('accountNumber')}
                className={inputClassName}
                inputMode="numeric"
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Bank" error={errors.bank?.message}>
            {(control) => (
              <select
                {...control}
                {...register('bank')}
                className={inputClassName}
              >
                <option value="">Choose a bank</option>
                {BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      )}
    </StepFrame>
  )
}
