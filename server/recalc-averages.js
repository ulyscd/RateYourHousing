import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')
const db = new sqlite3.Database(dbPath)

console.log('Recalculating listing average ratings...')

db.serialize(() => {
  db.all(`SELECT id FROM listings`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching listings:', err.message)
      db.close()
      process.exit(1)
    }

    let processed = 0
    rows.forEach((row) => {
      const listingId = row.id
      db.get(
        `SELECT AVG(rt.rating) as avg_rating 
         FROM ratings rt 
         JOIN reviews r ON rt.review_id = r.id 
         WHERE r.listing_id = ?`,
        [listingId],
        (err, res) => {
          if (err) {
            console.error(`Error computing avg for listing ${listingId}:`, err.message)
          } else {
            const avg = res && res.avg_rating ? res.avg_rating : 0
            db.run(`UPDATE listings SET average_rating = ? WHERE id = ?`, [avg, listingId], (err) => {
              if (err) console.error(`Error updating listing ${listingId}:`, err.message)
            })
          }

          processed++
          if (processed === rows.length) {
            console.log('Recalculation complete.')
            db.close()
          }
        }
      )
    })
  })
})
