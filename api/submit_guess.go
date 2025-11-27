package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type GuessInput struct {
    EventID             int     `json:"event_id"`
    UserID              string  `json:"user_id"`
    BeerID              int     `json:"beer_id"`
    GuessedBeerOptionID *int    `json:"guessed_beer_option_id"`
    GuessedABVRangeID   *int    `json:"guessed_abv_range_id"`
    GuessedTypeID       *int    `json:"guessed_type_id"`
}

func SubmitGuess(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", http.StatusMethodNotAllowed)
        return
    }

    var g GuessInput
    if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", http.StatusInternalServerError)
        return
    }

    // 1. Event må finnes og være åpent
    var isOpen bool
    err = db.QueryRow(`SELECT is_open FROM events WHERE id = ?`, g.EventID).Scan(&isOpen)
    if err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return
    }
    if !isOpen {
        http.Error(w, "Event is closed", http.StatusForbidden)
        return
    }

    // 2. Beer må tilhøre eventet
    var actualEventID int
    err = db.QueryRow(`SELECT event_id FROM beers WHERE id = ?`, g.BeerID).Scan(&actualEventID)
    if err != nil {
        http.Error(w, "Beer not found", http.StatusNotFound)
        return
    }
    if actualEventID != g.EventID {
        http.Error(w, "Beer does not belong to event", http.StatusBadRequest)
        return
    }

    // 3. Insert / update guess
    _, err = db.Exec(`
        INSERT INTO guesses (
            event_id, user_id, beer_id,
            guessed_beer_option_id,
            guessed_abv_range_id,
            guessed_type_id
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            guessed_beer_option_id = VALUES(guessed_beer_option_id),
            guessed_abv_range_id   = VALUES(guessed_abv_range_id),
            guessed_type_id        = VALUES(guessed_type_id)
    `,
        g.EventID,
        g.UserID,
        g.BeerID,
        g.GuessedBeerOptionID,
        g.GuessedABVRangeID,
        g.GuessedTypeID,
    )

    if err != nil {
        log.Println("SQL ERROR:", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Write([]byte(`{"status":"ok"}`))
}
