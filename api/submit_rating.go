package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type RatingInput struct {
    EventID      int      `json:"event_id"`
    UserID       string   `json:"user_id"`
    BeerID       int      `json:"beer_id"`
    Rating       float64  `json:"rating"`
    UntappdScore *float64 `json:"untappd_score"`
}

func SubmitRating(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", http.StatusMethodNotAllowed)
        return
    }

    var input RatingInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    if input.Rating < 0 || input.Rating > 10 {
        http.Error(w, "Rating must be 0–10", http.StatusBadRequest)
        return
    }

    if input.UntappdScore != nil {
        us := *input.UntappdScore
        if us < 0 || us > 5 {
            http.Error(w, "Untappd score must be 0–5", http.StatusBadRequest)
            return
        }
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    _, err = db.Exec(`
        INSERT INTO ratings (
            event_id, user_id, beer_id,
            rating, untappd_score
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            untappd_score = VALUES(untappd_score)
    `,
        input.EventID,
        input.UserID,
        input.BeerID,
        input.Rating,
        input.UntappdScore,
    )
    if err != nil {
        log.Println("SQL ERROR:", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Write([]byte(`{"status":"ok"}`))
}
