import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

const serverDir = path.dirname(new URL(import.meta.url).pathname)
const dbPath = path.join(serverDir, 'database.sqlite')

// Find latest backup file matching database.sqlite.bak-*
const files = fs.readdirSync(serverDir)
const bakFiles = files.filter(f => f.startsWith('database.sqlite.bak-')).sort()
if (bakFiles.length === 0) {
  console.error('No backup files found in server directory. Aborting.')
  process.exit(1)
}
const latestBak = path.join(serverDir, bakFiles[bakFiles.length - 1])
console.log('Using backup:', latestBak)

const curDb = new sqlite3.Database(dbPath)
const bakDb = new sqlite3.Database(latestBak)

// Read listings from current DB that are missing coords
curDb.all(`SELECT id, name FROM listings WHERE latitude IS NULL OR longitude IS NULL`, [], (err, rows) => {
  if (err) {
    console.error('Error querying current DB:', err.message)
    process.exit(1)
  }
  if (rows.length === 0) {
    console.log('No listings missing coordinates.')
    curDb.close()
    bakDb.close()
    return
  }

  console.log(`Found ${rows.length} listings with missing coordinates. Attempting to fill from backup...`)
  let updated = 0
  let checked = 0

  rows.forEach(({ id, name }) => {
    // Look up by name in backup DB (first match)
    bakDb.get(`SELECT latitude, longitude FROM listings WHERE name = ? AND latitude IS NOT NULL AND longitude IS NOT NULL LIMIT 1`, [name], (err, bakRow) => {
      checked++
      if (err) {
        console.error('Error querying backup DB for', name, err.message)
      } else if (bakRow && bakRow.latitude != null && bakRow.longitude != null) {
        curDb.run(`UPDATE listings SET latitude = ?, longitude = ? WHERE id = ?`, [bakRow.latitude, bakRow.longitude, id], (err) => {
          if (err) console.error('Error updating listing', id, err.message)
          else {
            updated++
            console.log(`Updated listing ${id} (${name}) with coords: ${bakRow.latitude}, ${bakRow.longitude}`)
          }
          if (checked === rows.length) {
            console.log(`Done. Updated ${updated} listing(s).`)
            curDb.close()
            bakDb.close()
          }
        })
        return
      }

      if (checked === rows.length) {
        console.log(`Done. Updated ${updated} listing(s).`)
        curDb.close()
        bakDb.close()
      }
    })
  })
})
