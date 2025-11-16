# RateYourHousing

A web application for rating and reviewing apartments in Eugene, Oregon.

## Features

- Interactive map of Eugene, Oregon with apartment markers
- Searchable apartment listings
- Detailed apartment profiles with ratings and reviews
- User-generated reviews with star ratings and images
- Automatic rating calculation based on user reviews

## Tech Stack

- **Frontend**: React, Tailwind CSS, Leaflet (maps)
- **Backend**: Node.js, Express.js
- **Database**: SQLite

## Setup Instructions

### 1. Install Dependencies (root)

Install root, client and server dependencies in one step from the repository root:

```bash
npm run install:all
```

### 2. Initialize the local database (server)

Create the SQLite schema (creates `server/database.sqlite` and required tables):

```bash
cd server
node setup-db.js
```

### 3. Populate listings and reviews

Populate the listings table (default reads `server/listings.json`):

```bash
node import-listings.js
```

Populate the reviews table (default reads `server/eugene_apartment_reviews.json`):

```bash
npm run import-reviews
```

`import-reviews` now automatically recalculates each listing's `average_rating` after the import so the UI reflects the new averages.

If you need to re-run the averages independently you can run:

```bash
npm run recalc-averages
```

If duplicate listings appear after imports, run the dedupe script which will backup the DB and consolidate listings with the same name:

```bash
npm run dedupe-listings
```

### 4. Start the app (development)

From the repository root run:

```bash
npm run dev
```

This runs both frontend (http://localhost:3000) and backend (http://localhost:5001) using `concurrently` and a Vite dev server proxy so the client can call `/api/*` without additional config.

### One-command initialize (optional)

To create the DB schema, import listings and reviews in one sequence you can run the following from `server/` (or add a combined npm script):

```bash
node setup-db.js && node import-listings.js && npm run import-reviews
```

## Project Structure

```
RateMyHousing/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── services/     # API services
│   └── package.json
├── server/          # Express backend
│   ├── server.js    # Main server file
│   ├── uploads/     # User-uploaded images
│   └── package.json
└── package.json     # Root package.json
```

## Database Schema

- **users**: Stores user information
- **listings**: Stores apartment/housing listings
- **reviews**: Stores user reviews for listings
- **ratings**: Stores star ratings (1-5) linked to reviews
- **images**: Stores user-uploaded images linked to reviews

## API Endpoints

- `GET /api/listings` - Get all listings
- `GET /api/listings/:id` - Get a single listing
- `GET /api/reviews/listing/:listingId` - Get reviews for a listing
- `POST /api/reviews` - Submit a new review (multipart/form-data)

## Helpful scripts (server)

- `npm run dev` - start server in watch mode (inside `server/`)
- `npm run import-reviews` - import reviews from `server/eugene_apartment_reviews.json` (and recalc averages)
- `npm run recalc-averages` - recalculate `average_rating` for each listing
- `npm run dedupe-listings` - dedupe listings with the same name (creates DB backup before modifying)

## Notes

- The map uses OpenStreetMap tiles (free, no API key required)
- Eugene, Oregon coordinates: 44.0521, -123.0868
- User images are stored in `server/uploads/` directory
- Database file is created automatically at `server/database.sqlite`

## Troubleshooting

- If `import-reviews` shows `no such table: listings`, run `node setup-db.js` first to create the schema.
- If the sidebar still shows zeros after import, run `npm run recalc-averages` and restart the dev server if necessary.
- If the dev server fails with `EADDRINUSE` when starting, find and kill the process using port 5001:

```bash
lsof -i :5001 -Pn
kill <PID>
```

