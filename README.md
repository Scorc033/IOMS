# Inventory & Order Management System

IOMS is a Next.js static web app hosted on Firebase. Email/password accounts
authenticate with Firebase Authentication, and each account's private inventory
is stored in Cloud Firestore and syncs across devices when using that account.
Google sign-in is not enabled.

## Data and privacy

- Each Firebase account has its own inventory; accounts do not share data.
- When an account has no cloud inventory, the first sign-in imports this
  browser's existing demo data, if present. Otherwise, sample data is created.
- Once cloud data exists, it takes precedence over any local sample data.
- The dashboard can download a JSON backup of the current cloud inventory.
- Do not use the free plan as a substitute for backups of critical business data.

## Firebase setup

The Firebase web API key is supplied through `NEXT_PUBLIC_FIREBASE_API_KEY` in
`.env.local`; it is public client configuration, not a server secret. Firestore
Security Rules restrict each account to its own data. Copy `.env.example` to
`.env.local` and enter the current API key before building.

In the Firebase Console for project `inventory-8cb5f`:

1. Enable **Email/Password** under Authentication → Sign-in method.
2. Enable the **Cloud Firestore API** and use the existing default Firestore
   database in `asia-east1`, Standard edition.
3. Keep the project on the Spark plan to avoid usage-based billing. Spark has
   daily/monthly Firestore quotas; requests may stop when those are exceeded.

After the database exists, deploy its rules and the web app:

```bash
npm ci
npm run build
firebase deploy --only firestore:rules,hosting --project inventory-8cb5f
```

The site is [inventory-8cb5f.web.app](https://inventory-8cb5f.web.app).

## Local development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create or sign in to an
email/password account. `localhost` and the deployed site have separate browser
storage; use the same account to access the same Firestore inventory.

## Static Docker image

```bash
npm run build
docker build -t ioms-app .
docker run --rm -p 8080:80 ioms-app
```

## Validation

```bash
npm run lint
npm run build
```
