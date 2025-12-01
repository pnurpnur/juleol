package api

import (
    "encoding/json"
    "net/http"
)

func GetEvent(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    if eventID == "" {
        http.Error(w, "Missing event_id", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    var (
        id        int
        name      string
        ownerID   int
        isOpen    bool
        createdAt string
    )

    err = db.QueryRow(`
        SELECT id, name, owner_id, is_open, created_at
        FROM events
        WHERE id = ?
    `, eventID).Scan(&id, &name, &ownerID, &isOpen, &createdAt)

    if err != nil {
        http.Error(w, "Event not found", 404)
        return
    }

    json.NewEncoder(w).Encode(map[string]interface{}{
        "id":         id,
        "name":       name,
        "owner_id":   ownerID,
        "is_open":    isOpen,
        "created_at": createdAt,
    })
}
