import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'database.sqlite')
const backupPath = path.join(__dirname, `database.sqlite.bak-${Date.now()}`)

// Backup DB
try {
  fs.copyFileSync(dbPath, backupPath)
  console.log(`Backup created at: ${backupPath}`)
} catch (err) {
  console.error('Could not create backup of the database. Aborting.', err.message)
  process.exit(1)
}

const db = new sqlite3.Database(dbPath)

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err)
      resolve(this)
    })
  })
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

async function dedupe() {
  try {
    // Find listing names that appear more than once
    const duplicates = await allAsync(
      `SELECT name, COUNT(*) as cnt FROM listings GROUP BY name HAVING cnt > 1`
    )

    if (duplicates.length === 0) {
      console.log('No duplicate listing names found. Nothing to do.')
      db.close()
      return
    }

    console.log(`Found ${duplicates.length} listing name(s) with duplicates.`)

    for (const d of duplicates) {
      const name = d.name
      console.log('\nProcessing:', name)

      // Get all listing rows for this name
      const rows = await allAsync(`SELECT id, name, address, image_url FROM listings WHERE name = ? ORDER BY id`, [name])
      if (rows.length < 2) continue

      // Choose canonical: pick the row with the lowest id (you can change logic)
      const canonical = rows[0]
      const duplicatesIds = rows.slice(1).map(r => r.id)

      console.log(`  Canonical id: ${canonical.id}; Duplicates: ${duplicatesIds.join(', ')}`)

      // Reassign reviews that point to duplicate listing ids to canonical id
      const placeholders = duplicatesIds.map(() => '?').join(',')
      const updateSql = `UPDATE reviews SET listing_id = ? WHERE listing_id IN (${placeholders})`
      await runAsync(updateSql, [canonical.id, ...duplicatesIds])
      console.log(`  Reassigned reviews from ${duplicatesIds.length} listing(s) to ${canonical.id}`)

      // Optional: delete duplicate listing rows now that reviews are moved
      const deleteSql = `DELETE FROM listings WHERE id IN (${placeholders})`
      await runAsync(deleteSql, duplicatesIds)
      console.log(`  Deleted ${duplicatesIds.length} duplicate listing row(s)`)      
    }

    console.log('\nDedupe complete. Please verify the application behavior and run tests if any.')
  } catch (err) {
    console.error('Error during dedupe:', err.message)
  } finally {
    db.close()
  }
}

dedupe()
