import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  AccountsResponse,
  CreateTransferRequest,
  CustomerResponse,
  PayeesResponse,
  TransactionsResponse,
  TransferResponse,
} from "./types";

const RECENT_TRANSACTIONS_LIMIT = 8;

const FORWARDED_PARAMS = ["scenario", "delay"];

/**
 * Forwards the mock API's demo hooks from the page URL onto GET requests, so
 * `/?scenario=error`, `/?scenario=empty` and `/?delay=3000` show those states
 * on the deployed site without a "break the app" button in the UI.
 */
export function withDemoParams(path: string): string {
  const pageParams = new URLSearchParams(window.location.search);
  const requestParams = new URLSearchParams();

  for (const name of FORWARDED_PARAMS) {
    const value = pageParams.get(name);
    if (value !== null) requestParams.set(name, value);
  }

  const query = requestParams.toString();
  if (!query) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query}`;
}

export const customerQuery = queryOptions({
  queryKey: ["customer"],
  queryFn: () => apiFetch<CustomerResponse>(withDemoParams("/api/customer")),
  select: (data) => data.customer,
});

export const accountsQuery = queryOptions({
  queryKey: ["accounts"],
  queryFn: () => apiFetch<AccountsResponse>(withDemoParams("/api/accounts")),
  select: (data) => data.accounts,
});

export const payeesQuery = queryOptions({
  queryKey: ["payees"],
  queryFn: () => apiFetch<PayeesResponse>(withDemoParams("/api/payees")),
  select: (data) => data.payees,
});

export const recentTransactionsQuery = queryOptions({
  queryKey: ["transactions", { limit: RECENT_TRANSACTIONS_LIMIT }],
  queryFn: () =>
    apiFetch<TransactionsResponse>(
      withDemoParams(`/api/transactions?limit=${RECENT_TRANSACTIONS_LIMIT}`),
    ),
  select: (data) => data.transactions,
});

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTransferRequest) =>
      apiFetch<TransferResponse>("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
    // Returning the promise keeps the mutation pending until the refetches end,
    // so the dashboard behind the success screen is already up to date.
    onSuccess: () =>
      Promise.all(
        [customerQuery, accountsQuery, recentTransactionsQuery].map((query) =>
          queryClient.invalidateQueries({ queryKey: query.queryKey }),
        ),
      ),
  });
}
