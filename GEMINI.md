# jianghu-mono

`jianghu-mono` is the new monorepo that combines the backend API (`jianghu-api`) and the WeChat mini-program (`jianghu-weixin`) so future work can be coordinated in a single repository.

## Repository layout

- `apps/jianghu-api` – existing backend API service (imported from the standalone `jianghu-api` repo)
- `apps/jianghu-weixin` – existing WeChat mini-program frontend (imported from the standalone `jianghu-weixin` repo)

## Working with git subtree

Both projects were brought in with `git subtree` so their full histories are preserved inside the monorepo. You can continue to sync changes with the original repositories (or their remotes) using the following commands:

```bash
# pull the latest changes from jianghu-api/main into the monorepo
git subtree pull --prefix=apps/jianghu-api jianghu-api main

# push local monorepo changes back to the jianghu-api repository
git subtree push --prefix=apps/jianghu-api jianghu-api main

# pull the latest changes from jianghu-weixin/master into the monorepo
git subtree pull --prefix=apps/jianghu-weixin jianghu-weixin master

# push local monorepo changes back to the jianghu-weixin repository
git subtree push --prefix=apps/jianghu-weixin jianghu-weixin master
```

> Tip: If you plan to stop using the old repositories altogether, you can remove those remotes with `git remote remove jianghu-api` and `git remote remove jianghu-weixin`.

## Next steps

1. Update CI/CD pipelines to point at this repository.
2. Decide on shared tooling (linting, testing, type-checking) that should live at the monorepo root.
3. Update documentation to reflect the new repository layout.
