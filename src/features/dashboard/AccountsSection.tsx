import type { Account } from "../../api/types";
import { EmptyState } from "../../components/EmptyState";
import { Skeleton } from "../../components/Skeleton";
import { formatMoney } from "../../lib/format";
import styles from "./AccountsSection.module.css";

const ACCOUNT_TYPE_LABEL: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit",
};

function AccountCard({ account }: { account: Account }) {
  const isCredit = account.type === "credit";

  return (
    <li className={styles.accountCard}>
      <div className={styles.accountTop}>
        <span className={styles.accountType}>
          {ACCOUNT_TYPE_LABEL[account.type]}
        </span>
        <span className={`${styles.accountNumber} ${styles.amount}`}>
          {account.maskedNumber}
        </span>
      </div>
      <h3 className={styles.accountName}>{account.name}</h3>
      <p className={`${styles.accountBalance} ${styles.amount}`}>
        {formatMoney(account.balance)}
      </p>
      {isCredit && <span className={styles.chipWarning}>Amount due</span>}
    </li>
  );
}

function AccountCardSkeleton() {
  return (
    <li className={styles.accountCard} aria-hidden="true">
      <div className={styles.accountTop}>
        <Skeleton width="6ch" />
        <Skeleton width="7ch" />
      </div>
      <Skeleton width="12ch" height="1.25em" />
      <Skeleton width="10ch" height="1.5em" />
    </li>
  );
}

interface AccountsSectionProps {
  accounts?: Account[];
}

//Changed
export function AccountsSection({ accounts }: AccountsSectionProps) {
  return (
    <section aria-labelledby="accounts-heading">
      <h2 id="accounts-heading" className={styles.heading}>
        Accounts
      </h2>
      {accounts?.length === 0 ? (
        <EmptyState message="You don't have any accounts yet." />
      ) : (
        <ul className={styles.accountList}>
          {accounts
            ? accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))
            : [0, 1, 2].map((key) => <AccountCardSkeleton key={key} />)}
        </ul>
      )}
    </section>
  );
}
