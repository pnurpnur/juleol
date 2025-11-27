package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type RatingInput struct {
    EventID      int      `json:"event_id"`
    BeerID       int      `json:"beer_id"`
    Rating       float64  `json:"rating"`
    UntappdScore *float64 `json:"untappd_score"`
}

func SubmitRating(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", http.StatusMethodNotAllowed)
        return
    }

    userID, err := AuthUserID(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    var input RatingInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    if input.Rating < 0 || input.Rating > 5 {
        http.Error(w, "rating must be between 0 and 5", http.StatusBadRequest)
        return
    }

    if input.UntappdScore != nil {
        us := *input.UntappdScore
        if us < 0 || us > 5 {
            http.Error(w, "untappd_score must be 0–5", http.StatusBadRequest)
            return
        }
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    // 1. Event må eksistere og være åpent
    var isOpen bool
    err = db.QueryRow(`SELECT is_open FROM events WHERE id = ?`, input.EventID).
        Scan(&isOpen)
    if err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return
    }
    if !isOpen {
        http.Error(w, "Event is closed", http.StatusForbidden)
        return
    }

    // 2. Ølet må tilhøre dette eventet
    var actualEventID int
    err = db.QueryRow(`SELECT event_id FROM beers WHERE id = ?`, input.BeerID).
        Scan(&actualEventID)
    if err != nil {
        http.Error(w, "Beer not found", http.StatusNotFound)
        return
    }
    if actualEventID != input.EventID {
        http.Error(w, "Beer does not belong to event", http.StatusBadRequest)
        return
    }

    // 3. Insert eller update rating
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
        userID,
        input.BeerID,
        input.Rating,
        input.UntappdScore,
    )
    if err != nil {
        log.Println("SQL ERROR:", err.Error())
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}
