import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // In production, set FRONTEND_URL to your frontend domain
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Initialize database
const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Listings table
  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      price TEXT,
      bedrooms TEXT,
      bathrooms TEXT,
      description TEXT,
      image_url TEXT,
      average_rating REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Reviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Ratings table
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL UNIQUE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    )
  `)

  // Images table
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    )
  `)
})

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

// Helper function to calculate average rating for a listing
const updateListingAverageRating = (listingId) => {
  db.get(
    `SELECT AVG(r.rating) as avg_rating 
     FROM ratings r 
     JOIN reviews rev ON r.review_id = rev.id 
     WHERE rev.listing_id = ?`,
    [listingId],
    (err, row) => {
      if (!err && row) {
        db.run(
          `UPDATE listings SET average_rating = ? WHERE id = ?`,
          [row.avg_rating || 0, listingId]
        )
      }
    }
  )
}

// API Routes

// Get all listings
app.get('/api/listings', (req, res) => {
  db.all(
    `SELECT * FROM listings ORDER BY name`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      res.json(rows)
    }
  )
})

// Get a single listing
app.get('/api/listings/:id', (req, res) => {
  const { id } = req.params
  db.get(
    `SELECT * FROM listings WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (!row) {
        return res.status(404).json({ error: 'Listing not found' })
      }
      res.json(row)
    }
  )
})

// Create a new listing
app.post('/api/listings', (req, res) => {
  const { name, address, latitude, longitude, price, bedrooms, bathrooms, description, image_url } = req.body

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required' })
  }

  db.run(
    `INSERT INTO listings (name, address, latitude, longitude, price, bedrooms, bathrooms, description, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, address, latitude, longitude, price, bedrooms, bathrooms, description, image_url],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      
      // Return the newly created listing
      db.get(
        `SELECT * FROM listings WHERE id = ?`,
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }
          res.status(201).json(row)
        }
      )
    }
  )
})

// Get reviews for a listing
app.get('/api/reviews/listing/:listingId', (req, res) => {
  const { listingId } = req.params
  db.all(
    `SELECT r.*, u.name as user_name, rt.rating, 
            (SELECT GROUP_CONCAT(url) FROM images WHERE review_id = r.id) as image_urls
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN ratings rt ON rt.review_id = r.id
     WHERE r.listing_id = ?
     ORDER BY r.created_at DESC`,
    [listingId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      
      // Process rows to include images as array
      const reviews = rows.map(row => {
        const review = {
          id: row.id,
          listing_id: row.listing_id,
          user_id: row.user_id,
          user_name: row.user_name,
          text: row.text,
          rating: row.rating,
          created_at: row.created_at,
          images: []
        }
        
        if (row.image_urls) {
          review.images = row.image_urls.split(',').map(url => ({
            url: '/uploads/' + url
          }))
        }
        
        return review
      })
      
      res.json(reviews)
    }
  )
})

// Submit a review
app.post('/api/reviews', upload.array('images', 10), (req, res) => {
  const { listing_id, user_name, rating, text } = req.body
  const files = req.files || []

  if (!listing_id || !user_name || !rating || !text) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION')

    // Create or get user
    db.get(
      `SELECT id FROM users WHERE name = ?`,
      [user_name],
      (err, userRow) => {
        if (err) {
          db.run('ROLLBACK')
          return res.status(500).json({ error: err.message })
        }

        let userId
        if (userRow) {
          userId = userRow.id
        } else {
          // Create new user
          db.run(
            `INSERT INTO users (name) VALUES (?)`,
            [user_name],
            function(err) {
              if (err) {
                db.run('ROLLBACK')
                return res.status(500).json({ error: err.message })
              }
              userId = this.lastID
              createReview()
            }
          )
          return
        }

        createReview()

        function createReview() {
          // Create review
          db.run(
            `INSERT INTO reviews (listing_id, user_id, text) VALUES (?, ?, ?)`,
            [listing_id, userId, text],
            function(err) {
              if (err) {
                db.run('ROLLBACK')
                return res.status(500).json({ error: err.message })
              }

              const reviewId = this.lastID

              // Create rating
              db.run(
                `INSERT INTO ratings (review_id, rating) VALUES (?, ?)`,
                [reviewId, rating],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK')
                    return res.status(500).json({ error: err.message })
                  }

                  // Save images
                  if (files.length > 0) {
                    let imagesProcessed = 0
                    let hasError = false
                    files.forEach((file) => {
                      db.run(
                        `INSERT INTO images (review_id, url) VALUES (?, ?)`,
                        [reviewId, file.filename],
                        (err) => {
                          if (err) {
                            console.error('Error saving image:', err)
                            if (!hasError) {
                              hasError = true
                              db.run('ROLLBACK', () => {
                                return res.status(500).json({ error: 'Error saving images' })
                              })
                            }
                            return
                          }
                          imagesProcessed++
                          if (imagesProcessed === files.length && !hasError) {
                            db.run('COMMIT', (err) => {
                              if (err) {
                                return res.status(500).json({ error: err.message })
                              }
                              updateListingAverageRating(listing_id)
                              res.json({ success: true, reviewId })
                            })
                          }
                        }
                      )
                    })
                  } else {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        return res.status(500).json({ error: err.message })
                      }
                      updateListingAverageRating(listing_id)
                      res.json({ success: true, reviewId })
                    })
                  }
                }
              )
            }
          )
        }
      }
    )
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

