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

    if req.EventID == 0 {
        http.Error(w, "Missing event_id", 400)
        return
    }

    // Only the admin or the event's host may close it.
    if !RequireHost(w, r, req.EventID) {
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, err.Error(), 500)
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
