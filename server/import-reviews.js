import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get the JSON file path from command line argument or use default
const jsonFilePath = process.argv[2] || path.join(__dirname, 'eugene_apartment_reviews.json')

const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

// Check if JSON file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`\n[31mError: JSON file not found at: ${jsonFilePath}\u001b[0m`)
  console.log('\nUsage: node import-reviews.js [path/to/reviews.json]')
  console.log('If no path is provided, it will look for eugene_apartment_reviews.json in the server directory.\n')
  process.exit(1)
}

// Read and parse JSON file
console.log(`Reading reviews from: ${jsonFilePath}`)
let jsonData
try {
  const fileContent = fs.readFileSync(jsonFilePath, 'utf8')
  jsonData = JSON.parse(fileContent)
} catch (error) {
  console.error(`\n[31mError reading or parsing JSON file:\u001b[0m`, error.message)
  process.exit(1)
}

let reviews
if (Array.isArray(jsonData)) {
  reviews = jsonData
} else if (jsonData.reviews && Array.isArray(jsonData.reviews)) {
  reviews = jsonData.reviews
} else if (jsonData.data && Array.isArray(jsonData.data)) {
  reviews = jsonData.data
} else {
  console.error('\n[31mError: JSON file must contain an array of review objects\u001b[0m')
  process.exit(1)
}

if (reviews.length === 0) {
  console.error('\n[31mError: No reviews found in JSON file\u001b[0m')
  process.exit(1)
}

console.log(`Found ${reviews.length} review(s) to import\n`)

let imported = 0
let errors = 0

// Helper to mark done
function checkDone() {
  if (imported + errors === reviews.length) {
    console.log(`\n[32mImport complete!\u001b[0m`)
    console.log(`   Imported: ${imported}`)
    if (errors > 0) console.log(`   Errors: ${errors}`)
    db.close()
    
    // Recalculate averages so the UI reflects new ratings
    const cmd = 'node recalc-averages.js'
    console.log('Running:', cmd)
    exec(cmd, { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error('Error running recalc-averages:', err.message)
        if (stderr) console.error(stderr)
        return
      }
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
    })
  }
}

// Start serial import
db.serialize(() => {
  reviews.forEach((item, index) => {
    const aptName = (item.apartment_name || item.apartment || '').trim()
    const userName = (item.first_name || item.user_name || 'Anonymous').trim()
    const rating = Number.isFinite(item.stars) ? Number(item.stars) : (item.rating ? Number(item.rating) : null)
    const text = (item.review || item.text || '').trim()

    if (!aptName || !text) {
      console.error(`\u26A0\uFE0F  Skipping review at index ${index}: missing apartment_name or review text`)
      errors++
      checkDone()
      return
    }

    // Find listing id by name
    db.get(`SELECT id FROM listings WHERE name = ?`, [aptName], (err, listingRow) => {
      if (err) {
        console.error(`\u274C Error looking up listing "${aptName}":`, err.message)
        errors++
        checkDone()
        return
      }

      const ensureListing = (cb) => {
        if (listingRow && listingRow.id) return cb(listingRow.id)
        // If listing doesn't exist, create a minimal listing record
        db.run(`INSERT INTO listings (name) VALUES (?)`, [aptName], function(err) {
          if (err) {
            console.error(`\u274C Error creating listing "${aptName}":`, err.message)
            errors++
            checkDone()
            return
          }
          cb(this.lastID)
        })
      }

      ensureListing((listingId) => {
        // Find or create user
        db.get(`SELECT id FROM users WHERE name = ?`, [userName], (err, userRow) => {
          if (err) {
            console.error(`\u274C Error looking up user "${userName}":`, err.message)
            errors++
            checkDone()
            return
          }

          const proceedWithUser = (userId) => {
            // Insert review
            db.run(`INSERT INTO reviews (listing_id, user_id, text) VALUES (?, ?, ?)`, [listingId, userId, text], function(err) {
              if (err) {
                console.error(`\u274C Error inserting review for listing ${listingId}:`, err.message)
                errors++
                checkDone()
                return
              }

              const reviewId = this.lastID

              // Insert rating if available
              if (rating !== null && !Number.isNaN(rating)) {
                db.run(`INSERT INTO ratings (review_id, rating) VALUES (?, ?)`, [reviewId, rating], (err) => {
                  if (err) {
                    console.error(`\u274C Error inserting rating for review ${reviewId}:`, err.message)
                    errors++
                  } else {
                    imported++
                  }
                  checkDone()
                })
              } else {
                imported++
                checkDone()
              }
            })
          }

          if (userRow && userRow.id) proceedWithUser(userRow.id)
          else {
            db.run(`INSERT INTO users (name) VALUES (?)`, [userName], function(err) {
              if (err) {
                console.error(`\u274C Error creating user "${userName}":`, err.message)
                errors++
                checkDone()
                return
              }
              proceedWithUser(this.lastID)
            })
          }
        })
      })
    })
  })
})
