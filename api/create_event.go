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
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "created",
        "id":     id,
    })
}
