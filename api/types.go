package api

import (
    "encoding/json"
    "net/http"
)

func BeerTypes(w http.ResponseWriter, r *http.Request) {
    db, err := DB()
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    rows, err := db.Query(`SELECT id, label FROM beer_types ORDER BY id ASC`)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    var result []map[string]interface{}

    for rows.Next() {
        var id int
        var label string

        if err := rows.Scan(&id, &label); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }

        result = append(result, map[string]interface{}{
            "id":    id,
            "name":  label,   // frontend expects this
        })
    }

    json.NewEncoder(w).Encode(result)
}
