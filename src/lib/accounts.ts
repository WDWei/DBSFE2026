import type { Account, Customer } from "../api/types";

/** Checking and savings. The credit card holds money owed, not money to spend. */
export function depositAccounts(accounts: Account[]): Account[] {
  return accounts.filter((account) => account.type !== "credit");
}

export function totalAvailable(accounts: Account[]): number {
  return depositAccounts(accounts).reduce(
    (total, account) => total + account.balance,
    0,
  );
}

export function remainingDailyLimit(customer: Customer): number {
  const remaining = customer.dailyTransferLimit - customer.transferredToday;
  return Math.round(remaining * 100) / 100;
}
