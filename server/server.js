import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

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

  // Traits table
  db.run(`
    CREATE TABLE IF NOT EXISTS review_traits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      trait TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    )
  `)

  // Review votes/helpful table
  db.run(`
    CREATE TABLE IF NOT EXISTS review_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      user_identifier TEXT NOT NULL,
      vote_type TEXT NOT NULL CHECK(vote_type IN ('helpful', 'not_helpful')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(review_id, user_identifier),
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
    )
  `)

  // Management responses table
  db.run(`
    CREATE TABLE IF NOT EXISTS management_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL UNIQUE,
      listing_id INTEGER NOT NULL,
      manager_name TEXT NOT NULL,
      response_text TEXT NOT NULL,
      is_verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    )
  `)

  // Add new columns to reviews table if they don't exist
  db.run(`ALTER TABLE reviews ADD COLUMN bedrooms INTEGER`, () => {})
  db.run(`ALTER TABLE reviews ADD COLUMN bathrooms REAL`, () => {})
  db.run(`ALTER TABLE reviews ADD COLUMN rent_price REAL`, () => {})
  db.run(`ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0`, () => {})
  db.run(`ALTER TABLE reviews ADD COLUMN not_helpful_count INTEGER DEFAULT 0`, () => {})
  
  // Add AI summary column to listings table
  db.run(`ALTER TABLE listings ADD COLUMN ai_summary TEXT`, () => {})
  db.run(`ALTER TABLE listings ADD COLUMN ai_summary_generated_at DATETIME`, () => {})
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
    `SELECT 
      l.*,
      AVG(rat.rating) as average_rating,
      COUNT(DISTINCT r.id) as review_count,
      MIN(r.rent_price) as min_price,
      MAX(r.rent_price) as max_price,
      GROUP_CONCAT(DISTINCT r.bedrooms) as bedrooms_list,
      GROUP_CONCAT(DISTINCT r.bathrooms) as bathrooms_list
     FROM listings l
     LEFT JOIN reviews r ON l.id = r.listing_id
     LEFT JOIN ratings rat ON r.id = rat.review_id
     GROUP BY l.id
     ORDER BY l.name`,
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
    `SELECT 
      l.*,
      AVG(rat.rating) as average_rating,
      COUNT(DISTINCT r.id) as review_count
     FROM listings l
     LEFT JOIN reviews r ON l.id = r.listing_id
     LEFT JOIN ratings rat ON r.id = rat.review_id
     WHERE l.id = ?
     GROUP BY l.id`,
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
  const userIdentifier = req.query.user_identifier || null
  
  db.all(
    `SELECT r.*, u.name as user_name, rt.rating, 
            (SELECT GROUP_CONCAT(url) FROM images WHERE review_id = r.id) as image_urls,
            (SELECT GROUP_CONCAT(trait) FROM review_traits WHERE review_id = r.id) as traits,
            mr.manager_name, mr.response_text as management_response, mr.is_verified as management_verified, mr.created_at as management_response_date
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN ratings rt ON rt.review_id = r.id
     LEFT JOIN management_responses mr ON mr.review_id = r.id
     WHERE r.listing_id = ?
     ORDER BY r.helpful_count DESC, r.created_at DESC`,
    [listingId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      
      // Process rows to include images and traits as arrays
      const reviews = rows.map(row => {
        const review = {
          id: row.id,
          listing_id: row.listing_id,
          user_id: row.user_id,
          user_name: row.user_name,
          text: row.text,
          rating: row.rating,
          bedrooms: row.bedrooms,
          bathrooms: row.bathrooms,
          rent_price: row.rent_price,
          helpful_count: row.helpful_count || 0,
          not_helpful_count: row.not_helpful_count || 0,
          created_at: row.created_at,
          images: [],
          traits: [],
          user_vote: null,
          management_response: row.management_response ? {
            manager_name: row.manager_name,
            text: row.management_response,
            is_verified: row.management_verified === 1,
            created_at: row.management_response_date
          } : null
        }
        
        if (row.image_urls) {
          review.images = row.image_urls.split(',').map(url => ({
            url: '/uploads/' + url
          }))
        }
        
        if (row.traits) {
          review.traits = row.traits.split(',')
        }
        
        return review
      })
      
      // If user_identifier provided, fetch their votes
      if (userIdentifier) {
        const reviewIds = reviews.map(r => r.id)
        if (reviewIds.length > 0) {
          db.all(
            `SELECT review_id, vote_type FROM review_votes 
             WHERE user_identifier = ? AND review_id IN (${reviewIds.map(() => '?').join(',')})`,
            [userIdentifier, ...reviewIds],
            (err, votes) => {
              if (!err && votes) {
                votes.forEach(vote => {
                  const review = reviews.find(r => r.id === vote.review_id)
                  if (review) {
                    review.user_vote = vote.vote_type
                  }
                })
              }
              res.json(reviews)
            }
          )
        } else {
          res.json(reviews)
        }
      } else {
        res.json(reviews)
      }
    }
  )
})

