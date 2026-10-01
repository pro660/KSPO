# Container workflow

- Build the development image: `docker build -t cheche-frontend .`
- Run the app: `docker run --rm -p 3000:3000 --env-file .env.local cheche-frontend`
- Validate: `docker run --rm cheche-frontend sh -c "npm run typecheck && npm run build"`
- No lint script is currently configured in package.json.
- Prefer this container workflow. If Docker is unavailable, use existing local dependencies for validation; do not install system packages.
