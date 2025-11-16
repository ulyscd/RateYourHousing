# Quick Start Guide

## 1. Install Dependencies

Run this command in the root directory:

```bash
npm run install:all
```

This will install dependencies for both the frontend and backend.

## 2. Initialize Database

The database will be created automatically when you start the server, or you can run:

```bash
node server/setup-db.js
```

## 3. Add Your Listings Data

You have several options to add your listings:

### Option A: Using SQL directly

Use any SQLite client (like DB Browser for SQLite) to insert your listings:

```sql
INSERT INTO listings (name, address, latitude, longitude, price, bedrooms, bathrooms, description, image_url)
VALUES ('Apartment Name', '123 Main St, Eugene, OR', 44.0521, -123.0868, '$1200/month', '2', '1', 'Description', 'https://example.com/image.jpg');
```

### Option B: Using the import script

Edit `server/import-listings.js`, add your listings data to the `exampleListings` array, uncomment the import call, and run:

```bash
node server/import-listings.js
```

### Option C: Using a JSON file

Create a `listings.json` file and modify `server/import-listings.js` to read from it.

## 4. Start the Application

```bash
npm run dev
```

This starts both:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## 5. Use the Application

1. Open http://localhost:3000 in your browser
2. You'll see a map of Eugene, Oregon with apartment markers
3. Click on a marker or listing to view details
4. Submit reviews with ratings and images
5. Reviews are automatically saved to the database

## Important Notes

- **Coordinates**: Eugene, Oregon is centered at approximately 44.0521, -123.0868
- **Images**: User-uploaded images are stored in `server/uploads/`
- **Database**: The SQLite database is at `server/database.sqlite`
- **Reviews**: When a review is submitted, it automatically:
  - Creates/links a user
  - Creates the review record
  - Links a rating (1-5 stars)
  - Saves uploaded images
  - Updates the listing's average rating

## Troubleshooting

- If the map doesn't load, check your internet connection (OpenStreetMap tiles are loaded from the internet)
- If images don't display, ensure the `server/uploads/` directory exists
- Make sure both frontend and backend are running

