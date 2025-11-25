package api

import (
    "encoding/json"
    "net/http"
)

func CloseEvent(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", 405)
        return
    }

    var req CloseEventRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    // Sjekk om bruker er owner
    var owner string
    err = db.QueryRow(
        `SELECT owner_id FROM events WHERE id = ?`,
        req.EventID,
    ).Scan(&owner)
    if err != nil {
        http.Error(w, "Event not found", 404)
        return
    }

    if owner != req.UserID {
        http.Error(w, "Not authorized", 403)
        return
    }

    _, err = db.Exec(`UPDATE events SET is_open = FALSE WHERE id = ?`, req.EventID)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{
        "status": "closed",
    })
}
