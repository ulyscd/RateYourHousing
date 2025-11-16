import sqlite3 from 'sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')

if (!fs.existsSync(dbPath)) {
  console.error('Database not found at', dbPath)
  process.exit(1)
}

sqlite3.verbose()
const db = new sqlite3.Database(dbPath)

const sampleUsers = [
  'Alex', 'Sam', 'Taylor', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Jamie', 'Cameron', 'Avery'
]

const sampleReviews = [
  'Great location and friendly staff. Would recommend to students.',
  'Decent place for the price. Maintenance is responsive.',
  'Not the best experience — had some noise issues but overall okay.',
  'Clean units and convenient laundry facilities. Parking was tight.',
  'Updated appliances and good natural light. Quiet neighborhood.',
  'A bit pricey but well worth it for the location and amenities.',
  'Had some issues with heating, but management fixed it quickly.',
  'Great community atmosphere and secure building access.',
  'Close to campus and public transit which made commuting easy.',
  'Friendly neighbors but occasional loud parties on weekends.'
]

const sampleTraits = [
  'Pet Friendly', 'Parking', 'Laundry', 'Gym', 'Pool', 'Dishwasher', 'AC', 'Furnished', 'Utilities Included', 'Quiet'
]

function runAsync(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

function getAsync(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

function allAsync(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

async function ensureUser(name) {
  // Try to find existing user
  const row = await getAsync('SELECT id FROM users WHERE name = ?', [name])
  if (row) return row.id
  const res = await runAsync('INSERT INTO users (name) VALUES (?)', [name])
  return res.lastID
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function addFakeReview(listing, userId, text, rating, bedrooms=null, bathrooms=null, rent_price=null) {
  // Insert review
  const insertReview = await runAsync(
    `INSERT INTO reviews (listing_id, user_id, text, bedrooms, bathrooms, rent_price) VALUES (?, ?, ?, ?, ?, ?)`,
    [listing.id, userId, text, bedrooms, bathrooms, rent_price]
  )
  const reviewId = insertReview.lastID

  // Insert rating
  await runAsync(`INSERT INTO ratings (review_id, rating) VALUES (?, ?)`, [reviewId, rating])

  // Optionally add a trait
  if (Math.random() < 0.4) {
    const trait = sampleTraits[randInt(0, sampleTraits.length - 1)]
    await runAsync(`INSERT INTO review_traits (review_id, trait) VALUES (?, ?)`, [reviewId, trait])
  }
}

async function updateListingAverage(listingId) {
  await runAsync(
    `UPDATE listings SET average_rating = (
       SELECT AVG(r.rating) FROM ratings r JOIN reviews rev ON r.review_id = rev.id WHERE rev.listing_id = ?
     ) WHERE id = ?`,
    [listingId, listingId]
  )
}

async function main() {
  try {
    const listings = await allAsync('SELECT id, name, bedrooms, bathrooms, price FROM listings')
    console.log(`Found ${listings.length} listings. Ensuring at least 3 reviews each...`)

    let totalAdded = 0

    for (const listing of listings) {
      const cntRow = await getAsync('SELECT COUNT(*) as cnt FROM reviews WHERE listing_id = ?', [listing.id])
      const current = cntRow?.cnt || 0
      const need = Math.max(0, 3 - current)
      if (need === 0) continue

      console.log(`Listing ${listing.id} (${listing.name}) has ${current} reviews — adding ${need}`)

      for (let i = 0; i < need; i++) {
        const userName = sampleUsers[(listing.id + i) % sampleUsers.length] + ' ' + randInt(1,999)
        const userId = await ensureUser(userName)
        const text = sampleReviews[(listing.id + i) % sampleReviews.length]
        const rating = randInt(2,5)
        // Use listing bedrooms/bathrooms if present, otherwise random
        const bedrooms = listing.bedrooms ? parseInt(listing.bedrooms) : (Math.random() < 0.5 ? randInt(1,3) : null)
        const bathrooms = listing.bathrooms ? parseFloat(listing.bathrooms) : (Math.random() < 0.5 ? (randInt(1,2)) : null)
        // rent_price derived from price if numeric found, else random
        let rent_price = null
        if (listing.price) {
          const m = String(listing.price).match(/(\d{2,5})/)
          if (m) rent_price = parseFloat(m[1])
        }
        if (!rent_price && Math.random() < 0.4) rent_price = randInt(600, 2500)

        await addFakeReview(listing, userId, text, rating, bedrooms, bathrooms, rent_price)
        totalAdded++
      }

      await updateListingAverage(listing.id)
    }

    console.log(`Done — added ${totalAdded} reviews.`)
    process.exit(0)
  } catch (err) {
    console.error('Error generating fake reviews:', err)
    process.exit(1)
  }
}

main()
