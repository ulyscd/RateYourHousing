import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get the JSON file path from command line argument or use default
const jsonFilePath = process.argv[2] || path.join(__dirname, 'listings.json')

const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

// Check if JSON file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`\n❌ Error: JSON file not found at: ${jsonFilePath}`)
  console.log('\nUsage: node server/import-listings.js [path/to/listings.json]')
  console.log('If no path is provided, it will look for listings.json in the server directory.\n')
  process.exit(1)
}

// Read and parse JSON file
console.log(`Reading listings from: ${jsonFilePath}`)
let jsonData
try {
  const fileContent = fs.readFileSync(jsonFilePath, 'utf8')
  jsonData = JSON.parse(fileContent)
} catch (error) {
  console.error(`\n❌ Error reading or parsing JSON file:`, error.message)
  process.exit(1)
}

// Handle different JSON structures: array or object with listings property
let listings
if (Array.isArray(jsonData)) {
  listings = jsonData
} else if (jsonData.listings && Array.isArray(jsonData.listings)) {
  listings = jsonData.listings
} else if (jsonData.data && Array.isArray(jsonData.data)) {
  listings = jsonData.data
} else {
  console.error('\n❌ Error: JSON file must contain an array of listings or an object with a listings/data array property')
  process.exit(1)
}

if (listings.length === 0) {
  console.error('\n❌ Error: No listings found in JSON file')
  process.exit(1)
}

console.log(`Found ${listings.length} listing(s) to import\n`)

// Function to import listings
function importListings(listings) {
  let imported = 0
  let errors = 0

  const stmt = db.prepare(`
    INSERT INTO listings (name, address, latitude, longitude, price, bedrooms, bathrooms, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Use serialize to ensure proper ordering
  db.serialize(() => {
    listings.forEach((listing, index) => {
      // Handle different property name variations
      const listingData = {
        name: listing.name || listing.Name || listing.title || listing.Title || null,
        address: listing.address || listing.Address || listing.location || listing.Location || null,
        latitude: parseFloat(listing.latitude || listing.Latitude || listing.lat || listing.Lat || null),
        longitude: parseFloat(listing.longitude || listing.Longitude || listing.lng || listing.Lng || listing.lon || listing.Lon || null),
        price: listing.price || listing.Price || listing.rent || listing.Rent || null,
        bedrooms: listing.bedrooms ? String(listing.bedrooms) : (listing.Bedrooms ? String(listing.Bedrooms) : (listing.beds ? String(listing.beds) : null)),
        bathrooms: listing.bathrooms ? String(listing.bathrooms) : (listing.Bathrooms ? String(listing.Bathrooms) : (listing.baths ? String(listing.baths) : null)),
        description: listing.description || listing.Description || listing.desc || listing.details || null,
        image_url: listing.image_url || listing.imageUrl || listing.image || listing.Image || (listing.photos && listing.photos.length > 0 ? listing.photos[0] : null) || null
      }

      if (!listingData.name) {
        console.error(`⚠️  Skipping listing at index ${index}: missing name field`)
        errors++
        return
      }

      stmt.run(
        listingData.name,
        listingData.address,
        isNaN(listingData.latitude) ? null : listingData.latitude,
        isNaN(listingData.longitude) ? null : listingData.longitude,
        listingData.price,
        listingData.bedrooms,
        listingData.bathrooms,
        listingData.description,
        listingData.image_url,
        (err) => {
          if (err) {
            console.error(`❌ Error inserting "${listingData.name}":`, err.message)
            errors++
          } else {
            console.log(`✓ Inserted: ${listingData.name}`)
            imported++
          }

          // Check if we've processed all listings
          if (imported + errors === listings.length) {
            stmt.finalize((err) => {
              if (err) {
                console.error('\n❌ Error finalizing statement:', err.message)
              } else {
                console.log(`\n✅ Import complete!`)
                console.log(`   Imported: ${imported}`)
                if (errors > 0) {
                  console.log(`   Errors: ${errors}`)
                }
              }
              db.close()
            })
          }
        }
      )
    })
  })
}

// Start import
importListings(listings)

