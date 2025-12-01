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
        SELECT id, name, owner_id, is_open, created_at
        FROM events
        ORDER BY created_at DESC
    `)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    type Event struct {
        ID    int    `json:"id"`
        Name  string `json:"name"`
		Owner int	`json:"owner_id"`
		Open  bool   `json:"is_open"`
        Date  string `json:"created_at"`
    }

    var events []Event

    for rows.Next() {
        var ev Event
        if err := rows.Scan(&ev.ID, &ev.Name, &ev.Owner, &ev.Open, &ev.Date); err != nil {
            log.Println(err)
        }
        events = append(events, ev)
    }

    json.NewEncoder(w).Encode(events)
}
