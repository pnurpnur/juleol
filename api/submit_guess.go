package api

import (
    "encoding/json"
    "net/http"
)

type Guess struct {
    UserID          string `json:"user_id"`
    BeerID          int    `json:"beer_id"`
    GuessedBeer     string `json:"guessed_beer"`
    GuessedABV      string `json:"guessed_abv"`
    GuessedType     string `json:"guessed_type"`
    Rating          int    `json:"rating"`
}

func SubmitGuess(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", 405)
        return
    }

    var g Guess
    json.NewDecoder(r.Body).Decode(&g)

    db, _ := DB()
    _, err := db.Exec(`
        INSERT INTO guesses (user_id, beer_id, guessed_beer, guessed_abv_range, guessed_type, rating)
        VALUES (?, ?, ?, ?, ?, ?)
    `, g.UserID, g.BeerID, g.GuessedBeer, g.GuessedABV, g.GuessedType, g.Rating)

    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    w.WriteHeader(200)
    w.Write([]byte(`{"status":"ok"}`))
}
