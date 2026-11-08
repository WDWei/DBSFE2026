import { useRef, useState } from "react";
import type { Transaction } from "../../api/types";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Field, inputClassName } from "../../components/Field";
import { Skeleton } from "../../components/Skeleton";
import { formatMoney, formatShortDate } from "../../lib/format";
import styles from "./TransactionList.module.css";

const SKELETON_ROWS = 8;

function matchesSearch(transaction: Transaction, search: string): boolean {
  const term = search.trim().toLowerCase();
  return (
    transaction.description.toLowerCase().includes(term) ||
    transaction.category.toLowerCase().includes(term)
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isMoneyIn = transaction.direction === "in";

  return (
    <li className={styles.row}>
      <div className={styles.details}>
        <p className={styles.description}>{transaction.description}</p>
        <p className={styles.meta}>
          <span className={styles.category}>{transaction.category}</span>
          {" · "}
          <time dateTime={transaction.date}>
            {formatShortDate(transaction.date)}
          </time>
        </p>
      </div>
      <div className={styles.side}>
        <p
          className={`amount ${styles.amount} ${isMoneyIn ? styles.moneyIn : ""}`}
        >
          {isMoneyIn
            ? `+${formatMoney(transaction.amount)}`
            : formatMoney(-transaction.amount)}
        </p>
        {transaction.status === "pending" && (
          <span className={styles.pending}>Pending</span>
        )}
      </div>
    </li>
  );
}

function SkeletonRow() {
  return (
    <li className={styles.row}>
      <div className={styles.details}>
        <p className={styles.description}>
          <Skeleton width="18ch" />
        </p>
        <p className={styles.meta}>
          <Skeleton width="16ch" />
        </p>
      </div>
      <p className={styles.amount}>
        <Skeleton width="10ch" />
      </p>
    </li>
  );
}

interface TransactionListProps {
  transactions?: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const isSearching = search.trim() !== "";
  const matches = transactions?.filter((transaction) =>
    matchesSearch(transaction, search),
  );

  function clearSearch() {
    setSearch("");
    searchRef.current?.focus();
  }

  return (
    <section aria-labelledby="transactions-heading" className={styles.card}>
      <div className={styles.toolbar}>
        <h2 id="transactions-heading" className={styles.heading}>
          Recent transactions
        </h2>
        <div className={styles.search}>
          <Field label="Search transactions" hideLabel>
            {(control) => (
              <input
                {...control}
                ref={searchRef}
                type="search"
                className={inputClassName}
                placeholder="Search transactions"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
          </Field>
        </div>
      </div>

      <div role="status" className={styles.results}>
        {isSearching && matches && matches.length > 0 && (
          <>
            <span>
              {matches.length} {matches.length === 1 ? "result" : "results"}
            </span>
            <Button variant="ghost" onClick={clearSearch}>
              Clear search
            </Button>
          </>
        )}
      </div>

      {!matches && (
        <ul className={styles.transactionList}>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <SkeletonRow key={index} />
          ))}
        </ul>
      )}

      {matches && matches.length > 0 && (
        <ul className={styles.transactionList}>
          {matches.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}

      {matches?.length === 0 &&
        (isSearching ? (
          <EmptyState
            message="No transactions match your search."
            action={
              <Button variant="secondary" onClick={clearSearch}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState message="No transactions yet." />
        ))}
    </section>
  );
}
