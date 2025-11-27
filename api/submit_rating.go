package api

import (
    "encoding/json"
    "log"
    "net/http"
)

func SubmitRating(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", http.StatusMethodNotAllowed)
        return
    }

    var payload struct {
        EventID      int      `json:"event_id"`
        UserID       string   `json:"user_id"`
        BeerID       int      `json:"beer_id"`
        Rating       int      `json:"rating"`
        UntappdScore *float64 `json:"untappd_score"`
    }

    if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    _, err = db.Exec(`
        INSERT INTO ratings (event_id, user_id, beer_id, rating, untappd_score)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            untappd_score = VALUES(untappd_score)
    `,
        payload.EventID,
        payload.UserID,
        payload.BeerID,
        payload.Rating,
        payload.UntappdScore,
    )

    if err != nil {
        log.Println("SubmitRating SQL error:", err)
        http.Error(w, err.Error(), 500)
        return
    }

    w.Write([]byte(`{"status":"ok"}`))
}
