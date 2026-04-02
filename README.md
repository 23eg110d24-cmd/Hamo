# Hamo

Hamo is a monorepo with:
- `library-management`: Spring Boot backend API
- `library-ui`: Vite + React frontend

## Local verification

Backend:
```powershell
cd library-management
./mvnw test
./mvnw clean package -DskipTests
```

Frontend:
```powershell
cd library-ui
npm run lint
npm run build
```

## Deploy target

- Frontend: Vercel
- Backend: Render

## Vercel setup

Deploy the `library-ui` folder as the Vercel project root.

Required environment variable:
- `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`

The frontend already includes SPA rewrites in `library-ui/vercel.json`.

## Render setup

This repo includes `render.yaml` for the backend service.

Backend health check:
- `/api/health`

Important backend environment variables:
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_OPENAI_API_KEY` (optional)
- `SPRING_H2_CONSOLE_ENABLED=false`

Recommended CORS value after Vercel deploy:
- `https://your-vercel-project.vercel.app,https://*.vercel.app`

## Notes

- The backend now supports env-driven config for database, JWT, CORS, and OpenAI.
- If no external CSV path is provided, the backend seeds bundled sample book data from classpath resources.
- Render free deploys will work, but H2 data remains ephemeral unless you later attach persistent storage or move to a managed database.