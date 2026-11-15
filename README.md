# AutoFix Garage

**Subject:** Backend Development Fundamentals (BDF) | **Group ID:** ST-CSEQE2B-G09
**University:** Aurora Higher Education and Research Academy

## 1. Introduction
AutoFix Garage is a backend (server-side) application that manages **mechanics**, **service bays** and **vehicle assignments** for a garage.

## 2. Problem Statement
Service bays are given out verbally. Jobs overlap, and customers wait without knowing which bay is free. This project replaces verbal assignment with a system that records every assignment.

## 3. Objectives
- Store mechanics, bays and assignments in a database.
- Provide REST APIs to get, add, update and delete data.
- Show assignments together with the mechanic name and bay name (JOIN).
- Check user input and return clear error messages.
- Enforce the **Three at a time** rule.

## 4. Technologies Used
Node.js, Express.js, SQLite (better-sqlite3), Postman.

## 5. Features
- CRUD for mechanics, bays and assignments
- Search bays by vehicle (`?vehicle=`)
- JOIN endpoint
- Validation with clear messages
- Max 3 active assignments per mechanic

## 6. Folder Structure
```
autofix-garage/
├── server.js
├── package.json
├── README.md
└── postman/
    ├── AutoFix_Garage.postman_collection.json
    └── AutoFix_Local.postman_environment.json
```
> Update this section to match your group's real folder structure.

## 7. Database Overview
| Table | Columns |
|---|---|
| mechanics | id, name, speciality |
| bays | id, name, vehicle |
| assignments | id, mechanic_id (links to mechanics), bay_id (links to bays), vehicle, status (`active` or `returned`) |

## 8. API Endpoints
| Method | URL | Purpose | Success code |
|---|---|---|---|
| GET | /api/mechanics | Get all mechanics | 200 |
| GET | /api/mechanics/:id | Get one mechanic | 200 |
| POST | /api/mechanics | Add a mechanic | 201 |
| PUT | /api/mechanics/:id | Update a mechanic | 200 |
| DELETE | /api/mechanics/:id | Delete a mechanic | 200 |
| GET | /api/bays | Get all bays (search: `?vehicle=Car`) | 200 |
| GET | /api/bays/:id | Get one bay | 200 |
| POST | /api/bays | Add a bay | 201 |
| PUT | /api/bays/:id | Update a bay | 200 |
| DELETE | /api/bays/:id | Delete a bay | 200 |
| GET | /api/assignments | Get all assignments | 200 |
| GET | /api/assignments/details | JOIN: assignments with mechanic and bay names | 200 |
| GET | /api/assignments/:id | Get one assignment | 200 |
| POST | /api/assignments | Create an assignment | 201 |
| PUT | /api/assignments/:id | Update, or return (`status: "returned"`) | 200 |
| DELETE | /api/assignments/:id | Delete an assignment | 200 |

## 9. Sample Requests and Responses
**POST /api/bays**
```json
{ "name": "Bay 1", "vehicle": "Car" }
```
Response `201`:
```json
{ "id": 1, "name": "Bay 1", "vehicle": "Car" }
```
**POST /api/bays** with missing vehicle → `400`:
```json
{ "error": "vehicle is required" }
```
**GET /api/assignments/details** → `200`:
```json
[{ "id": 1, "vehicle": "V1", "status": "active", "mechanic_name": "Asha", "bay_name": "Bay 1" }]
```

## 10. HTTP Status Codes
| Code | Meaning | Example |
|---|---|---|
| 200 | Success | Get all bays |
| 201 | Created | Add a bay |
| 400 | Invalid input | Bay without a vehicle |
| 404 | Not found | `/api/bays/99999` |
| 409 | Conflict | 4th assignment for one mechanic |
| 500 | Server error | Unexpected failure inside the server |

## 11. Special Rule: Three at a Time
A mechanic can have at most **3 active assignments**.
1. Create 3 assignments for Asha → `201, 201, 201`.
2. Create a 4th → `409` with `{"error": "Limit of 3 reached"}`.
3. Return one (`PUT` with `{"status":"returned"}`), then create another → `201`.

Only assignments with status `active` are counted, so returning one frees a place.

## 12. Installation
1. Install Node.js (https://nodejs.org).
2. Open a terminal in the project folder.
3. Run `npm install`.

## 13. How to Run
```
npm start
```
The server runs at `http://localhost:3000`. The database file is created automatically.

## 14. Postman Testing
1. Open Postman, click **Import**, and select both files in the `postman/` folder.
2. Choose the **AutoFix Local** environment (top right). It sets `baseUrl` to `http://localhost:3000`.
3. Start the server (`npm start`).
4. Right-click the collection, choose **Run collection**, then **Run**.
5. The folders are Mechanics, Bays, Assignments, JOIN, Twist and Error handling. Each request has automated tests.

## 15. Expected Results
All requests in the Collection Runner should show green passed tests. The Twist folder must show 201, 201, 201, then 409, then 201.

## 16. Conclusion
AutoFix Garage replaces verbal bay assignment with a tested REST API that prevents overlapping work and overloading a mechanic.

## Team
| Member | Responsibility |
|---|---|
| (name) | Server and routes |
| (name) | Database |
| (name) | REST endpoints |
| (name) | Validation and search |
| (name) | Twist rule |
| (name) | Postman and README |
