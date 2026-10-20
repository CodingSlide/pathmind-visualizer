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
- Search algorithms live in src/lib/search.ts as pure functions (tested in src/test/search.test.ts); the UI only animates their recorded expansion order.
- Chess uses chess.js for legal moves and match state, with pure minimax/alpha-beta search in a browser worker so deeper searches cannot block controls.
- Pathfinding and chess share the index workspace and a single game selector; switching pauses play while preserving each board.
- Comparison CSV is generated from the same measured rows displayed in the UI, with browser Blob delivery to avoid a server dependency.
