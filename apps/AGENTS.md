# Repository Guidelines

## Project Structure & Module Organization
- `jianghu-api/` hosts the PHP back end (`v3/` is the active CodeIgniter app, `Docs/` contains schema SQL, `not-used/` keeps legacy assets).  
- `jianghu-weixin/` contains the WeChat Mini Program (page directories under `pages/`, shared stores in `stores/`, utilities in `utils/`, styles in `styles/`).  
- Shared top-level docs live beside this file; keep environment-specific configs inside existing `config-*.php` templates.

## Build, Test, and Development Commands
- Mini Program: execute `npm install` in `jianghu-weixin/`, then open the folder with WeChat DevTools. Use the built-in preview/simulator for runtime testing.  
- Linting is manual—run your formatter of choice before committing and align with existing file style.

## Coding Style & Naming Conventions
- PHP follows CodeIgniter defaults: PSR-12 spacing, 4-space indents, PascalCase controllers (`Gamble.php`), snake_case database fields. Place request parsing and response serialization near the top of each controller method.  
- Mini Program code uses ES modules with 4-space indents, camelCase variables, and directories named by feature (`pages/player-select/`). Export shared utilities via named exports in `utils/`.  
- Keep assets and generated files out of version control; rely on `.gitignore` patterns already present.

## Testing Guidelines
- Backend verification is handled by the maintainer; document any assumptions or payload changes in your PR so they can validate.  
- For Mini Program changes, record manual checks in the PR description: page navigation, state updates, and share/QR flows. Reuse mock data from `Docs/db-schema/sample_data.sql` to keep scenarios consistent.  
- Add Jest or PHPUnit smoke tests when introducing new core modules; name files `<module>.test.js` or `<Feature>Test.php` and store them alongside the code until a broader test harness exists.

## Commit & Pull Request Guidelines
- Prefer `<type>: <summary>` messages (e.g., `feat: enable qr enrollment`); keep to 72-character summaries and include Chinese context in the body if needed.  
- Each PR should state scope, testing evidence, and any config or migration changes. Link tracking tasks or issues, attach screenshots/GIFs for Mini Program UI work, and flag required data migrations.  
- Rebase before requesting review; ensure linting/formatting is clean and no temporary debug code remains.

## Configuration & Secrets
- Place environment credentials in the server-side `config-local.php` templates or your deployment platform’s secret store; never commit credentials.  
- Document new environment variables in `Docs/` and alert maintainers if API endpoints require whitelisting or extra scopes in WeChat.
