package api

import (
    "encoding/json"
    "net/http"
)

func CreateEvent(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", 405)
        return
    }

    // Only the super-admin may create events.
    if !RequireAdmin(w, r) {
        return
    }

    var req CreateEventRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }

    if req.Name == "" {
        http.Error(w, "Missing name", 400)
        return
    }
    if req.OwnerID == 0 {
        http.Error(w, "Missing owner_id (arrangør)", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    res, err := db.Exec(`
        INSERT INTO events (name, owner_id, is_open)
        VALUES (?, ?, TRUE)
    `, req.Name, req.OwnerID)

    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    id, _ := res.LastInsertId()

    // Attach the default ABV intervals so every event starts with the standard set.
    if _, err := db.Exec(`
        INSERT INTO event_abv_ranges (event_id, abv_range_id)
        SELECT ?, id FROM abv_ranges WHERE is_default = TRUE
    `, id); err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "created",
        "id":     id,
    })
}
