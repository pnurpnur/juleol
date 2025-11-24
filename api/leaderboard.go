package api

import (
    "encoding/json"
    "net/http"
)

func Leaderboard(w http.ResponseWriter, r *http.Request) {
    db, _ := DB()

    rows, err := db.Query(`
        SELECT beer_id, AVG(rating) AS avg_rating
        FROM guesses
        GROUP BY beer_id
        ORDER BY avg_rating DESC
    `)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    type Item struct {
        BeerID int     `json:"beer_id"`
        Avg    float64 `json:"avg"`
    }

    var out []Item
    for rows.Next() {
        var i Item
        rows.Scan(&i.BeerID, &i.Avg)
        out = append(out, i)
    }

    json.NewEncoder(w).Encode(out)
}
