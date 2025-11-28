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

    var g struct {
        EventID             int     `json:"event_id"`
        UserID              int  	`json:"user_id"`
        BeerID              int     `json:"beer_id"`
        GuessedBeerOptionID *int    `json:"guessed_beer_option_id"`
        GuessedABVRangeID   *int    `json:"guessed_abv_range_id"`
        GuessedTypeID       *int    `json:"guessed_type_id"`
    }

    if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    _, err = db.Exec(`
        INSERT INTO guesses (event_id, user_id, beer_id, guessed_beer_option_id, guessed_abv_range_id, guessed_type_id)
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
        log.Println("SubmitGuess SQL error:", err)
        http.Error(w, err.Error(), 500)
        return
    }

    w.Write([]byte(`{"status":"ok"}`))
}