// Submit a review
app.post('/api/reviews', upload.array('images', 10), (req, res) => {
  const { listing_id, user_name, rating, text, traits, bedrooms, bathrooms, rent_price } = req.body
  const files = req.files || []
  
  // Parse traits if it's a JSON string
  let traitsList = []
  if (traits) {
    try {
      traitsList = typeof traits === 'string' ? JSON.parse(traits) : traits
    } catch (e) {
      console.error('Error parsing traits:', e)
    }
  }

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
          // Create review with optional fields
          const bedroomsValue = bedrooms ? parseInt(bedrooms) : null
          const bathroomsValue = bathrooms ? parseFloat(bathrooms) : null
          const rentPriceValue = rent_price ? parseFloat(rent_price) : null
          
          db.run(
            `INSERT INTO reviews (listing_id, user_id, text, bedrooms, bathrooms, rent_price) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [listing_id, userId, text, bedroomsValue, bathroomsValue, rentPriceValue],
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

                  // Save traits
                  const saveTraits = (callback) => {
                    if (traitsList && traitsList.length > 0) {
                      let traitsProcessed = 0
                      let hasError = false
                      traitsList.forEach((trait) => {
                        db.run(
                          `INSERT INTO review_traits (review_id, trait) VALUES (?, ?)`,
                          [reviewId, trait],
                          (err) => {
                            if (err) {
                              console.error('Error saving trait:', err)
                              if (!hasError) {
                                hasError = true
                                callback(err)
                              }
                              return
                            }
                            traitsProcessed++
                            if (traitsProcessed === traitsList.length && !hasError) {
                              callback(null)
                            }
                          }
                        )
                      })
                    } else {
                      callback(null)
                    }
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
                            saveTraits((err) => {
                              if (err) {
                                db.run('ROLLBACK', () => {
                                  return res.status(500).json({ error: 'Error saving traits' })
                                })
                                return
                              }
                              db.run('COMMIT', (err) => {
                                if (err) {
                                  return res.status(500).json({ error: err.message })
                                }
                                updateListingAverageRating(listing_id)
                                res.json({ success: true, reviewId })
                              })
                            })
                          }
                        }
                      )
                    })
                  } else {
                    saveTraits((err) => {
                      if (err) {
                        db.run('ROLLBACK', () => {
                          return res.status(500).json({ error: 'Error saving traits' })
                        })
                        return
                      }
                      db.run('COMMIT', (err) => {
                        if (err) {
                          return res.status(500).json({ error: err.message })
                        }
                        updateListingAverageRating(listing_id)
                        res.json({ success: true, reviewId })
                      })
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

// Delete a review
app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params

  // First, get the listing_id and image files before deleting
  db.get(
    `SELECT r.listing_id, GROUP_CONCAT(i.url) as image_urls
     FROM reviews r
     LEFT JOIN images i ON i.review_id = r.id
     WHERE r.id = ?
     GROUP BY r.id`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      if (!row) {
        return res.status(404).json({ error: 'Review not found' })
      }

      const listingId = row.listing_id
      const imageUrls = row.image_urls ? row.image_urls.split(',') : []

      // Delete the review (cascade will delete ratings and images from DB)
      db.run(
        `DELETE FROM reviews WHERE id = ?`,
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          // Delete image files from disk
          imageUrls.forEach(filename => {
            const filePath = path.join(uploadsDir, filename)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          })

          // Update the listing's average rating
          updateListingAverageRating(listingId)

          res.json({ success: true, message: 'Review deleted successfully' })
        }
      )
    }
  )
})

// Vote on review (helpful/not helpful)
app.post('/api/reviews/:id/vote', (req, res) => {
  const { id } = req.params
  const { vote_type, user_identifier } = req.body

  if (!vote_type || !user_identifier) {
    return res.status(400).json({ error: 'vote_type and user_identifier are required' })
  }

  if (vote_type !== 'helpful' && vote_type !== 'not_helpful') {
    return res.status(400).json({ error: 'vote_type must be either "helpful" or "not_helpful"' })
  }

  // Check if user has already voted
  db.get(
    `SELECT * FROM review_votes WHERE review_id = ? AND user_identifier = ?`,
    [id, user_identifier],
    (err, existingVote) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (existingVote) {
        // Update existing vote
        db.run(
          `UPDATE review_votes SET vote_type = ? WHERE review_id = ? AND user_identifier = ?`,
          [vote_type, id, user_identifier],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message })
            }
            updateReviewVoteCounts(id, res)
          }
        )
      } else {
        // Insert new vote
        db.run(
          `INSERT INTO review_votes (review_id, user_identifier, vote_type) VALUES (?, ?, ?)`,
          [id, user_identifier, vote_type],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message })
            }
            updateReviewVoteCounts(id, res)
          }
        )
      }
    }
  )
})

// Remove vote from review
app.delete('/api/reviews/:id/vote', (req, res) => {
  const { id } = req.params
  const { user_identifier } = req.body

  if (!user_identifier) {
    return res.status(400).json({ error: 'user_identifier is required' })
  }

  db.run(
    `DELETE FROM review_votes WHERE review_id = ? AND user_identifier = ?`,
    [id, user_identifier],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      updateReviewVoteCounts(id, res)
    }
  )
})

// Helper function to update review vote counts
const updateReviewVoteCounts = (reviewId, res) => {
  db.get(
    `SELECT 
      SUM(CASE WHEN vote_type = 'helpful' THEN 1 ELSE 0 END) as helpful_count,
      SUM(CASE WHEN vote_type = 'not_helpful' THEN 1 ELSE 0 END) as not_helpful_count
     FROM review_votes 
     WHERE review_id = ?`,
    [reviewId],
    (err, counts) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      db.run(
        `UPDATE reviews SET helpful_count = ?, not_helpful_count = ? WHERE id = ?`,
        [counts.helpful_count || 0, counts.not_helpful_count || 0, reviewId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message })
          }

          res.json({
            success: true,
            helpful_count: counts.helpful_count || 0,
            not_helpful_count: counts.not_helpful_count || 0
          })
        }
      )
    }
  )
}

// Submit management response to review
app.post('/api/reviews/:id/management-response', (req, res) => {
  const { id } = req.params
  const { manager_name, response_text, listing_id } = req.body

  if (!manager_name || !response_text || !listing_id) {
    return res.status(400).json({ error: 'manager_name, response_text, and listing_id are required' })
  }

  // Check if response already exists
  db.get(
    `SELECT * FROM management_responses WHERE review_id = ?`,
    [id],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }

      if (existing) {
        // Update existing response
        db.run(
          `UPDATE management_responses SET manager_name = ?, response_text = ? WHERE review_id = ?`,
          [manager_name, response_text, id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message })
            }
            res.json({ success: true, message: 'Management response updated' })
          }
        )
      } else {
        // Insert new response
        db.run(
          `INSERT INTO management_responses (review_id, listing_id, manager_name, response_text) 
           VALUES (?, ?, ?, ?)`,
          [id, listing_id, manager_name, response_text],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message })
            }
            res.json({ success: true, message: 'Management response added' })
          }
        )
      }
    }
  )
})

// Generate AI summary for a listing
app.post('/api/listings/:id/generate-summary', async (req, res) => {
  const { id } = req.params
  
  try {
    // Fetch all reviews for this listing
    const reviews = await new Promise((resolve, reject) => {
      db.all(
        `SELECT r.text, r.bedrooms, r.bathrooms, r.rent_price, rt.rating,
                (SELECT GROUP_CONCAT(trait) FROM review_traits WHERE review_id = r.id) as traits
         FROM reviews r
         JOIN ratings rt ON rt.review_id = r.id
         WHERE r.listing_id = ?`,
        [id],
        (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        }
      )
    })

    // Get listing info
    const listing = await new Promise((resolve, reject) => {
      db.get(`SELECT name, description FROM listings WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })

    // If there are no reviews, fall back to using the listing description
    let reviewTexts
    if (reviews.length === 0) {
      console.log(`No reviews found for listing ${id} — falling back to listing description`)
      // Use listing description text as the single-review input if available
      if (!listing || !listing.name) {
        return res.status(400).json({ error: 'No listing information available to generate summary' })
      }
      // Build a minimal 'review' using the listing description
      const descText = listing.description || `Listing ${listing.name} has no description or reviews.`
      // Create a single pseudo-review so the AI still has context
      reviewTexts = `Listing description: ${descText}`
      // Skip the later reviewTexts building below by using this variable
    }

    // Prepare review data for AI. If we already constructed reviewTexts from listing description
    // (above fallback for no reviews), reuse it.
    if (typeof reviewTexts === 'undefined') {
      reviewTexts = reviews.map((r, i) => {
        let review = `Review ${i + 1} (${r.rating}/5 stars): ${r.text}`
        if (r.bedrooms) review += ` | ${r.bedrooms} bed`
        if (r.bathrooms) review += `, ${r.bathrooms} bath`
        if (r.rent_price) review += `, $${r.rent_price}/mo`
        if (r.traits) review += ` | Traits: ${r.traits}`
        return review
      }).join('\n\n')
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5001',
        'X-Title': 'Rate Your Housing'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes apartment reviews. Be concise, balanced, and focus on the most important points. Format your response as JSON with these fields: "summary" (2-3 sentences), "pros" (array of 3-5 strings), "cons" (array of 3-5 strings), "keywords" (array of 3 descriptive words).'
          },
          {
            role: 'user',
            content: `Summarize these reviews for ${listing.name}:\n\n${reviewTexts}\n\nProvide a balanced summary highlighting key pros and cons.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      return res.status(500).json({ error: 'Failed to generate summary' })
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

    // Try to parse as JSON, fall back to extracting JSON substring, then to a structured text fallback.
    let summary
    try {
      summary = JSON.parse(aiResponse)
      // If the model returned a raw string rather than an object, wrap it
      if (typeof summary === 'string') {
        summary = { summary: summary, pros: [], cons: [], keywords: [] }
      }
    } catch (e) {
      console.warn('AI summary response was not valid top-level JSON. Attempting to extract JSON block...')
      console.warn('RAW_AI_SUMMARY_RESPONSE:', aiResponse)

      // Attempt to find a JSON object inside the response text
      const jsonBlockMatch = aiResponse.match(/(\{[\s\S]*\})/)
      if (jsonBlockMatch) {
        try {
          summary = JSON.parse(jsonBlockMatch[1])
        } catch (e2) {
          console.warn('Failed to parse extracted JSON block from AI response:', e2.message)
        }
      }

      // If still not parsed, build a safe fallback object
      if (!summary) {
        // Try to heuristically extract simple lists for pros/cons/keywords
        const pros = []
        const cons = []
        const keywords = []

        // Look for sections like "Pros:" or "Pros\n- ..."
        const sectionMatch = (name) => {
          const re = new RegExp(name + "\\s*[:\\n]([\\s\\S]*?)(?:\\n\\n|$)", 'i')
          const m = aiResponse.match(re)
          if (!m) return []
          return m[1].split(/\n|\r|\-|\u2022/).map(s => s.trim()).filter(Boolean)
        }

        const prosCandidates = sectionMatch('Pros')
        const consCandidates = sectionMatch('Cons')
        const keywordsCandidates = sectionMatch('Keywords')

        if (prosCandidates.length) pros.push(...prosCandidates)
        if (consCandidates.length) cons.push(...consCandidates)
        if (keywordsCandidates.length) keywords.push(...keywordsCandidates.map(k => k.replace(/[,\.]$/,'')))

        // Final fallback: store the raw text in summary.summary
        summary = {
          summary: aiResponse.trim(),
          pros: pros,
          cons: cons,
          keywords: keywords
        }
      }
    }

    // Save to database
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE listings SET ai_summary = ?, ai_summary_generated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [JSON.stringify(summary), id],
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })

    res.json({ success: true, summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get AI summary for a listing
app.get('/api/listings/:id/summary', (req, res) => {
  const { id } = req.params
  
  db.get(
    `SELECT ai_summary, ai_summary_generated_at FROM listings WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message })
      }
      
      if (!row || !row.ai_summary) {
        return res.status(404).json({ error: 'No summary available' })
      }
      
      try {
        const summary = JSON.parse(row.ai_summary)
        res.json({
          summary,
          generated_at: row.ai_summary_generated_at
        })
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse summary' })
      }
    }
  )
})

