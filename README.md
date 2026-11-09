# Meridian Banking — Wee Ding Wei

- Deployed: <https://meridian-banking-dw.vercel.app/>
- Run locally: `npm install && npm run dev`
- Checks: `npm run check` (lint, type-check, tests)

## Project structure

```
src/
  api/            HTTP client, query definitions and API types
    client.ts       apiFetch: fetch wrapper that turns error responses into typed errors
    queries.ts      queryOptions for customer, accounts, payees, transactions; useCreateTransfer
    types.ts        Response and request types from brief/api-contract.md
  components/     Shared, feature-agnostic UI: Button, Field, Skeleton, EmptyState, ErrorPanel, Icons
  features/
    dashboard/      Dashboard page: Header, BalanceHero, AccountsSection, TransactionList, DailyLimitCard
    preferences/    Theme toggle, Retail/Premium switch, and the hooks that persist them
    transfer/       Transfer dialog: steps (Recipient → Amount → Review → Success), zod schemas, draft helpers
  lib/            Pure helpers: money/date formatting, account totals
  mocks/          Re-exports the shared MSW handlers for the browser worker
  test/           Vitest setup (MSW server, jsdom stubs, cleanup) and the renderApp helper
mock-api/         MSW handlers + seed data, shared by the browser, the Node server and the tests
```

Each feature folder owns its components and CSS modules. Anything used by more than one feature goes in `components/` or `lib/`.

## Decisions and trade-offs

### Server state vs UI state

- **Server state lives in React Query only.** Customer, accounts, transactions and payees are `queryOptions` objects in `api/queries.ts`, each with a `select` that unwraps the response envelope. Components never copy query data into `useState`.
- **After a transfer**, `useCreateTransfer` invalidates customer, accounts and transactions. It returns that promise, so the mutation stays pending until the refetches finish, and the dashboard behind the success screen is already up to date.
- **UI state stays local.** Examples: whether the dialog is open, the current step, the search text.
- **Retail/Premium:** `useSegment` uses the customer's segment from the API as the default. Only an explicit user choice is stored (in `localStorage`), so the API value is never duplicated into state.

### Dashboard page state

The dashboard reads three queries and works out its page state from them:

```ts
const isLoading = results.some((result) => result.isPending);
const isError = results.some((result) => result.isError);
const isRetrying = results.some(
  (result) => result.isError && result.isFetching,
);
const isLoaded = results.every((result) => result.data !== undefined);
```

- In React Query v5 a query is exactly one of `pending`, `error` or `success`, so `isPending` already excludes errors.
- `isRetrying` only counts queries that failed and are refetching. A background refetch of a healthy query doesn't make the Retry button spin.
- **Considered:** `useQueries` with `combine`. **Kept:** three plain `useQuery` calls. The `combine` version was no shorter and harder to read. It would be worth it if the queries became dynamic or were needed in another component.

### Forms and validation

- **Libraries:** React Hook Form with `zodResolver`, one form per step.
- **Rules live once, in `features/transfer/schemas.ts`.** They run when a field is left and again on Continue.
- **Amount schema:** It's a factory (`createAmountSchema`) because the balance and daily limit come from live API data. If the amount format is invalid, the limit check is skipped so the user sees one error, not two.
- **New-recipient fields** are only validated once "Send to someone new" is chosen.
- **Server-side field errors** (e.g. `DAILY_LIMIT_EXCEEDED`) are mapped back onto the matching field.
- **Double sends:** A ref guard plus the mutation's pending state stop a double-click on Confirm from sending twice.

### Dialog and focus

- **Native `<dialog>`:** The dialog opens with `showModal()`, which gives a focus trap, an inert background and Esc handling for free.
- **Esc:** The dialog handles `cancel` itself, so closing can be blocked while a transfer is sending. Closing mid-send would hide whether the money moved.
- **Focus return:** The "New transfer" button is passed in as a ref (`returnFocusRef`), and focus goes back to it on close.
  - It's a ref, not state, because nothing renders differently based on it.
  - It's not `document.activeElement` either, because macOS Safari doesn't focus buttons on click.
- **Fresh start:** The dialog is mounted only while open, so every transfer starts clean.

### Theming

- **Tokens:** Colours and spacing come from CSS custom properties based on `brief/design-tokens.css`.
- **Light/dark and Retail/Premium** are set as `data-theme` and `data-segment` on `<html>`.
- **Theme on load:** `useTheme` reads the stored choice, or the system preference if none is stored.
- **Storage failures:** Storage access is wrapped in `try/catch`. If storage is blocked, the choice still applies until reload.

## Loading, empty and error states

