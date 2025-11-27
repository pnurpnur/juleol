package api

import (
    "encoding/json"
    "net/http"
)

func GetRatings(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")

    db, _ := DB()

    rows, err := db.Query(`
        SELECT event_id, user_id, beer_id,
               rating, untappd_score, created_at
        FROM ratings
        WHERE event_id = ?
    `, eventID)

    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    ratings := []Rating{}

    for rows.Next() {
        var rr Rating
        var up *float64

        rows.Scan(
            &rr.EventID,
            &rr.UserID,
            &rr.BeerID,
            &rr.Rating,
            &up,
            &rr.CreatedAt,
        )

        rr.UntappdScore = up
        ratings = append(ratings, rr)
    }

    json.NewEncoder(w).Encode(ratings)
}
