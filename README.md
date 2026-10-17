# Tulasi HealthConnect (v2)

Full-stack telepsychiatry & clinic booking platform.

**Stack:** React 18 + Vite + Tailwind · Node 20 + Express 5 · MongoDB (Mongoose) · Google Sign-In · Razorpay · Jitsi · PDFKit

## What's in v2

| Area | v1 (uploaded) | v2 |
|---|---|---|
| Sign-in | Phone OTP stub | **Google Sign-In only** (ID token verified server-side). Doctors/admins are pre-provisioned by email |
| Booking | Pay-less booking, any start time accepted | Slot must match the doctor's open slots; **10-min payment hold**, atomic double-booking guard (partial unique index), max 3 unpaid holds per patient |
| Payments | none | **Razorpay (test mode)**: server-created orders, HMAC signature verification, **webhook** for closed-tab safety, **automatic refunds** (full if clinic cancels, or patient cancels ≥ 2h before) and admin retry for failed refunds. Mock mode when no keys are set (dev only) |
| Video | mock overlay | **Jitsi** room per paid online appointment, embedded in-app; link only released in a window (10 min before → 30 min after) to the two participants |
| Clinical | none | Doctor **private notes**, diagnosis, medicines, advice, follow-up; **finalize → patient-visible e-prescription → PDF download** |
| Admin | audit log | Stats, add/hide doctors, edit fees, all appointments, refund retry, audit log |
| Ops | none | Env validation, rate limits, Helmet, graceful shutdown, tests, CI, Render + Vercel configs |

## Run locally

Prereqs: Node 20+, MongoDB (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env        # set MONGODB_URI and a 32+ char JWT_SECRET; keep DEV_AUTH=true for local testing
npm install
npm run seed                # 3 demo doctors
npm run dev                 # http://localhost:5000

# 2. Web (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

With `DEV_AUTH=true` and no Google/Razorpay keys, the sign-in dialog shows a **developer login** (any email; click a seeded doctor like `anita.rao`) and payments run in **mock mode** (a confirm dialog simulates payment). Try the full flow:

1. Sign in with any email → book a slot for Dr. Anita Rao → confirm the mock payment.
2. In another browser profile, developer-login as `anita.rao@example.com` → *My practice* → open the consult → write notes → **Finalize & share**.
   Note: notes open 15 minutes before the slot starts, and the video room opens 10 minutes before. To test now, book the earliest slot available (a slot at least 15 min out is the earliest bookable).
3. Back as the patient → *My appointments* → download the prescription PDF.
4. Developer-login with an email listed in `ADMIN_EMAILS` for the admin console.

## Configure real services

### Google Sign-In
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create credentials → **OAuth client ID** → *Web application*.
2. Authorized JavaScript origins: `http://localhost:5173` and your Vercel URL. (No redirect URI is needed for the ID-token button.)
3. Put the client ID in `server/.env` as `GOOGLE_CLIENT_ID`. The frontend reads it from the API (`/config`), so there's nothing to set in the client.
4. Add your own email to `ADMIN_EMAILS` to become an admin on sign-in.

**Adding doctors:** Admin → Doctors → *Add a doctor* with their Google email. They sign in with that Google account and automatically get the doctor role.

### Razorpay (test mode)
1. Dashboard → Test mode → API keys → copy `rzp_test_…` key id & secret into `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
2. Webhooks → add `https://<your-api>/api/v1/payments/razorpay/webhook`, active events `payment.captured` and `order.paid`, and set the same secret as `RAZORPAY_WEBHOOK_SECRET`. (For local testing expose the API with a tunnel such as ngrok.)
3. Test card: any future expiry/CVV with `4111 1111 1111 1111`; UPI test id `success@razorpay`.
4. Payments must be auto-captured (the default for test mode); the webhook confirms bookings on capture.

### Jitsi
Works out of the box with `meet.jit.si`. Room names are random and unguessable, and the link is only returned to the booked patient/doctor during the join window. Caveats: the public server has no lobby/authentication and the public instance may limit embedded sessions (the UI has an **Open in new tab** fallback). For production, self-host Jitsi (or use JaaS) and set `JITSI_DOMAIN`.

## Deploy

**API → Render**: New → Blueprint → select this repo (uses `render.yaml`). Fill the `sync: false` env vars: `MONGODB_URI` (MongoDB Atlas, allow Render's IPs), `CLIENT_ORIGIN` (your Vercel URL), `GOOGLE_CLIENT_ID`, `ADMIN_EMAILS`, and the three Razorpay values. In production the server refuses to start without Google and Razorpay settings, and `DEV_AUTH`/mock payments are impossible.

**Web → Vercel**: Import the repo, set *Root Directory* = `client`, add env `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1`. `vercel.json` handles SPA routing.

Render's free tier sleeps when idle, so the first request after a pause can take ~30s. Hold-expiry also runs on every slot/booking read, so correctness doesn't depend on the background timer being awake.

## Project layout
```
server/src
  config/        env validation (zod), db
  models/        User, DoctorProfile, Appointment, Consultation, AuditLog
  controllers/   auth, doctor, appointment, consultation, admin, payment(webhook)
  services/      bookingService (holds, confirm, refund), paymentService, razorpay, prescriptionPdf, audit
  utils/         slots (pure, IST), jitsi, errors
  jobs/          hold sweeper
server/test      node:test suites (slots, signatures, PDF, API guards)
client/src       pages/, components/, context/, lib/, services/
```

## API summary (`/api/v1`)
Public: `GET /config`, `POST /auth/google`, `GET /doctors`, `GET /doctors/:id`, `GET /doctors/:id/slots?date=YYYY-MM-DD`
Patient: `POST /appointments`, `GET /appointments/mine`, `POST /appointments/:id/payment`, `POST /appointments/:id/payment/verify`
Doctor: `GET /appointments/doctor?scope=today|upcoming`, `PUT /doctors/me/schedule`, `PUT /consultations/:appointmentId`, `POST /consultations/:appointmentId/finalize`
Participants: `GET /appointments/:id`, `PATCH /appointments/:id/status`, `GET /consultations/:appointmentId[/prescription.pdf]`
Admin: `GET /admin/stats|doctors|appointments|audit-logs`, `POST|PATCH /admin/doctors`, `POST /admin/appointments/:id/retry-refund`
Webhook: `POST /payments/razorpay/webhook`

## Design notes & limits
- **Privacy:** admins cannot read consultation notes or prescriptions; patients never see private notes; the PDF is served only to the two participants and is not cached.
- **Prescriptions** are electronic summaries bearing the doctor's registration number. Compliance requirements for e-prescribing (and controlled drugs) vary; have your clinical/legal lead review before going live. This is not a substitute for that review.
- **Not included (future work):** email/SMS/WhatsApp reminders, GST invoices, patient medical-history profile, multi-clinic support, E2E browser tests.
- Tests cover slot logic, payment/webhook signatures, PDF generation and API guards. The booking/payment flow against a live MongoDB and live Razorpay/Google was **not** exercised in the build environment (no database or outbound access), so please run the local walkthrough above once before deploying.
