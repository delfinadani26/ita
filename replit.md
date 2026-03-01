# URNM Congresso — Event Management App

A full-stack mobile application for managing an academic congress event.

## Architecture

- **Frontend**: Expo (React Native) with Expo Router file-based routing, port 8081
- **Backend**: Express.js with TypeScript, port 5000
- **Database**: PostgreSQL (Neon via Replit)
- **Auth**: express-session with bcryptjs password hashing

## User Roles

- **participant** — Regular attendees (Docente, Estudante, Outro, Preletor)
- **avaliador** — Paper reviewers, can approve/reject submissions
- **admin** — Super administrators with full access

## App Structure

```
app/
  _layout.tsx        — Root layout with AuthProvider, font loading, QueryClient
  index.tsx          — Splash screen with redirect based on auth state
  (auth)/
    login.tsx        — Login screen
    register.tsx     — Registration with category, affiliation, institution
  (tabs)/
    _layout.tsx      — Tab layout (NativeTabs/ClassicTabs with liquid glass)
    index.tsx        — Home: congress info, pricing, participant stats
    submissions.tsx  — Submit and track scientific communications
    admin.tsx        — Admin panel: review submissions, manage participants
    messages.tsx     — Message thread list
    profile.tsx      — User profile with QR code
  scanner.tsx        — QR code scanner for event check-in
  chat/[userId].tsx  — Direct messaging between users
  submission/[id].tsx — Submission detail and review
```

## Key Features

1. **Registration & Auth**: Full academic profile (degree, category, institution, URNM/External)
2. **QR Code Credentialing**: Each user gets a unique QR code for event check-in
3. **Submission System**: PDF/DOCX upload with thematic axis selection
4. **Review Workflow**: Evaluators approve/reject submissions, triggering payment flow
5. **Mini Chat**: Direct messaging between participants and evaluators
6. **Admin Dashboard**: Financial reports, participant stats, payment management
7. **QR Scanner**: Camera-based QR scanning for check-in

## Congress Details

- **Event**: 01 March 2026 — 30 April 2026
- **Thematic Axes**:
  1. Ensino e Investigação aplicada ao sector agro-alimentar
  2. Contribuição sector agro na economia nacional
  3. Integração empresarial na criação de políticas de desenvolvimento

## Pricing

| Category | URNM | External |
|---|---|---|
| Docentes/Investigators | 5,000 Kz | 7,000 Kz |
| Students | 3,000 Kz | 4,000 Kz |
| Others | 5,000 Kz | 10,000 Kz |
| Prelectores | 20,000 Kz | 20,000 Kz |

## Default Admin

- Email: admin@urnm.ao
- Password: admin123

## Tech Stack

- React Native + Expo SDK 54
- Expo Router v6 (file-based routing)
- @tanstack/react-query
- @expo-google-fonts/poppins (typography)
- react-native-qrcode-svg (QR generation)
- expo-camera (QR scanning)
- expo-document-picker (file upload)
- expo-linear-gradient (UI)
- express-session + bcryptjs (auth)
- multer (file uploads)
- PostgreSQL with direct pg pool
