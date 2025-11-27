package api

import (
    "encoding/json"
    "net/http"
)

func GetRating(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    beerID := r.URL.Query().Get("beer_id")
    userID := r.URL.Query().Get("user_id")

    if eventID == "" || beerID == "" || userID == "" {
        http.Error(w, "Missing parameters", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    var rating struct {
        EventID      int
        UserID       string
        BeerID       int
        Rating       int
        UntappdScore *float64
        CreatedAt    string
    }

    err = db.QueryRow(`
        SELECT event_id, user_id, beer_id, rating, untappd_score, created_at
        FROM ratings
        WHERE event_id = ? AND beer_id = ? AND user_id = ?
    `, eventID, beerID, userID).
        Scan(&rating.EventID, &rating.UserID, &rating.BeerID,
            &rating.Rating, &rating.UntappdScore, &rating.CreatedAt)

    if err != nil {
        w.Write([]byte("null"))
        return
    }

    out := map[string]any{
        "eventId":      rating.EventID,
        "userId":       rating.UserID,
        "beerId":       rating.BeerID,
        "rating":       rating.Rating,
        "untappdScore": rating.UntappdScore,
        "createdAt":    rating.CreatedAt,
    }

    json.NewEncoder(w).Encode(out)
}
