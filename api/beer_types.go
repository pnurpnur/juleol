package api

import (
    "encoding/json"
    "net/http"
)

func BeerTypes(w http.ResponseWriter, r *http.Request) {
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    rows, err := db.Query(`SELECT id, name FROM beer_types ORDER BY id`)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    type T struct {
        ID   int    `json:"id"`
        Name string `json:"name"`
    }

    list := []T{}
    for rows.Next() {
        var t T
        rows.Scan(&t.ID, &t.Name)
        list = append(list, t)
    }

    json.NewEncoder(w).Encode(list)
}
