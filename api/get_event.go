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
		ownerName string
		isOpen    bool
		createdAt string
	)

	err = db.QueryRow(`
        SELECT e.id, e.name, e.owner_id, e.is_open, e.created_at, u.name as owner_name
        FROM events e
        JOIN users u ON e.owner_id = u.id
        WHERE e.id = ?
    `, eventID).Scan(&id, &name, &ownerID, &isOpen, &createdAt, &ownerName)

	if err != nil {
		http.Error(w, "Event not found", 404)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         id,
		"name":       name,
		"owner_id":   ownerID,
		"owner_name": ownerName,
		"is_open":    isOpen,
		"created_at": createdAt,
	})
}
