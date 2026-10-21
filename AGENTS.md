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

- App state (fixtures, betslip, balance, admin flag) lives in `src/lib/store.tsx` context mounted in `__root`; it is a local simulation until Lovable Cloud replaces it with real queries/mutations.
- Admin UI must be conditionally mounted (never CSS-hidden); the real admin check must come from a server-validated roles table.
