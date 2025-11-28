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

    var req CreateEventRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    _, err = db.Exec(`
        INSERT INTO events (name, owner_id, is_open)
        VALUES (?, ?, TRUE)
    `, req.Name, req.UserID)

    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{
        "status": "created",
    })
}
