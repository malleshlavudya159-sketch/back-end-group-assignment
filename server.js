// REFERENCE backend for AutoFix Garage (compare with your team's code)
const express = require('express');
const Database = require('better-sqlite3');
const app = express();
app.use(express.json());
const db = new Database(process.env.DB_FILE || 'autofix.db');

db.exec(`
CREATE TABLE IF NOT EXISTS mechanics (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, speciality TEXT);
CREATE TABLE IF NOT EXISTS bays (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, vehicle TEXT);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mechanic_id INTEGER NOT NULL REFERENCES mechanics(id),
  bay_id INTEGER NOT NULL REFERENCES bays(id),
  vehicle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);`);

const MAX_ACTIVE = 3;
const bad = (res, msg) => res.status(400).json({ error: msg });
const notFound = (res, what) => res.status(404).json({ error: `${what} not found` });
const isText = v => typeof v === 'string' && v.trim() !== '';

// ---------- Mechanics ----------
app.get('/api/mechanics', (req, res) => res.status(200).json(db.prepare('SELECT * FROM mechanics').all()));
app.get('/api/mechanics/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM mechanics WHERE id=?').get(req.params.id);
  row ? res.status(200).json(row) : notFound(res, 'Mechanic');
});
app.post('/api/mechanics', (req, res) => {
  const { name, speciality = null } = req.body;
  if (!isText(name)) return bad(res, 'name is required');
  const r = db.prepare('INSERT INTO mechanics (name, speciality) VALUES (?,?)').run(name.trim(), speciality);
  res.status(201).json(db.prepare('SELECT * FROM mechanics WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/mechanics/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM mechanics WHERE id=?').get(req.params.id);
  if (!row) return notFound(res, 'Mechanic');
  const name = req.body.name ?? row.name, speciality = req.body.speciality ?? row.speciality;
  if (!isText(name)) return bad(res, 'name must be a non-empty text');
  db.prepare('UPDATE mechanics SET name=?, speciality=? WHERE id=?').run(name, speciality, row.id);
  res.status(200).json(db.prepare('SELECT * FROM mechanics WHERE id=?').get(row.id));
});
app.delete('/api/mechanics/:id', (req, res) => {
  const r = db.prepare('DELETE FROM mechanics WHERE id=?').run(req.params.id);
  r.changes ? res.status(200).json({ message: 'Mechanic deleted' }) : notFound(res, 'Mechanic');
});

// ---------- Bays (search: /api/bays?vehicle=car) ----------
app.get('/api/bays', (req, res) => {
  const { vehicle } = req.query;
  const rows = vehicle
    ? db.prepare('SELECT * FROM bays WHERE vehicle LIKE ?').all(`%${vehicle}%`)
    : db.prepare('SELECT * FROM bays').all();
  res.status(200).json(rows);
});
app.get('/api/bays/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bays WHERE id=?').get(req.params.id);
  row ? res.status(200).json(row) : notFound(res, 'Bay');
});
app.post('/api/bays', (req, res) => {
  const { name, vehicle } = req.body;
  if (!isText(name)) return bad(res, 'name is required');
  if (!isText(vehicle)) return bad(res, 'vehicle is required');
  const r = db.prepare('INSERT INTO bays (name, vehicle) VALUES (?,?)').run(name.trim(), vehicle.trim());
  res.status(201).json(db.prepare('SELECT * FROM bays WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/bays/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bays WHERE id=?').get(req.params.id);
  if (!row) return notFound(res, 'Bay');
  const name = req.body.name ?? row.name, vehicle = req.body.vehicle ?? row.vehicle;
  if (!isText(name) || !isText(vehicle)) return bad(res, 'name and vehicle must be non-empty text');
  db.prepare('UPDATE bays SET name=?, vehicle=? WHERE id=?').run(name, vehicle, row.id);
  res.status(200).json(db.prepare('SELECT * FROM bays WHERE id=?').get(row.id));
});
app.delete('/api/bays/:id', (req, res) => {
  const r = db.prepare('DELETE FROM bays WHERE id=?').run(req.params.id);
  r.changes ? res.status(200).json({ message: 'Bay deleted' }) : notFound(res, 'Bay');
});

// ---------- Assignments ----------
const activeCount = id => db.prepare("SELECT COUNT(*) c FROM assignments WHERE mechanic_id=? AND status='active'").get(id).c;

// JOIN endpoint (must be before /:id)
app.get('/api/assignments/details', (req, res) => {
  res.status(200).json(db.prepare(`
    SELECT a.id, a.vehicle, a.status, m.name AS mechanic_name, b.name AS bay_name
    FROM assignments a JOIN mechanics m ON m.id=a.mechanic_id JOIN bays b ON b.id=a.bay_id`).all());
});
app.get('/api/assignments', (req, res) => res.status(200).json(db.prepare('SELECT * FROM assignments').all()));
app.get('/api/assignments/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM assignments WHERE id=?').get(req.params.id);
  row ? res.status(200).json(row) : notFound(res, 'Assignment');
});
app.post('/api/assignments', (req, res) => {
  const { mechanic_id, bay_id, vehicle } = req.body;
  if (!Number.isInteger(mechanic_id) || !Number.isInteger(bay_id)) return bad(res, 'mechanic_id and bay_id must be numbers');
  if (!isText(vehicle)) return bad(res, 'vehicle is required');
  if (!db.prepare('SELECT 1 FROM mechanics WHERE id=?').get(mechanic_id)) return notFound(res, 'Mechanic');
  if (!db.prepare('SELECT 1 FROM bays WHERE id=?').get(bay_id)) return notFound(res, 'Bay');
  if (activeCount(mechanic_id) >= MAX_ACTIVE) return res.status(409).json({ error: 'Limit of 3 reached' });
  const r = db.prepare('INSERT INTO assignments (mechanic_id, bay_id, vehicle) VALUES (?,?,?)').run(mechanic_id, bay_id, vehicle.trim());
  res.status(201).json(db.prepare('SELECT * FROM assignments WHERE id=?').get(r.lastInsertRowid));
});
app.put('/api/assignments/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM assignments WHERE id=?').get(req.params.id);
  if (!row) return notFound(res, 'Assignment');
  const vehicle = req.body.vehicle ?? row.vehicle, status = req.body.status ?? row.status;
  if (!isText(vehicle)) return bad(res, 'vehicle must be non-empty text');
  if (!['active', 'returned'].includes(status)) return bad(res, "status must be 'active' or 'returned'");
  if (status === 'active' && row.status === 'returned' && activeCount(row.mechanic_id) >= MAX_ACTIVE)
    return res.status(409).json({ error: 'Limit of 3 reached' });
  db.prepare('UPDATE assignments SET vehicle=?, status=? WHERE id=?').run(vehicle, status, row.id);
  res.status(200).json(db.prepare('SELECT * FROM assignments WHERE id=?').get(row.id));
});
app.delete('/api/assignments/:id', (req, res) => {
  const r = db.prepare('DELETE FROM assignments WHERE id=?').run(req.params.id);
  r.changes ? res.status(200).json({ message: 'Assignment deleted' }) : notFound(res, 'Assignment');
});

// Bad JSON -> 400, anything else -> 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return bad(res, 'Invalid JSON body');
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`AutoFix Garage running on http://localhost:${PORT}`));
module.exports = app;