| State            | How it's handled                                                                                                                                                                                                                       | How to see it (deployed)         |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Loading          | Skeletons sized like the real content, so the layout doesn't jump. `aria-busy` on `<main>` and a visually hidden "Loading your dashboard…" status.                                                                                     | `/?delay=3000`                   |
| Empty            | `EmptyState` for no accounts, no transactions, no saved payees, and no search matches.                                                                                                                                                 | `/?scenario=empty`               |
| Error            | `ErrorPanel` with Retry, which refetches only the queries that failed. If a later refresh fails, the panel shows above the old data, so a stale balance is never presented as current. The payee list in the dialog has its own Retry. | `/?scenario=error`               |
| Transfer failure | Stays on Review with the data kept, shows the server's message, and allows retry. No money moves.                                                                                                                                      | Add `#fail` to the transfer note |

`withDemoParams` forwards `scenario` and `delay` from the page URL to the mock API. This makes the states reachable on the deployed site without a debug button in the UI.

## Tests

36 tests across 4 files. All passing.

- **`features/transfer/TransferDialog.test.tsx` (12):** The whole flow through the real app and the MSW API.
  - Focus moves in on open and returns to the opener on close.
  - Going back from Review keeps what the user entered.
  - Validation on blur and on Continue, and focus moves to the first invalid field.
  - Balance and daily-limit errors send no request.
  - A transfer succeeds and the dashboard updates, for both a saved payee and a new recipient.
  - A double-click on Confirm sends once.
  - Server failure and rejection keep the user's data and show the right message.
- **`features/dashboard/Dashboard.test.tsx` (5):**
  - The total counts deposit accounts only.
  - The 8 newest transactions show in order.
  - Search, and clearing the search.
  - Error, then Retry, then the dashboard loads.
  - The empty state.
- **`features/transfer/schemas.test.ts`:** Each validation rule on its own: balance, daily limit, note length, recipient selection, new-recipient fields.
- **`lib/format.test.ts`:** Money and date formatting, pinned to Singapore time whatever timezone the test machine uses.

**Why these cases:** They're where a bug costs the user money or trust: wrong totals, bad validation, sending twice, or losing input after an error. The tests use the real app and mock API rather than mocking components, so they check what the user actually sees.

**Test setup (`src/test/setup.ts`):**

- jsdom doesn't implement `<dialog>`'s `showModal()` or `close()`, so they're stubbed to toggle `open` and fire `close`.
- Vitest doesn't give Testing Library a global `afterEach`, so `cleanup()` is called explicitly. Without it, each test's app stayed in the DOM ("Found multiple elements…").

## AI use

**Tool:** Claude Code (in the terminal).

### Approach: AI first, then human review

I built this assignment AI-first. AI wrote the first draft of each part, and I treated every draft as unreviewed code until I had checked it myself.

1. **Draft with AI.** For each feature (dashboard sections, transfer steps, validation, tests), I gave Claude the relevant part of the brief and the API contract, and had it produce the first version.
2. **Review as a human.** I read each draft against the brief, the wireframe and the design tokens. I checked what it did, not just that it compiled. Where I wasn't sure why something was written a certain way, I asked Claude to explain it before accepting it.
3. **Verify.** I ran the app with the demo scenarios (`?delay`, `?scenario=empty`, `?scenario=error`, `#fail`) and ran `npm run check` (lint, type-check, tests).
4. **Push back or simplify.** Where a draft was more complex than it needed to be, or didn't match what I wanted, I asked for a preview of the change before anything was written, then kept, changed or rejected it.

### Where review changed, rejected or fixed the AI's output

1. **Rejected `useQueries` + `combine`.** Claude proposed merging the three dashboard queries. I asked for a preview first and kept the three `useQuery` calls, because they're easier to read and the change wasn't shorter.
2. **Fixed the failing dialog tests myself.** All 12 `TransferDialog` tests failed. I asked Claude for the cause only, with no file changes. It found two problems: jsdom has no `<dialog>` `showModal()`, and Testing Library's cleanup wasn't running. I added the stubs and `cleanup()` to the setup file by hand.
3. **Caught a deprecated type.** `StepFrame.tsx` uses `FormEventHandler`, which current React types mark as deprecated. `SubmitEventHandler` is the right type for a form's `onSubmit`.

## Not done / known issues

- **Theme flash on load:** `index.html` hard-codes `data-theme="light"`, and the stored theme is applied only after React mounts, so dark-mode users see a brief light flash. The fix is an inline script in `index.html` that sets `data-theme` before first paint. The comment in `userPreferences.ts` says that script exists, but it doesn't yet.
- **Greeting:** It's always "Good evening". It should follow the time of day.
- **Test cleanup placement:** `cleanup()` runs in `beforeEach`, so the last test's DOM stays mounted after each file. `afterEach` is the usual place.
- **Untested dialog behaviour:** The jsdom `<dialog>` stub has no focus trap and doesn't fire `cancel` on Esc. Those parts are checked by hand in a browser, not by tests.
