import { useQuery } from "@tanstack/react-query";
import styles from "./Dashboard.module.css";
import {
  accountsQuery,
  customerQuery,
  recentTransactionsQuery,
} from "../../api/queries";
import { Header } from "./Header";
import { useSegment } from "../preferences/userPreferences";
import { ErrorPanel } from "../../components/ErrorPanel";
import { Skeleton } from "../../components/Skeleton";
import { formatLongDate } from "../../lib/format";

export function Dashboard() {
  const customerResult = useQuery(customerQuery);
  const accountsResult = useQuery(accountsQuery);
  const transactionsResult = useQuery(recentTransactionsQuery);
  const results = [customerResult, accountsResult, transactionsResult];

  const customer = customerResult.data;
  const accounts = accountsResult.data;
  const transactions = transactionsResult.data;

  const isLoading = results.some(
    (result) => result.isPending && !result.isError,
  );
  const isError = results.some((result) => result.isError);
  const isRetrying = isError && results.some((result) => result.isFetching);
  const hasData = results.every((result) => result.data !== undefined);
  const canTransfer = accounts !== undefined && !isError;
  const isLoaded = Boolean(customer && accounts && transactions);
  const { segment, setSegment } = useSegment(customer?.segment);

  const retry = () => {
    for (const result of results) {
      if (result.isError) void result.refetch();
    }
  };

  return (
    <>
      <Header
        customer={customer}
        segment={segment}
        onSegmentChange={setSegment}
      />
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
        {/*The hasData and isError can be simplified*/}
        {(isLoaded || !isError) && (
          <div className={styles.grid}>
            <div className={styles.column}>
              <div className={styles.intro}>
                <h1 className={styles.greeting}>
                  {customer ? (
                    `Good evening, ${customer.firstName}`
                  ) : (
                    <Skeleton width="14ch" />
                  )}
                </h1>
                <p className={styles.dateLine}>
                  {formatLongDate(new Date().toISOString())}
                </p>
              </div>
              {/* <BalanceHero
                accounts={accounts}
                canTransfer={canTransfer}
                newTransferRef={newTransferRef}
                onNewTransfer={() => onNewTransfer?.()}
              />
              <AccountsSection accounts={accounts} />
              <TransactionList transactions={transactions} /> */}
            </div>
            {/* <aside className={styles.rail} aria-label="Transfer limits">
              <DailyLimitCard customer={customer} />
            </aside> */}
          </div>
        )}
      </main>
    </>
  );
}
