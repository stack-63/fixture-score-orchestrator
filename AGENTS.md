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

- App state (fixtures, betslip, balance) lives in `src/lib/store.tsx` context mounted in `__root`; it is a local simulation until Lovable Cloud replaces it with real queries/mutations. Auth (user, authReady, signOut) and the admin flag are real: user comes from Supabase Auth, isAdmin from the `has_role` RPC against `public.user_roles`.
- Admin UI must be conditionally mounted (never CSS-hidden); admin status is the server-validated `user_roles` check in `src/lib/store.tsx`, never client-settable state.
- Betting is gated on sign-in: `canPlaceBet` in `src/lib/store.tsx` is the single rule (signed-in + stake within balance); the betslip shows a sign-in CTA instead of Place Bet when signed out.
