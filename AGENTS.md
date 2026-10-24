<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Fixtures use the shared TanStack Query cache primed by the root loader and read by the store; Realtime invalidation and polling keep feeds fresh without competing local fixture state.
- Fixture writes use validated authenticated server functions and admin-only RLS; atomic import/delete RPCs share an advisory lock so replace operations cannot partially apply or race other imports.
- Bets, betslip, balance and deposits remain local simulations; selected odds are snapshots and changed odds require explicit acceptance, while removed fixtures block submission and void local open bets.
- Auth and admin roles are real: users come from Auth and admin status comes from the protected user_roles RPC; do not expose a role toggle or grant roles for tests.
- Admin UI must be conditionally mounted (never CSS-hidden); admin status is the server-validated `user_roles` check in `src/lib/store.tsx`, never client-settable state.
- Betting is gated on sign-in: `canPlaceBet` in `src/lib/store.tsx` is the single rule (signed-in + stake within balance); the betslip shows a sign-in CTA instead of Place Bet when signed out.
