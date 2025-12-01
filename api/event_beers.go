package api

import (
    "encoding/json"
    "net/http"
	"log"
)

type EventBeer struct {
    ID           int    `json:"id"`
    BeerOptionID int    `json:"beer_option_id"`
    BeerName     string `json:"beer_name"`
    ABVRangeID   int   `json:"abv_range_id"`
    TypeID       int   `json:"beer_type_id"`
}

func EventBeers(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    if eventID == "" {
        http.Error(w, "Missing event_id", 400)
        return
    }

    switch r.Method {

    // -----------------------
    // GET /api/events/:id/beers
    // -----------------------
    case "GET":
        db, err := DB()
        if err != nil {
            http.Error(w, "DB error: "+err.Error(), 500)
            return
        }

        rows, err := db.Query(`
            SELECT b.id, b.beer_option_id, bo.name, b.abv_range_id, b.beer_type_id
            FROM beers b
            JOIN beer_options bo ON bo.id = b.beer_option_id
            WHERE b.event_id = ?
            ORDER BY b.id ASC
        `, eventID)

        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        defer rows.Close()

        var list []EventBeer

        for rows.Next() {
            var eb EventBeer
            err := rows.Scan(&eb.ID, &eb.BeerOptionID, &eb.BeerName, &eb.ABVRangeID, &eb.TypeID)
            if err != nil {
                http.Error(w, err.Error(), 500)
                return
            }
            list = append(list, eb)
        }

        json.NewEncoder(w).Encode(list)

    // -----------------------
    // POST /api/events/:id/beers
    // -----------------------
    case "POST":
        var body struct {
            BeerOptionID int  `json:"beer_option_id"`
            ABVRangeID   *int `json:"abv_range_id"`
            TypeID       *int `json:"beer_type_id"`
        }

        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON: "+err.Error(), 400)
            return
        }

        db, err := DB()
        if err != nil {
            http.Error(w, "DB error: "+err.Error(), 500)
            return
        }

        _, err = db.Exec(`
            INSERT INTO beers (event_id, beer_option_id, abv_range_id, beer_type_id)
            VALUES (?, ?, ?, ?)
        `,
            eventID,
            body.BeerOptionID,
            body.ABVRangeID,
            body.TypeID,
        )

        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }

        json.NewEncoder(w).Encode(map[string]string{
            "status": "added",
        })

	// -----------------------
    // PUT /api/events/:id/beers
    // -----------------------
    case "PUT":
        var body struct {
            BeerID 		 int  `json:"beer_id"`
			BeerOptionID int  `json:"beer_option_id"`
            ABVRangeID   int `json:"abv_range_id"`
            TypeID       int `json:"beer_type_id"`
        }

        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON: "+err.Error(), 400)
            return
        }

        db, err := DB()
        if err != nil {
            http.Error(w, "DB error: "+err.Error(), 500)
            return
        }

        _, err = db.Exec(`
            UPDATE beers SET beer_option_id = ?, abv_range_id = ?, beer_type_id = ?
            WHERE id = ?
        `,
            body.BeerOptionID,
            body.ABVRangeID,
            body.TypeID,
			body.BeerID,
        )

        if err != nil {
            log.Printf("Delete error: %s\n", err.Error())
			http.Error(w, err.Error(), 500)
            return
        }

        json.NewEncoder(w).Encode(map[string]string{
            "status": "added",
        })

    default:
        http.Error(w, "Method not allowed", 405)
    }
}
