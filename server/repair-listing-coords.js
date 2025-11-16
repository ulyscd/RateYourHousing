import fs from 'fs'
import path from 'path'
import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const listingsPath = path.join(__dirname, 'listings.json')
if (!fs.existsSync(listingsPath)) {
  console.error('listings.json not found in server/ directory')
  process.exit(1)
}

const raw = fs.readFileSync(listingsPath, 'utf8')
let data
try { data = JSON.parse(raw) } catch (e) { console.error('Invalid JSON in listings.json'); process.exit(1) }

const listings = Array.isArray(data) ? data : (data.listings || data.data || [])
const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

console.log(`Processing ${listings.length} listings from listings.json`)

let updated = 0
let inserted = 0
let skipped = 0

db.serialize(() => {
  const selectStmt = db.prepare(`SELECT id, latitude, longitude FROM listings WHERE name = ? LIMIT 1`)
  const updateStmt = db.prepare(`UPDATE listings SET latitude = ?, longitude = ?, address = COALESCE(address, ?) WHERE id = ?`)
  const insertStmt = db.prepare(`INSERT INTO listings (name, address, latitude, longitude, price, bedrooms, bathrooms, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  listings.forEach((l) => {
    const name = l.name || l.title || l.title || l.Name || null
    const address = l.address || l.Address || null
    const lat = parseFloat(l.latitude || l.lat || l.lat || l.Lat || l.Latitude || null)
    const lng = parseFloat(l.longitude || l.lng || l.lng || l.Lng || l.Longitude || null)

    if (!name) { skipped++; return }

    selectStmt.get(name, (err, row) => {
      if (err) { console.error('Select error for', name, err.message); return }

      if (row) {
        // If missing coords, update
        if ((row.latitude == null || row.longitude == null) && !isNaN(lat) && !isNaN(lng)) {
          updateStmt.run(lat, lng, address, row.id, (err) => {
            if (err) console.error('Update error for', name, err.message)
            else { updated++ }
          })
        }
      } else {
        // Insert new listing row
        insertStmt.run(name, address, isNaN(lat) ? null : lat, isNaN(lng) ? null : lng, null, null, null, null, null, (err) => {
          if (err) console.error('Insert error for', name, err.message)
          else inserted++
        })
      }
    })
  })

  // finalize and report after a delay to allow async ops to finish
  setTimeout(() => {
    selectStmt.finalize()
    updateStmt.finalize()
    insertStmt.finalize()
    db.close()
    console.log(`Done. updated=${updated}, inserted=${inserted}, skipped=${skipped}`)
  }, 1000)
})
