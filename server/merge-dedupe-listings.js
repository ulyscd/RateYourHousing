import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

const dir = path.dirname(new URL(import.meta.url).pathname)
const dbPath = path.join(dir, 'database.sqlite')
const backupPath = path.join(dir, `database.sqlite.merge-backup-${Date.now()}`)

// Backup DB
fs.copyFileSync(dbPath, backupPath)
console.log('Backup created at', backupPath)

const db = new sqlite3.Database(dbPath)

function allAsync(sql, params=[]) {
  return new Promise((res, rej) => db.all(sql, params, (e, r) => e ? rej(e) : res(r)))
}

function runAsync(sql, params=[]) {
  return new Promise((res, rej) => db.run(sql, params, function(e) { if (e) rej(e); else res(this) }))
}

async function merge() {
  try {
    const duplicates = await allAsync(`SELECT name, COUNT(*) as cnt FROM listings GROUP BY name HAVING cnt > 1`)
    if (duplicates.length === 0) {
      console.log('No duplicates')
      db.close()
      return
    }

    for (const d of duplicates) {
      const name = d.name
      const rows = await allAsync(`SELECT * FROM listings WHERE name = ? ORDER BY id`, [name])
      if (rows.length < 2) continue

      // Score rows: prefer those with latitude+longitude and more non-null fields
      const scored = rows.map(r => {
        let score = 0
        if (r.latitude && r.longitude) score += 10
        for (const k of ['address','price','bedrooms','bathrooms','description','image_url']) if (r[k]) score += 1
        return { row: r, score }
      }).sort((a,b) => b.score - a.score)

      const canonical = scored[0].row
      const duplicatesIds = rows.filter(r => r.id !== canonical.id).map(r => r.id)

      // Merge fields from duplicates into canonical if missing
      for (const r of rows) {
        if (r.id === canonical.id) continue
        const updates = {}
        for (const f of ['address','latitude','longitude','price','bedrooms','bathrooms','description','image_url']) {
          if ((!canonical[f] || canonical[f] === '') && r[f]) updates[f] = r[f]
        }
        if (Object.keys(updates).length > 0) {
          const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ')
          await runAsync(`UPDATE listings SET ${sets} WHERE id = ?`, [...Object.values(updates), canonical.id])
        }
      }

      // Reassign reviews
      const placeholders = duplicatesIds.map(()=>'?').join(',')
      await runAsync(`UPDATE reviews SET listing_id = ? WHERE listing_id IN (${placeholders})`, [canonical.id, ...duplicatesIds])

      // Delete duplicate listing rows
      await runAsync(`DELETE FROM listings WHERE id IN (${placeholders})`, duplicatesIds)
      console.log(`Merged ${duplicatesIds.length} duplicates into listing ${canonical.id} (${name})`)
    }

    console.log('Merge dedupe complete')
  } catch (err) {
    console.error('Error during merge:', err.message)
  } finally {
    db.close()
  }
}

merge()
