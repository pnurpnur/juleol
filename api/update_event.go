package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type UpdateEventRequest struct {
    EventID int     `json:"event_id"`
    Name    *string `json:"name"`
    IsOpen  *bool   `json:"is_open"`
}

func UpdateEvent(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", 405)
        return
    }

    var req UpdateEventRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }

    if req.EventID == 0 {
        http.Error(w, "Missing event_id", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    // Build query dynamically
    q := "UPDATE events SET "
    args := []interface{}{}

    first := true

    if req.Name != nil {
        if !first { q += ", " }
        q += "name = ?"
        args = append(args, *req.Name)
        first = false
    }

    if req.IsOpen != nil {
        if !first { q += ", " }
        q += "is_open = ?"
        args = append(args, *req.IsOpen)
        first = false
    }

    q += " WHERE id = ?"
    args = append(args, req.EventID)

    log.Println("UpdateEvent SQL:", q, args)

    _, err = db.Exec(q, args...)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok",
    })
}
