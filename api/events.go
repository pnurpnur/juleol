package api

import (
	"encoding/json"
	"log"
	"net/http"
)

func ListEvents(w http.ResponseWriter, r *http.Request) {
	db, err := DB()
	if err != nil {
		http.Error(w, "DB error", 500)
		return
	}

	rows, err := db.Query(`
        SELECT e.id, e.name, e.owner_id, e.is_open, e.created_at, u.name as owner_name
        FROM events e
        JOIN users u ON e.owner_id = u.id
        ORDER BY e.created_at DESC
    `)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	type Event struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		Owner     int    `json:"owner_id"`
		OwnerName string `json:"owner_name"`
		Open      bool   `json:"is_open"`
		Date      string `json:"created_at"`
	}

	var events []Event

	for rows.Next() {
		var ev Event
		if err := rows.Scan(&ev.ID, &ev.Name, &ev.Owner, &ev.Open, &ev.Date, &ev.OwnerName); err != nil {
			log.Println(err)
		}
		events = append(events, ev)
	}

	json.NewEncoder(w).Encode(events)
}
