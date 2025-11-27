package api

import (
    "encoding/json"
    "net/http"
)

func GetRating(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    beerID := r.URL.Query().Get("beer_id")

    userID, err := AuthUserID(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    db, _ := DB()

    row := db.QueryRow(`
        SELECT event_id, user_id, beer_id,
               rating, untappd_score, created_at
        FROM ratings
        WHERE event_id = ? AND beer_id = ? AND user_id = ?
    `, eventID, beerID, userID)

    var rOut Rating
    var up *float64

    err = row.Scan(
        &rOut.EventID,
        &rOut.UserID,
        &rOut.BeerID,
        &rOut.Rating,
        &up,
        &rOut.CreatedAt,
    )
    if err != nil {
        http.Error(w, "Rating not found", http.StatusNotFound)
        return
    }

    rOut.UntappdScore = up

    json.NewEncoder(w).Encode(rOut)
}
