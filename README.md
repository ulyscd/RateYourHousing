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

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Add Listings Data

You can add your listings data by inserting them into the database. You can do this by:

1. Making sure you have all dependencies (npm run install:all or npm install)
2. Change directories into the server folder -> cd server
3. Initialize ypur DB schema -> node setup-db.js
4. Run the listings.json to populate your DB! -> node import-listings.js
5. Change directories out by one folder -> cd ..
```

### 3. Run the Application

```bash
npm run dev
```

This will start both the frontend (http://localhost:3000) and backend (http://localhost:5001) servers.

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

## Notes

- The map uses OpenStreetMap tiles (free, no API key required)
- Eugene, Oregon coordinates: 44.0521, -123.0868
- User images are stored in `server/uploads/` directory
- Database file is created automatically at `server/database.sqlite`

