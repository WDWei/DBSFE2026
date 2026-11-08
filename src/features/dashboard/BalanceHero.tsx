import type { Ref } from "react";
import type { Account } from "../../api/types";
import { Button } from "../../components/Button";
import { PlusIcon } from "../../components/Icons";
import { Skeleton } from "../../components/Skeleton";
import { depositAccounts, totalAvailable } from "../../lib/accounts";
import { formatMoney } from "../../lib/format";
import styles from "./BalanceHero.module.css";

interface BalanceHeroProps {
  accounts?: Account[];
  canTransfer: boolean;
  newTransferRef: Ref<HTMLButtonElement>;
  onNewTransfer: () => void;
}

export function BalanceHero({
  accounts,
  canTransfer,
  newTransferRef,
  onNewTransfer,
}: BalanceHeroProps) {
  const depositCount = accounts ? depositAccounts(accounts).length : 0;

  return (
    <section aria-labelledby="total-available" className={styles.hero}>
      <div>
        <h2 id="total-available" className={styles.label}>
          Total available
        </h2>
        <p className={`${styles.total} amount`}>
          {accounts ? (
            formatMoney(totalAvailable(accounts))
          ) : (
            <Skeleton width="12ch" />
          )}
        </p>
        <p className={styles.caption}>
          {accounts ? (
            `Across ${depositCount} deposit ${depositCount === 1 ? "account" : "accounts"}`
          ) : (
            <Skeleton width="22ch" />
          )}
        </p>
      </div>

      <div className={styles.cta}>
        <Button
          ref={newTransferRef}
          variant="hero"
          className={styles.ctaButton}
          disabled={!canTransfer}
          onClick={onNewTransfer}
        >
          <PlusIcon />
          New transfer
        </Button>
      </div>
    </section>
  );
}
