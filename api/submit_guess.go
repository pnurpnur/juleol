package api

import (
    "encoding/json"
    "log"
    "net/http"
)

func SubmitGuess(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", http.StatusMethodNotAllowed)
        return
    }

    userID, err := AuthUserID(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    var g Guess
    if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    g.UserID = userID

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", http.StatusInternalServerError)
        return
    }

    // 1. Sjekk at event er åpent
    var isOpen bool
    err = db.QueryRow(`SELECT is_open FROM events WHERE id = ?`, g.EventID).
        Scan(&isOpen)
    if err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return
    }
    if !isOpen {
        http.Error(w, "Event closed", http.StatusForbidden)
        return
    }

    // 2. Sjekk at beer tilhører event
    var evID int
    err = db.QueryRow(`SELECT event_id FROM beers WHERE id = ?`, g.BeerID).Scan(&evID)
    if err != nil {
        http.Error(w, "Beer not found", http.StatusNotFound)
        return
    }
    if evID != g.EventID {
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
        http.Error(w, "SQL error", http.StatusInternalServerError)
        return
    }

    w.Write([]byte(`{"status":"ok"}`))
}
