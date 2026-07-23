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
    OwnerID *int    `json:"owner_id"`
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

    // Only the admin or the event's host may edit it.
    if !RequireHost(w, r, req.EventID) {
        return
    }
    // Reassigning the arrangør is an admin-only action.
    if req.OwnerID != nil && !GetCaller(r).IsAdmin() {
        http.Error(w, "Only admin can change arrangør", http.StatusForbidden)
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

    if req.OwnerID != nil {
        if !first { q += ", " }
        q += "owner_id = ?"
        args = append(args, *req.OwnerID)
        first = false
    }

    if first {
        http.Error(w, "Nothing to update", 400)
        return
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
