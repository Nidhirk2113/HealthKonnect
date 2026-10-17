# Tulasi HealthConnect 💚🌱

**A Full-Stack Mental Healthcare Appointment and Consultation Platform**

Tulasi HealthConnect is a web-based healthcare platform designed to streamline the mental healthcare journey by connecting patients with practitioners through a centralized digital experience. It supports appointment booking, practitioner scheduling, consultation documentation, and prescription management through role-based interfaces.

## Overview

The platform provides separate workflows for patients, doctors, and administrators, helping organize the appointment lifecycle from practitioner discovery to post-consultation documentation.

## Key Features

### Patient Portal
- Browse and discover available practitioners.
- View practitioner profiles and available appointment slots.
- Book appointments and access appointment history.
- Track appointment and payment status.
- Access consultation information and finalized prescriptions where authorized.

### Doctor Dashboard
- View assigned appointments and daily schedules.
- Manage consultation availability, working hours, and consultation preferences.
- Access appointments associated with the authenticated practitioner.
- Record consultation notes and clinical details.
- Finalize consultations and generate prescription documents.

### Administration
- Manage practitioner records and account status.
- View platform statistics and appointment information.
- Review audit logs and support payment-refund workflows.

### Authentication and Security
- Google OAuth sign-in.
- JWT-based authentication.
- Role-based access control for patients, doctors, and administrators.
- Server-side validation and protected API endpoints.
- Appointment and consultation access restrictions for authorized users.
- Development-only authentication for local demonstrations.

### Consultation and Payments
- Consultation documentation and finalization workflows.
- Prescription PDF generation.
- Configurable payment integration using Razorpay.
- Payment verification and refund-related workflows.

*Feature availability depends on environment configuration and successful integration setup.*

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | Google OAuth, JWT |
| Validation | Zod |
| Payments | Razorpay integration |
| Document generation | PDF prescription generation |
| Testing | Node.js test runner and Supertest-based API tests |
| Deployment | Vercel-compatible frontend and backend deployment configuration |

## Project Structure

```text
tulasi-healthconnect/
├── .github/
│   └── workflows/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── services/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── scripts/
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── test/
│   ├── .env.example
│   └── package.json
├── render.yaml
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB instance
- Google OAuth credentials for Google sign-in
- Git

Optional integrations, such as Razorpay, require their own credentials and configuration.

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd tulasi-healthconnect
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository's actual URL.

### 2. Configure the backend

```bash
cd server
npm install
```

Create a local `.env` file based on `server/.env.example` and configure the required environment variables.

At minimum, configure the MongoDB connection, JWT secret, Google OAuth settings, and any additional variables required by the server configuration.

Start the backend:

```bash
npm run dev
```

The default local API base URL is:

```text
http://localhost:5000/api/v1
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd client
npm install
```

Create a local `.env` file based on `client/.env.example`.

Set the API URL:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

### 4. Seed development data

If your local database needs the bundled practitioner demo data, run the seed script from the backend directory:

```bash
npm run seed
```

Run this only after configuring the correct database connection. Review the seed script before executing it against any database containing important data.

### 5. Build and test

Build the frontend for production:

```bash
cd client
npm run build
```

Run the backend test suite using the script defined in `server/package.json`:

```bash
cd server
npm test
```

## Environment Configuration

Keep credentials in local environment files or your deployment provider's environment settings.

Common configuration categories include:

- MongoDB connection URI
- JWT signing secret and expiration
- Google OAuth client ID
- Allowed frontend origins for CORS
- Development authentication toggle
- Payment provider configuration
- Clinic or application settings

Refer to `client/.env.example`, `server/.env.example`, and `server/src/config/env.js` for the exact variable names and requirements.

**Security note:** Never commit actual `.env` files, database credentials, JWT secrets, payment secrets, or private keys. Development authentication must remain disabled in production.

## Deployment

The project includes deployment configuration files for hosting.

A typical deployment requires:

1. Deploying the React frontend.
2. Deploying the Express API with a compatible serverless entry point or hosting configuration.
3. Configuring MongoDB connectivity and production environment variables.
4. Setting the frontend API URL to the deployed backend.
5. Configuring Google OAuth authorized origins and backend CORS.
6. Verifying authentication, appointment booking, payment handling, and consultation access in the deployed environment.

For Vercel deployments, configure the frontend and backend according to their respective project roots and entry-point requirements. Do not assume local development authentication will work in production.

## Security and Privacy

Tulasi HealthConnect is designed with authentication, role-based authorization, and protected healthcare workflows. Production deployment should also include appropriate access controls, secure secret management, HTTPS, database access restrictions, and privacy safeguards for patient and consultation information.

This repository should not be treated as a certified or compliance-validated clinical system without the necessary independent security, privacy, and regulatory assessments.

## Future Enhancements

Potential areas for further development include:

- Automated appointment reminders.
- Enhanced practitioner and patient dashboards.
- Improved consultation follow-up workflows.
- Expanded reporting and analytics.
- Additional accessibility and usability improvements.

## Contributing

Contributions, suggestions, and bug reports are welcome. For substantial changes, create a separate branch and test the affected workflows before submitting a pull request.

## License

No license has been specified yet. Add a `LICENSE` file before distributing the project under an open-source license.

---

**Tulasi HealthConnect** — bringing practitioner discovery, appointment management, and consultation workflows into one digital platform.
