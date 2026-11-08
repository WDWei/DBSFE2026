

import styles from './Dashboard.module.css'
export function Dashboard() {
    return (
    <>
      <Header customer={customer} />
      <main className={styles.main} aria-busy={isLoading}>
        {isLoading && (
          <p role="status" className="visually-hidden">
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

        {(isLoaded || isLoading) && (
          <div className={styles.grid}>
            <div className={styles.column}>
              <h1 className={styles.greeting}>
                {customer ? (
                  `Good evening, ${customer.firstName}`
                ) : (
                  <Skeleton width="14ch" />
                )}
              </h1>
              <BalanceHero
                accounts={accounts}
                canTransfer={canTransfer}
                newTransferRef={newTransferRef}
                onNewTransfer={() => setIsTransferOpen(true)}
              />
              <AccountsSection accounts={accounts} />
              <TransactionList transactions={transactions} />
            </div>
            <aside className={styles.rail}>
              <DailyLimitCard customer={customer} />
            </aside>
          </div>
         )}
        </main>
      </>
    )
}