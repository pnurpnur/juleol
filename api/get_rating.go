package api

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "strconv"
)

func GetRating(w http.ResponseWriter, r *http.Request) {
    eventIDStr := r.URL.Query().Get("event_id")
    beerIDStr := r.URL.Query().Get("beer_id")
    userID := r.URL.Query().Get("user_id")

    log.Println("🔵 [GetRating] Incoming request:",
        "event_id =", eventIDStr,
        "beer_id =", beerIDStr,
        "user_id =", userID,
    )

    if eventIDStr == "" || beerIDStr == "" || userID == "" {
        http.Error(w, "Missing parameters", 400)
        return
    }

    eventID, err := strconv.Atoi(eventIDStr)
    if err != nil {
        http.Error(w, "Invalid event_id", 400)
        return
    }

    beerID, err := strconv.Atoi(beerIDStr)
    if err != nil {
        http.Error(w, "Invalid beer_id", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    log.Printf("🔵 [GetRating] Executing SQL: SELECT event_id, user_id, beer_id, rating, untappd_score, created_at FROM ratings WHERE event_id=%d AND beer_id=%d AND user_id='%s'\n",
        eventID, beerID, userID,
    )

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

    if err == sql.ErrNoRows {
        log.Println("🟡 [GetRating] No rating found for:",
            "event_id =", eventID,
            "beer_id =", beerID,
            "user_id =", userID,
        )
        w.Write([]byte("null"))
        return
    }

    if err != nil {
        log.Println("🔴 [GetRating] SQL error:", err)
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    // Log what was returned from DB
    log.Printf("🟢 [GetRating] Rating found: event_id=%d, beer_id=%d, user_id=%s, rating=%d, untappd=%v, created_at=%s\n",
        rating.EventID,
        rating.BeerID,
        rating.UserID,
        rating.Rating,
        rating.UntappdScore,
        rating.CreatedAt,
    )

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
