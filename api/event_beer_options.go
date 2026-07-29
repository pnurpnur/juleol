package api

import (
    "encoding/json"
    "net/http"
)

func EventBeerOptions(w http.ResponseWriter, r *http.Request) {
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

    // POST: attach an existing catalog beer to this event's pool.
    if r.Method == "POST" {
        if !RequireHost(w, r, eventID) {
            return
        }
        var body struct {
            BeerOptionID int `json:"beer_option_id"`
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.BeerOptionID == 0 {
            http.Error(w, "Missing beer_option_id", 400)
            return
        }
        if _, err := db.Exec(
            `INSERT IGNORE INTO event_beer_options (event_id, beer_option_id) VALUES (?, ?)`,
            eventID, body.BeerOptionID,
        ); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        json.NewEncoder(w).Encode(map[string]string{"status": "attached"})
        return
    }

    rows, err := db.Query(`
        SELECT bo.id, `+beerNameSQL+`
        FROM event_beer_options ebo
        JOIN beer_options bo ON ebo.beer_option_id = bo.id
        WHERE ebo.event_id = ?
        ORDER BY bo.brewery, bo.name
    `, eventID)

    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    type Option struct {
        ID   int    `json:"id"`
        Name string `json:"name"`
    }

    out := []Option{}
    for rows.Next() {
        var o Option
        rows.Scan(&o.ID, &o.Name)
        out = append(out, o)
    }

    json.NewEncoder(w).Encode(out)
}
