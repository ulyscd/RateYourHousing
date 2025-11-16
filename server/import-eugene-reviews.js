import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

// Read the reviews JSON file
const reviewsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'eugene_apartment_reviews.json'), 'utf8')
)

// Helper function to update listing average rating
const updateListingAverageRating = (listingId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT AVG(r.rating) as avg_rating 
       FROM ratings r 
       JOIN reviews rev ON r.review_id = rev.id 
       WHERE rev.listing_id = ?`,
      [listingId],
      (err, row) => {
        if (err) {
          reject(err)
          return
        }
        db.run(
          `UPDATE listings SET average_rating = ? WHERE id = ?`,
          [row.avg_rating || 0, listingId],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      }
    )
  })
}

// Get or create user
const getOrCreateUser = (name) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM users WHERE name = ?`,
      [name],
      (err, row) => {
        if (err) {
          reject(err)
          return
        }
        if (row) {
          resolve(row.id)
        } else {
          db.run(
            `INSERT INTO users (name) VALUES (?)`,
            [name],
            function(err) {
              if (err) reject(err)
              else resolve(this.lastID)
            }
          )
        }
      }
    )
  })
}

// Get or create listing
const getOrCreateListing = (apartmentName) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM listings WHERE name = ?`,
      [apartmentName],
      (err, row) => {
        if (err) {
          reject(err)
          return
        }
        if (row) {
          resolve(row.id)
        } else {
          // Create new listing with just the name
          // Address and coordinates can be added later
          db.run(
            `INSERT INTO listings (name, address) VALUES (?, ?)`,
            [apartmentName, 'Eugene, OR'],
            function(err) {
              if (err) reject(err)
              else resolve(this.lastID)
            }
          )
        }
      }
    )
  })
}

// Create review
const createReview = (listingId, userId, text) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO reviews (listing_id, user_id, text) VALUES (?, ?, ?)`,
      [listingId, userId, text],
      function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      }
    )
  })
}

// Create rating
const createRating = (reviewId, rating) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ratings (review_id, rating) VALUES (?, ?)`,
      [reviewId, rating],
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

// Main import function
async function importReviews() {
  console.log(`Starting import of ${reviewsData.length} reviews...`)
  
  let imported = 0
  let errors = 0
  
  for (const review of reviewsData) {
    try {
      // Get or create listing
      const listingId = await getOrCreateListing(review.apartment_name)
      
      // Get or create user
      const userId = await getOrCreateUser(review.first_name)
      
      // Create review
      const reviewId = await createReview(listingId, userId, review.review)
      
      // Create rating
      await createRating(reviewId, review.stars)
      
      // Update listing average rating
      await updateListingAverageRating(listingId)
      
      imported++
      console.log(`✓ Imported review ${imported}/${reviewsData.length}: ${review.apartment_name} - ${review.first_name}`)
    } catch (error) {
      errors++
      console.error(`✗ Error importing review for ${review.apartment_name}:`, error.message)
    }
  }
  
  console.log(`\n✅ Import complete!`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
  
  db.close()
}

// Run the import
importReviews().catch(err => {
  console.error('Fatal error:', err)
  db.close()
  process.exit(1)
})
