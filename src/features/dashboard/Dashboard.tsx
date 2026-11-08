

import { useQuery } from '@tanstack/react-query'
import styles from './Dashboard.module.css'
import { accountsQuery, customerQuery, recentTransactionsQuery } from '../../api/queries'
import { Header } from './Header'
import { useSegment } from '../preferences/userPreferences'
import { SegmentSwitch } from '../preferences/SegmentSwitch'


export function Dashboard() {

  const customerResult = useQuery(customerQuery)
  const accountsResult = useQuery(accountsQuery)
  const transactionsResult = useQuery(recentTransactionsQuery)
  const results = [customerResult, accountsResult, transactionsResult]

  const customer = customerResult.data
  const accounts = accountsResult.data
  const transactions = transactionsResult.data

  const isLoading = results.some((result) => result.isPending && !result.isError)
  const isError = results.some((result) => result.isError)
  const isRetrying = isError && results.some((result) => result.isFetching)
  const hasData = results.every((result) => result.data !== undefined)
  const canTransfer = accounts !== undefined && !isError

  const { segment, setSegment } = useSegment(customer?.segment)

    return (
      <>
        <Header customer={customer} segment={segment} onSegmentChange={setSegment}  />
        <main id="main" className={styles.main} aria-busy={isLoading}>
        {isLoading && (
          <p role="status" className={styles.visuallyHidden}>
            Loading your dashboard…
          </p>
        )}

        {/* Also shows above stale data if a later refresh fails, so an old
            balance is never presented as current. */}
        {isError && (
          <ErrorPanel
            message="We couldn't load your dashboard."
            onRetry={retry}
            isRetrying={isRetrying}
          />
        )}
              <SegmentSwitch
                segment={segment}
                onChange={setSegment}
                className={styles.segmentMobile}
              />
        </main>
      </>
    )
}