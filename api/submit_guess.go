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

    var g Guess
    if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    log.Printf("Decoded guess: %+v\n", g)

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    // 1. Sjekk om eventet finnes og om det er åpent
    var isOpen bool
    err = db.QueryRow(
        `SELECT is_open FROM events WHERE id = ?`,
        g.EventID,
    ).Scan(&isOpen)

    if err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return
    }

    if !isOpen {
        http.Error(w, "Event is closed", http.StatusForbidden)
        return
    }

    // 2. Sjekk at beer tilhører det eventet
    var beerEventID int
    err = db.QueryRow(
        `SELECT event_id FROM beers WHERE id = ?`,
        g.BeerID,
    ).Scan(&beerEventID)

    if err != nil {
        http.Error(w, "Beer not found", http.StatusNotFound)
        return
    }

    if beerEventID != g.EventID {
        http.Error(w, "Beer does not belong to this event", http.StatusBadRequest)
        return
    }

    // 3. Insert guess
	_, err = db.Exec(`
		INSERT INTO guesses (
			event_id, user_id, beer_id,
			guessed_beer_option_id,
			guessed_abv_range_id,
			guessed_type_id,
			rating
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`,
		g.EventID,
		g.UserID,
		g.BeerID,
		g.GuessedBeerOptionID,
		g.GuessedABVRangeID,
		g.GuessedTypeID,
		g.Rating,
	)

    if err != nil {
        log.Println("SQL ERROR:", err.Error())
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}
