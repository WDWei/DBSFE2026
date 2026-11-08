import type { Customer } from '../../api/types'
import { Skeleton } from '../../components/Skeleton'
import { remainingDailyLimit } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'
import styles from './DailyLimitCard.module.css'

interface DailyLimitCardProps {
  customer?: Customer
}

export function DailyLimitCard({ customer }: DailyLimitCardProps) {
  const percentUsed = customer
    ? (customer.transferredToday / customer.dailyTransferLimit) * 100
    : 0

  return (
    <section aria-labelledby="daily-limit-heading" className={styles.card}>
      <h2 id="daily-limit-heading" className={styles.heading}>
        Daily limit
      </h2>
      <p className={`${styles.remaining} amount`}>
        {customer ? (
          `${formatMoney(remainingDailyLimit(customer))} remaining today`
        ) : (
          <Skeleton width="24ch" />
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Daily limit used"
        aria-valuemin={0}
        aria-valuemax={customer?.dailyTransferLimit ?? 0}
        aria-valuenow={customer?.transferredToday ?? 0}
        className={styles.track}
      >
        <div className={styles.fill} style={{ width: `${percentUsed}%` }} />
      </div>
      <p className={styles.note}>Resets daily. Applies to all transfers.</p>
    </section>
  )
}