// Smart Match - AI-powered housing search
app.post('/api/smart-match', async (req, res) => {
  const { userInput, conversationHistory } = req.body

  try {
    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are a housing search assistant for University of Oregon students in Eugene. Your job is to extract ONLY the specific housing criteria mentioned by the user.

IMPORTANT RULES:
1. ONLY extract criteria that the user EXPLICITLY mentions
2. DO NOT add traits the user didn't ask for
3. DO NOT make assumptions
4. Use EXACT trait names from the allowed list below
5. Be conservative - it's better to ask for clarification than to add wrong filters

EXACT TRAIT NAMES (use these EXACTLY as written):
- Air Conditioning
- Balcony
- Close to Campus
- Dishwasher
- Elevator
- Energy Efficient
- Fitness Center
- Furnished
- Good Storage
- Hardwood Floors
- Laundry
- Modern
- Parking
- Pet Friendly
- Pool
- Professional Staff
- Public Transit
- Quick Maintenance
- Quiet
- Responsive Management
- Safe Area
- Spacious
- Updated
- Utilities Included
- Walkable
- Washer/Dryer

NEGATIVE TRAITS TO AVOID (never include these):
- Poor Maintenance
- Poor Management
- Slow Maintenance
- Noisy
- Small Units
- Outdated
- High Utilities

EXTRACTION RULES:
- Bedrooms: Extract only if user mentions "1 bed", "2 bedroom", "studio", etc.
- Bathrooms: Extract only if user mentions "1 bath", "2 bathroom", etc.
- Price: Extract only if user mentions budget, price range, "under $X", "$X-$Y", etc.
- Rating: Only set minRating if user says "good reviews", "highly rated", "4+ stars", etc.
- Traits: ONLY include traits user explicitly mentions

EXAMPLES OF CORRECT EXTRACTION:

User: "I need a 2 bedroom under $1500 with parking"
{
  "hasMatch": true,
  "filters": {
    "minBedrooms": "2",
    "maxBedrooms": "2",
    "maxPrice": "1500",
    "traits": ["Parking"]
  },
  "sortBy": "rating-high",
  "message": "Found apartments with 2 bedrooms under $1500 with parking!"
}

User: "quiet place close to campus with laundry"
{
  "hasMatch": true,
  "filters": {
    "traits": ["Quiet", "Close to Campus", "Laundry"]
  },
  "sortBy": "rating-high",
  "message": "Showing quiet places near campus with laundry!"
}

User: "studio under $1000"
{
  "hasMatch": true,
  "filters": {
    "minBedrooms": "Studio",
    "maxBedrooms": "Studio",
    "maxPrice": "1000"
  },
  "sortBy": "price-low",
  "message": "Here are studios under $1000!"
}

User: "I'm looking for an apartment"
{
  "hasMatch": false,
  "message": "I can help you find the perfect apartment! What's important to you? For example: number of bedrooms, budget, location, or amenities like parking or laundry?"
}

RESPONSE FORMAT:
If you can extract ANY criteria, respond with JSON:
{
  "hasMatch": true,
  "filters": { ... only criteria mentioned ... },
  "sortBy": "rating-high",
  "message": "brief confirmation"
}

If you need more info:
{
  "hasMatch": false,
  "message": "friendly question asking for specifics"
}

REMEMBER: ONLY extract what the user explicitly mentions. Quality over quantity!`
      }
    ]

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        })
      })
    } else {
      messages.push({
        role: 'user',
        content: userInput
      })
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5001',
        'X-Title': 'Rate Your Housing - Smart Match'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages,
        temperature: 0.3,
        max_tokens: 400
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      return res.status(500).json({ 
        message: "I'm having trouble processing that. Could you try rephrasing?"
      })
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    // Try to parse as JSON
    let result
    try {
      result = JSON.parse(aiResponse)
    } catch (e) {
      console.warn('Smart Match AI did not return valid JSON:', aiResponse)

      // Fallback: return the original message to the frontend, prompting for clarification
      result = {
        hasMatch: false,
        message: aiResponse || "Could you tell me more about what you're looking for? For example: number of bedrooms, budget, or specific amenities?"
      }
    }

    // Return the result
    if (result.hasMatch && result.filters) {
      res.json({
        filters: result.filters,
        sortBy: result.sortBy || 'rating-high',
        message: result.message
      })
    } else {
      res.json({
        message: result.message || "Tell me more about what you're looking for!"
      })
    }

  } catch (error) {
    console.error('Smart match error:', error)
    res.status(500).json({ 
      message: "Sorry, I encountered an error. Please try again."
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

