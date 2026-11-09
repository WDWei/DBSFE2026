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
import { useRef, useState } from "react";
import { AccountsSection } from "./AccountsSection";
import { DailyLimitCard } from "./DailyLimitCard";
import { TransactionList } from "./TransactionList";
import { BalanceHero } from "./BalanceHero";
import { TransferDialog } from "../transfer/TransferDialog";

export function Dashboard() {
  const customerResult = useQuery(customerQuery);
  const accountsResult = useQuery(accountsQuery);
  const transactionsResult = useQuery(recentTransactionsQuery);
  const results = [customerResult, accountsResult, transactionsResult];

  const customer = customerResult.data;
  const accounts = accountsResult.data;
  const transactions = transactionsResult.data;
  const isLoading = results.some((result) => result.isPending);
  const isError = results.some((result) => result.isError);
  const isRetrying = results.some(
    (result) => result.isError && result.isFetching,
  );
  const isLoaded = results.every((result) => result.data !== undefined);
  const retry = () => {
    for (const result of results) {
      if (result.isError) void result.refetch();
    }
  };

  const newTransferRef = useRef<HTMLButtonElement>(null);
  const canTransfer = accounts !== undefined && !isError;

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const { segment, setSegment } = useSegment(customer?.segment);

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
              <BalanceHero
                accounts={accounts}
                canTransfer={canTransfer}
                newTransferRef={newTransferRef}
                onNewTransfer={() => setIsTransferOpen(true)}
              />
              <AccountsSection accounts={accounts} />
              <TransactionList transactions={transactions} />
            </div>
            <aside className={styles.rail} aria-label="Transfer limits">
              <DailyLimitCard customer={customer} />
            </aside>
          </div>
        )}
      </main>
      {/* Mounted only while open, so each transfer starts from a clean slate. */}
      {isTransferOpen && customer && accounts && (
        <TransferDialog
          customer={customer}
          accounts={accounts}
          onClose={() => setIsTransferOpen(false)}
          returnFocusRef={newTransferRef}
        />
      )}
    </>
  );
}
