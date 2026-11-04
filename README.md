# Tulasi HealthConnect 💚

**A full-stack mental healthcare, appointment booking and clinic content platform for Tulasi Healthcare, Bengaluru.**

Tulasi HealthConnect brings patient-facing clinic information and appointment journeys together with dedicated doctor and administrator workflows. Patients can discover practitioners, review availability, book consultations and access authorised consultation information. Doctors manage schedules and consultations, while administrators oversee clinic operations and publish educational blog content.

> **Project status:** Deployed web application with patient, doctor and administrator experiences, appointment and consultation workflows, and a public blog. Payment behaviour depends on the configured environment (Razorpay or explicitly enabled demo/mock mode).

**Live application:** https://health-konnect-seven.vercel.app/  
**API deployment:** https://server-alpha-plum.vercel.app  
**Repository:** https://github.com/Nidhirk2113/HealthKonnect

---

## Contents

- [Product overview](#product-overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database scripts](#database-scripts)
- [API overview](#api-overview)
- [Authentication and access control](#authentication-and-access-control)
- [Payments and consultations](#payments-and-consultations)
- [Blog and clinic content](#blog-and-clinic-content)
- [Testing and production build](#testing-and-production-build)
- [Deployment](#deployment)
- [Security and privacy considerations](#security-and-privacy-considerations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Product overview

The application is organised around three account roles:

| Role | Main workspace | Capabilities |
|---|---|---|
| Patient | Patient portal | Browse doctors, view available slots, book appointments, review appointment history and access permitted consultation details and prescriptions |
| Doctor | Doctor dashboard | View assigned appointments, manage availability and working hours, record consultation details and finalise prescriptions |
| Administrator | Admin dashboard | View platform statistics, manage doctor records, review appointments and audit logs, and manage blog posts and contact enquiries |

Public visitors can also explore the clinic, services, doctors, articles and contact information without signing in.

## Features

### Public clinic website

- Landing page introducing Tulasi Healthcare and its services.
- About, services, doctor directory, contact and blog pages.
- Doctor profiles and appointment availability discovery.
- Blog search and category filtering.
- Individual article pages with reading-time information and related content.
- Responsive layouts for desktop and mobile screens.
- Contact enquiry submission with server-side rate limiting.

### Patient experience

- Google sign-in.
- Doctor discovery and profile viewing.
- Appointment slot selection and booking.
- Online or in-clinic consultation mode, according to practitioner availability.
- Appointment history and status tracking.
- Access to authorised consultation information and finalised prescription PDFs.

### Doctor workspace

- Doctor-specific appointment list.
- Schedule and availability management.
- Consultation notes and clinical information.
- Diagnosis, advice, medicine and follow-up fields.
- Consultation finalisation and prescription PDF generation.

### Administrator workspace

- Dashboard statistics.
- Doctor record and status management.
- Appointment overview and supported refund retry workflow.
- Audit-log review.
- Blog article creation, editing, publishing, unpublishing and deletion.
- Blog cover-image upload signing when Cloudinary is configured, or HTTPS image URLs.
- Contact enquiry review and handled status updates.

### Appointment and consultation workflow

- Appointment states include pending payment, booked, completed, cancelled, no-show and expired.
- Temporary slot holds and expiry handling.
- A MongoDB partial unique index protects active doctor/slot combinations against double booking.
- Consultation records are associated with appointments, doctors and patients.
- Private consultation notes are not exposed as patient-facing content.
- Finalised prescriptions can be generated as PDF documents.

### Payments

- Razorpay integration for configured production payment processing.
- Payment verification and webhook handling.
- Refund-related status and administrator retry workflow.
- Explicit demo mode can use simulated payments; demo payments are not real transactions.

### Blog and editorial content

- Publicly visible published articles and categories.
- Admin-only content management endpoints.
- Markdown article content, excerpts, tags, SEO title and SEO description.
- Reading time derived from article content.
- Draft and published states.
- Public APIs return published articles only; drafts and future-dated articles are excluded.
- Starter content can be inserted using the dedicated blog seed script.

---

## Technology stack

| Area | Technologies |
|---|---|
| Frontend | React 18, JavaScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Blog rendering | Marked, DOMPurify |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| Authentication | Google OAuth, JSON Web Tokens (JWT) |
| Password hashing | Node.js crypto scrypt |
| Security middleware | Helmet, CORS, express-rate-limit |
| Video consultations | Jitsi Meet domain configuration |
| Payments | Razorpay integration, optional mock/demo mode |
| Prescription documents | PDFKit |
| Testing | Node.js built-in test runner, API tests |
| Frontend hosting | Vercel |
| Backend hosting | Vercel serverless deployment (also includes a Render Blueprint) |
| Database hosting | MongoDB Atlas or another compatible MongoDB deployment |

---

## Architecture

The frontend is a single-page React application. It communicates with the Express API through the `/api/v1` base path. The API validates requests, authenticates users, enforces role permissions and persists application records through Mongoose.

```text
Browser
  |
  v
React + Vite application
  |
  | HTTPS / JSON API
  v
Express API (/api/v1)
  |
  +-- Authentication and role-based access
  +-- Patient, doctor and admin workflows
  +-- Appointment and payment services
  +-- Consultation and prescription services
  +-- Blog and contact content
  |
  v
MongoDB
  |
  +-- Users and doctor profiles
  +-- Appointments and consultations
  +-- Blog posts and categories
  +-- Contact enquiries and audit records
```

The API exposes a health endpoint at `/health`. It reports whether the process can reach its MongoDB connection.

---

## Repository structure

```text
HealthKonnect/
├── .github/
│   └── workflows/              # CI workflows
├── client/
│   ├── public/                  # Static assets (e.g. images)
│   ├── src/
│   │   ├── components/          # Shared UI and role-aware components
│   │   ├── context/             # Client-side application context
│   │   ├── lib/                 # Formatting, content and utility modules
│   │   ├── pages/               # Public, patient, doctor and admin pages
│   │   └── services/            # API communication
│   ├── .env.example
│   ├── package.json
│   └── vercel.json
├── server/
│   ├── scripts/                 # Database seed scripts
│   ├── src/
│   │   ├── config/              # Environment and database configuration
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Authentication and access control
│   │   ├── models/              # Mongoose schemas
│   │   ├── routes/              # API route registration
│   │   ├── services/            # Shared business services
│   │   └── utils/               # Validation and helper utilities
│   ├── test/                    # Backend tests
│   ├── .env.example
│   └── package.json
├── render.yaml                  # Optional Render API Blueprint
└── README.md
```

---

## Local setup

### Prerequisites

- Node.js 20 or later (the backend package declares Node.js `>=20`).
- npm.
- A MongoDB database (MongoDB Atlas is suitable).
- Google OAuth 2.0 Web Client credentials for Google sign-in.
- Git.

Optional integrations:
- Razorpay credentials for real payment processing.
- Cloudinary credentials for blog cover-image uploads.
- A configured Jitsi domain for video consultations.

### 1. Clone the repository

```bash
git clone https://github.com/Nidhirk2113/HealthKonnect.git
cd HealthKonnect
```

### 2. Configure and run the backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and update the values for your environment. See [Environment variables](#environment-variables).

Start the API in development mode:

```bash
npm run dev
```

The default local API base URL is:

```text
http://localhost:5000/api/v1
```

Health check:

```text
http://localhost:5000/health
```

### 3. Configure and run the frontend

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Copy `client/.env.example` to `client/.env`. For local development, set:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start Vite:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

---

## Environment variables

Use the example files as the source of truth:

- `client/.env.example`
- `server/.env.example`
- `server/src/config/env.js`

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL, including `/api/v1` |

### Backend

| Variable | Purpose |
|---|---|
| `NODE_ENV` | Runtime environment: development, test or production |
| `PORT` | Local server port (default: `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign JWTs; at least 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime (default: `7d`) |
| `CLIENT_ORIGIN` | Comma-separated allowed frontend origins for CORS |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |
| `ADMIN_EMAILS` | Comma-separated verified Google email addresses promoted to admin on sign-in |
| `DEV_AUTH` | Enables development-only patient login; must be `false` in production |
| `DEMO_MODE` | Explicitly enables simulated payments |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify Razorpay webhooks |
| `SLOT_HOLD_MINUTES` | Appointment slot hold duration (default: `10`) |
| `REFUND_CUTOFF_HOURS` | Configured refund cutoff window |
| `JITSI_DOMAIN` | Jitsi host (default: `meet.jit.si`) |
| `CLINIC_NAME` | Clinic display name |
| `CLINIC_ADDRESS` | Clinic address text |
| `CLOUDINARY_CLOUD_NAME` | Optional Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Optional Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional Cloudinary API secret |

Doctor demo authentication variables may also be used when explicitly configured for a demo deployment. See `server/.env.example` and `server/src/config/env.js` for `DEMO_DOCTOR_AUTH` and `DEMO_DOCTOR_PASSWORD` requirements.

### Important configuration notes

- In production, Google sign-in requires `GOOGLE_CLIENT_ID`.
- In production, `DEV_AUTH` must be disabled.
- `ADMIN_EMAILS` does not create an administrator immediately. The matching user receives the admin role when they complete a successful Google sign-in with that verified email.
- When `DEMO_MODE=false` in production, Razorpay keys and the webhook secret are required by the server configuration.
- When `DEMO_MODE=true`, payments are simulated. Do not represent demo payments as real transactions.
- Keep secrets in deployment environment settings or untracked local `.env` files. Never commit them.

---

## Database scripts

Run scripts from the `server/` directory after configuring `MONGODB_URI`.

| Command | Purpose |
|---|---|
| `npm run seed` | Seeds the bundled reference doctor data. Review `scripts/seed.js` before running against an existing database. |
| `npm run seed:blog-categories` | Upserts the predefined blog categories. |
| `npm run seed:blog-posts` | Creates the five example blog articles if they do not already exist. |

### Blog starter content

The blog-post seed script adds these example articles:

1. Understanding Mental Health: Breaking the Stigma
2. Managing Anxiety in Everyday Life: Practical Strategies
3. Understanding Depression: Signs, Symptoms and Support
4. How Sleep Affects Your Mental Well-being
5. When Should You Seek Professional Mental Health Support?

The script requires an existing active administrator account. It uses that account as the required author reference and displays the public byline **Tulasi Healthcare Editorial Team**.

The blog-post script is designed to be re-runnable: it inserts only missing slugs and leaves existing articles unchanged. It upserts category records only when they do not already exist. It does not seed or modify patient, doctor or appointment records.

**Database safety:** Always verify which MongoDB database your `MONGODB_URI` targets before running any seed script. The general doctor seed script is separate from the blog seed scripts and should not be run casually against a database containing live clinic data.

---

## API overview

All application API routes are mounted below `/api/v1`, unless noted otherwise.

| Area | Representative endpoints | Access |
|---|---|---|
| Health | `GET /health` | Public |
| Configuration | `GET /api/v1/config` | Public |
| Authentication | `POST /api/v1/auth/google`, `GET /api/v1/auth/me` | Public / signed-in |
| Doctors | `GET /api/v1/doctors`, `GET /api/v1/doctors/:id`, `GET /api/v1/doctors/:id/slots` | Public |
| Appointments | `POST /api/v1/appointments`, `GET /api/v1/appointments/mine` | Patient |
| Doctor schedule | `GET /api/v1/doctors/me/profile`, `PUT /api/v1/doctors/me/schedule` | Doctor |
| Consultations | `GET /api/v1/consultations/:appointmentId`, `PUT /api/v1/consultations/:appointmentId` | Authorised participants / doctor |
| Prescriptions | `GET /api/v1/consultations/:appointmentId/prescription.pdf` | Authorised participant |
| Administration | `/api/v1/admin/*` | Admin |
| Public blog | `GET /api/v1/blogs`, `GET /api/v1/blogs/:slug`, `GET /api/v1/categories` | Public |
| Blog management | `/api/v1/admin/blogs`, `POST /api/v1/blogs`, `PATCH /api/v1/blogs/:id` | Admin |
| Contact | `POST /api/v1/contact` | Public |
| Contact management | `/api/v1/admin/contact-messages` | Admin |
| Blog image upload | `POST /api/v1/uploads/blog-image/sign` | Admin |

This is a route overview, not an exhaustive API specification. Consult `server/src/routes/index.js` and `server/src/routes/content.js` for the complete route definitions and middleware.

---

## Authentication and access control

- Google OAuth ID tokens are verified by the backend before a user session is issued.
- The API issues JWTs for subsequent authenticated requests.
- The user's role is loaded from the database during authentication; access checks do not rely only on a potentially stale role claim in a token.
- Patient, doctor and administrator endpoints use role-based middleware.
- A matching verified email in `ADMIN_EMAILS` is assigned the admin role during Google sign-in.
- Development authentication routes are mounted only when `DEV_AUTH=true` and the runtime is not production.
- Doctor password/demo login is separately gated by its environment configuration.

Do not use development authentication or shared demo credentials for a real production clinic.

---

## Payments and consultations

Payment configuration is environment-dependent:

- **Razorpay mode:** requires valid API credentials and webhook configuration.
- **Demo mode:** uses simulated payment behaviour and must be clearly treated as a demonstration.

The Razorpay webhook route receives the raw request body for signature verification. Do not remove or move its raw-body middleware after JSON parsing.

Consultation records are linked to an appointment, doctor and patient. Private notes are intended for the clinical workflow and are not part of the patient-facing public data. Prescription documents are generated by the backend.

---

## Blog and clinic content

Public blog endpoints expose only published posts whose publication time is not in the future. Blog management endpoints require an authenticated administrator.

Blog articles support:
- Markdown content.
- Category, tags and excerpt.
- Optional HTTPS cover-image URL.
- SEO title and description.
- Derived reading-time estimate.
- Draft, publish and unpublish actions.

Cloudinary is optional. If it is not configured, administrators can provide an HTTPS image URL for a cover image. Embedded Markdown images are subject to the frontend content sanitizer.

The contact form is public and rate-limited. Administrators can review submitted enquiries and mark them as handled.

---

## Testing and production build

### Backend tests

From `server/`:

```bash
npm test
```

The test command uses Node.js's built-in test runner over `test/*.test.js`.

### Frontend production build

From `client/`:

```bash
npm run build
```

To preview the built frontend locally:

```bash
npm run preview
```

Run the relevant tests and production build after changing application code. The repository also includes GitHub Actions CI workflows for client and server checks.

---

## Deployment

The current public deployments are:

- **Frontend:** https://health-konnect-seven.vercel.app/
- **Backend:** https://server-alpha-plum.vercel.app/

### Frontend on Vercel

- Set the Vercel project root directory to `client`.
- Use `npm install` / `npm run build` (or the configured Vercel build command).
- Set output directory to `dist`.
- Configure `VITE_API_URL` to the deployed API base URL, including `/api/v1`.
- The SPA rewrite and security headers are defined in `client/vercel.json`.

### Backend on Vercel

- Configure the backend project with the `server` directory as its project root and the repository's serverless entry configuration.
- Add the production environment variables from the backend configuration.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin.
- Configure `MONGODB_URI`, `JWT_SECRET`, Google OAuth, admin email allowlist and payment mode/credentials.
- Verify `/health` after deployment.

### Optional Render deployment

The repository also contains `render.yaml` for a Render API service. If using Render instead of the current Vercel API deployment, configure the required environment variables in Render and point the frontend's `VITE_API_URL` to that API.

### Post-deployment checklist

1. Confirm the frontend loads and the API `/health` endpoint reports database connectivity.
2. Verify Google OAuth authorised origins and redirect behaviour.
3. Verify the API CORS allowlist includes the frontend origin.
4. Test public doctor browsing and appointment availability.
5. Test booking and payment behaviour using the intended payment mode.
6. Test patient, doctor and administrator permissions with separate accounts.
7. Verify consultation and prescription access restrictions.
8. Verify public blog listing and individual article pages.
9. Verify administrator blog and contact-enquiry management.
10. Confirm production environment variables contain no development-only authentication settings.

---

## Security and privacy considerations

This application handles sensitive appointment and consultation-related information. Before using it in a real clinical setting:

- Restrict production database access and use least-privilege credentials.
- Use HTTPS and secure secret management.
- Keep JWT, Google OAuth, MongoDB, Razorpay and Cloudinary secrets private.
- Keep development authentication disabled in production.
- Restrict administrator access to trusted, verified accounts.
- Review access controls, audit logging, retention, backups and incident response.
- Perform independent security, privacy and regulatory reviews appropriate to the deployment jurisdiction.
- Do not use real patient information in development or demonstration environments unless the environment has been appropriately approved and secured.

**This repository documentation does not represent a claim of clinical certification, regulatory compliance or independent security validation.** The application is a software platform and does not replace professional medical judgement or emergency services.

---

## Troubleshooting

### Frontend cannot reach the API

- Check `VITE_API_URL` and ensure it includes `/api/v1`.
- Confirm the backend deployment is healthy at `/health`.
- Check that the frontend origin is listed in backend `CLIENT_ORIGIN`.

### Google sign-in fails

- Confirm `GOOGLE_CLIENT_ID` is configured in the backend.
- Check the Google OAuth client has the correct authorised JavaScript origins.
- Confirm the signing-in email is verified.
- If the account should be an administrator, verify its exact email is present in `ADMIN_EMAILS`, then sign in again so the role is applied.

### Blog articles do not appear

- Confirm the blog seed script has been run against the intended database.
- Confirm an active administrator account exists.
- Confirm the articles are published and have a publication date that is not in the future.
- Check the backend logs and public `GET /api/v1/blogs` response.

### Images do not display

- For the landing-page hero, verify the static image exists at `client/public/images/hero.jpg`; it is served at `/images/hero.jpg`.
- For blog cover images, use a publicly accessible HTTPS URL or configure Cloudinary.
- Confirm remote image hosts allow public access and do not require authentication.

### Database connection fails

- Verify `MONGODB_URI` and the target database name.
- Check MongoDB Atlas network access rules and database-user permissions.
- Do not run destructive database commands to troubleshoot connectivity.

---

## Contributing

1. Create a feature branch from `main`.
2. Keep changes scoped and avoid committing secrets or local environment files.
3. Run the backend tests and frontend production build.
4. Verify affected user roles and workflows.
5. Open a pull request with a clear summary and testing notes.

## License

No open-source license is currently specified in this repository. Unless a license is added, standard copyright restrictions apply; do not assume the code is available for unrestricted reuse.

---

**Tulasi HealthConnect** — connecting clinic discovery, appointments, consultations and mental-health resources in one digital experience.
