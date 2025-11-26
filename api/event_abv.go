package api

import (
    "encoding/json"
    "net/http"
    "strconv"
)

func EventABVRanges(w http.ResponseWriter, r *http.Request) {
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

    rows, err := db.Query(`
        SELECT ar.id, ar.label
        FROM event_abv_ranges ear
        JOIN abv_ranges ar ON ear.abv_range_id = ar.id
        WHERE ear.event_id = ?
        ORDER BY ar.id
    `, eventID)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    type ABV struct {
        ID    int    `json:"id"`
        Label string `json:"label"`
    }

    var list []ABV

    for rows.Next() {
        var x ABV
        rows.Scan(&x.ID, &x.Label)
        list = append(list, x)
    }

    json.NewEncoder(w).Encode(list)
}
