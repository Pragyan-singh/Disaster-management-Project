# Disaster Management Project

## Overview
This project is a decentralized disaster management platform built for the DFINITY Internet Computer. It connects victims, volunteers, organizations, donors, and administrators through a web-based frontend and a Rust-based backend canister.

The platform supports:
- victim help requests with geolocation,
- volunteer location tracking and request verification,
- organization request management, supply bundle creation, and donation tracking,
- donor donation submission and history,
- admin user management and full data clearing.

## Tech Stack

### Internet Computer / Backend
- **DFINITY Internet Computer** via `dfx`
- **Rust** for the canister backend
- `ic-cdk` macros: `init`, `query`, `update`, `pre_upgrade`, `post_upgrade`
- `ic_stable_structures` for stable storage using `MemoryManager`, `VirtualMemory`, `StableBTreeMap`
- `candid` for backend type encoding/decoding and interface definitions
- `serde` for serializing Rust structs
- `project_backend.did` defines the canister interface exposed to the frontend

### Frontend
- **React** with **Vite**
- **TypeScript / JavaScript** (React components are written in `.jsx` and project uses `tsconfig` / type declarations)
- **React Router DOM** for client-side routing
- **Leaflet** and **React-Leaflet** for interactive maps and location display
- **OpenStreetMap / Nominatim** reverse geocoding for human-readable location addresses
- **Sass** for styling
- **Vitest** and React Testing Library tooling for tests

### Canister Integration
- `@dfinity/agent`, `@dfinity/auth-client`, `@dfinity/candid`, `@dfinity/principal`
- Generated declarations in `src/declarations/project_backend`
- Frontend uses these declarations to call backend canister methods directly

## Repository Structure

- `dfx.json` - Internet Computer canister configuration
- `Cargo.toml` - Rust workspace config for backend
- `package.json` - root package config and npm workspace settings
- `src/project_backend` - backend canister source and candid interface
- `src/project_frontend` - frontend application source
- `src/declarations` - generated backend/frontend canister declarations for the Internet Computer
- `src/project_frontend/src` - React source files, pages, components, styles
- `src/project_backend/src/lib.rs` - core backend canister logic

## How the Project Works

### Backend Logic (`src/project_backend/src/lib.rs`)
- Backend stores data in stable memory using `StableBTreeMap` and `MemoryManager`
- Data types include:
  - `User`
  - `HelpRequest`
  - `VolunteerLocation`
  - `SupplyBundle`
  - `Donation`
- During initialization, the canister preloads stable memory and inserts default users for admin, organization, and donor roles.

### User Roles
- `admin` - full user management and data administration
- `volunteer` - updates location, sees nearby help requests, and verifies requests
- `victim` - publishes help requests, sees active requests, and cancels requests
- `organization` - manages requests, volunteers, supplies, donations, and can verify / assign requests
- `donor` - submits donations and views donation history

### Core Canister Methods
Based on the `project_backend.did` interface, the backend exposes methods such as:
- `register_user(User) -> bool`
- `get_user(text) -> opt User`
- `verify_password(text, text) -> bool`
- `is_admin(text) -> bool`
- `organization_login(text, text) -> bool`
- `admin_login(text, text) -> bool`
- `create_help_request(HelpRequest) -> bool`
- `get_user_requests(text) -> vec HelpRequest`
- `get_all_requests() -> vec HelpRequest`
- `update_request_status(text, text, text) -> bool`
- `cancel_help_request(text, text) -> bool`
- `update_volunteer_location(text, text, text, text) -> bool`
- `get_nearby_requests(text, text) -> vec HelpRequest`
- `verify_help_request(text, text, text, text) -> bool`
- `get_all_volunteers() -> vec User`
- `create_supply_bundle(SupplyBundle) -> bool`
- `distribute_supply_bundle(text, text) -> bool`
- `get_organization_donations() -> vec Donation`
- `assign_volunteer_to_request(text, text) -> bool`
- `make_donation(Donation) -> bool`
- `get_donor_donations(text) -> vec Donation`

### Frontend Flow

#### Authentication
- Users can register via `src/project_frontend/src/pages/auth/Register.jsx`
- Login logic lives in `src/project_frontend/src/pages/auth/Login.jsx`
- Admin login is handled separately in `src/project_frontend/src/pages/auth/AdminLogin.jsx`
- Organization login is handled in `src/project_frontend/src/pages/auth/OrganizationLogin.jsx`
- The frontend calls backend methods like `register_user`, `get_user`, `verify_password`, and `is_admin` to authenticate users.

#### Routing and Role-Based Access
- `src/project_frontend/src/App.jsx` sets up routes for admin, victim, volunteer, organization, and donor areas
- Uses protected routes to prevent unauthenticated access
- Redirects users to their dashboard based on `user_type`

#### Victim Experience
- Victims create help requests with `create_help_request`
- GPS coordinates are fetched from browser geolocation APIs
- Address lookup uses OpenStreetMap reverse geocoding
- Victims can view and cancel active requests

#### Volunteer Experience
- Volunteers update their location via `update_volunteer_location`
- Nearby requests are retrieved using `get_nearby_requests`
- Volunteers verify help requests using `verify_help_request`
- The map shows request locations with Leaflet

#### Organization Experience
- Organizations load all requests, volunteers, supply bundles, and donations
- They can verify requests, assign volunteers, create supply bundles, and distribute supplies
- Dashboard methods include `get_all_requests`, `get_all_volunteers`, `create_supply_bundle`, `distribute_supply_bundle`, and `get_organization_donations`

#### Donor Experience
- Donors submit donations through `make_donation`
- Donation history is displayed using `get_donor_donations`

#### Admin Experience
- Admin dashboard lists all registered users via `get_all_users`
- Admins can delete users and clear data using backend helpers like `clear_database`, `clear_help_requests`, `clear_volunteer_locations`, `clear_supply_bundles`, and `clear_donations`

## Setup and Run

### Prerequisites
- Node.js >= 16
- npm >= 7
- `dfx` Internet Computer SDK installed
- Rust toolchain for canister compilation

### Install Dependencies
```bash
npm install
```

### Deploy Backend Canister
From the root or `src/project_frontend` folder:
```bash
dfx canister create project_backend
npm --prefix src/project_frontend run prebuild
npm --prefix src/project_frontend run build
# or use the setup script if available
npm --prefix src/project_frontend run setup
```

### Run Frontend Locally
```bash
cd src/project_frontend
npm run dev
```

### Build for Production
```bash
cd src/project_frontend
npm run build
```

### Run Tests
```bash
cd src/project_frontend
npm test
```

## Important Notes
- The frontend is configured to use environment variables from `dfx deploy` in `src/project_frontend/vite.config.js`
- The `dfx.json` file includes a custom `Internet Identity` canister and specific security headers for content sources and map APIs
- The backend persists data in stable memory so that state survives upgrades

## Key Files
- `src/project_backend/src/lib.rs` - backend canister implementation
- `src/project_backend/project_backend.did` - canister interface definitions
- `src/project_frontend/src/App.jsx` - route and authentication coordination
- `src/project_frontend/src/pages` - role-specific dashboards and authentication pages
- `src/project_frontend/vite.config.js` - Vite config and canister environment wiring
- `dfx.json` - canister definitions and deployment configuration

## Summary
This repository is a full-stack distributed disaster relief app using the Internet Computer. The backend canister stores application state, and the React frontend provides role-based dashboards for victims, volunteers, organizations, donors, and administrators. The application integrates mapping, geolocation, supply/donation workflows, and user management in a DFINITY-connected architecture.