package api

import (
    "encoding/json"
    "net/http"
)

// Breweries — global, editable list (like beer_types), shown in the "create
// beer" dropdown.
// GET  /breweries   list
// POST /breweries   create {name}                 (admin)
// PUT  /breweries   rename {id, name} + cascade    (admin)
func Breweries(w http.ResponseWriter, r *http.Request) {
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    switch r.Method {
    case "GET":
        rows, err := db.Query(`SELECT id, name FROM breweries ORDER BY name`)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        defer rows.Close()
        type Brewery struct {
            ID   int    `json:"id"`
            Name string `json:"name"`
        }
        out := []Brewery{}
        for rows.Next() {
            var b Brewery
            rows.Scan(&b.ID, &b.Name)
            out = append(out, b)
        }
        json.NewEncoder(w).Encode(out)

    case "POST":
        var body struct {
            Name    string `json:"name"`
            EventID *int   `json:"event_id"` // host context; else admin
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
            http.Error(w, "Missing name", 400)
            return
        }
        if body.EventID != nil {
            if !RequireHost(w, r, *body.EventID) {
                return
            }
        } else if !RequireAdmin(w, r) {
            return
        }
        res, err := db.Exec(`INSERT INTO breweries (name) VALUES (?)`, body.Name)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        id, _ := res.LastInsertId()
        json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "name": body.Name})

    case "PUT":
        var body struct {
            ID      int    `json:"id"`
            Name    string `json:"name"`
            EventID *int   `json:"event_id"` // host context; else admin
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ID == 0 || body.Name == "" {
            http.Error(w, "Missing id or name", 400)
            return
        }
        if body.EventID != nil {
            if !RequireHost(w, r, *body.EventID) {
                return
            }
        } else if !RequireAdmin(w, r) {
            return
        }
        if _, err := db.Exec(`UPDATE breweries SET name = ? WHERE id = ?`, body.Name, body.ID); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        // keep the denormalized copy on beer_options in sync
        if _, err := db.Exec(`UPDATE beer_options SET brewery = ? WHERE brewery_id = ?`, body.Name, body.ID); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        json.NewEncoder(w).Encode(map[string]interface{}{"id": body.ID, "name": body.Name})

    default:
        http.Error(w, "Method not allowed", 405)
    }
}
