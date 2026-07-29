package api

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "net/http"
)

type EventBeer struct {
    ID           int      `json:"id"`
    BeerOptionID int      `json:"beer_option_id"`
    BeerName     string   `json:"beer_name"` // composed "Brewery – Name"
    ABVRangeID   int      `json:"abv_range_id"`
    TypeID       int      `json:"beer_type_id"`
    ABV          *float64 `json:"abv"` // the beer's real ABV (for display)
}

// deriveBeerFasit resolves a beer's fasit for an event: its type (from the beer
// catalog) and the abv_range it falls into (from the event's intervals, matched
// by the beer's numeric abv). Returns a user-facing message on failure.
func deriveBeerFasit(db *sql.DB, eventID interface{}, beerOptionID int) (typeID int, abvRangeID int, msg string) {
    var typeNull sql.NullInt64
    var abvNull sql.NullFloat64
    err := db.QueryRow(`SELECT beer_type_id, abv FROM beer_options WHERE id = ?`, beerOptionID).
        Scan(&typeNull, &abvNull)
    if err != nil {
        return 0, 0, "Fant ikke ølet i katalogen"
    }
    if !typeNull.Valid {
        return 0, 0, "Ølet mangler type – sett type på ølet i katalogen først"
    }
    if !abvNull.Valid {
        return 0, 0, "Ølet mangler ABV – sett ABV på ølet i katalogen først"
    }

    err = db.QueryRow(`
        SELECT ar.id
        FROM event_abv_ranges ear
        JOIN abv_ranges ar ON ar.id = ear.abv_range_id
        WHERE ear.event_id = ? AND ar.min_abv <= ? AND ? <= ar.max_abv
        ORDER BY ar.min_abv
        LIMIT 1
    `, eventID, abvNull.Float64, abvNull.Float64).Scan(&abvRangeID)
    if err == sql.ErrNoRows {
        return 0, 0, fmt.Sprintf("Ingen ABV-intervall i dette eventet dekker %.1f%% – legg til/juster intervall først", abvNull.Float64)
    }
    if err != nil {
        return 0, 0, "Feil ved oppslag av ABV-intervall"
    }
    return int(typeNull.Int64), abvRangeID, ""
}

func EventBeers(w http.ResponseWriter, r *http.Request) {
    eventID := r.URL.Query().Get("event_id")
    if eventID == "" {
        http.Error(w, "Missing event_id", 400)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), 500)
        return
    }

    switch r.Method {

    // -----------------------
    // GET /api/events/:id/beers
    // -----------------------
    case "GET":
        rows, err := db.Query(`
            SELECT b.id, b.beer_option_id, `+beerNameSQL+`, b.abv_range_id, b.beer_type_id, bo.abv
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

        list := []EventBeer{}
        for rows.Next() {
            var eb EventBeer
            if err := rows.Scan(&eb.ID, &eb.BeerOptionID, &eb.BeerName, &eb.ABVRangeID, &eb.TypeID, &eb.ABV); err != nil {
                http.Error(w, err.Error(), 500)
                return
            }
            list = append(list, eb)
        }
        json.NewEncoder(w).Encode(list)

    // -----------------------
    // POST /api/events/:id/beers  — add a beer; type + abv_range are auto-derived
    // -----------------------
    case "POST":
        if !RequireHost(w, r, eventID) {
            return
        }
        var body struct {
            BeerOptionID int `json:"beer_option_id"`
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON: "+err.Error(), 400)
            return
        }
        if body.BeerOptionID == 0 {
            http.Error(w, "Missing beer_option_id", 400)
            return
        }

        typeID, abvRangeID, msg := deriveBeerFasit(db, eventID, body.BeerOptionID)
        if msg != "" {
            http.Error(w, msg, 400)
            return
        }

        if _, err := db.Exec(`
            INSERT INTO beers (event_id, beer_option_id, abv_range_id, beer_type_id)
            VALUES (?, ?, ?, ?)
        `, eventID, body.BeerOptionID, abvRangeID, typeID); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        json.NewEncoder(w).Encode(map[string]string{"status": "added"})

    // -----------------------
    // PUT /api/events/:id/beers  — change which beer; type + abv_range re-derived
    // -----------------------
    case "PUT":
        if !RequireHost(w, r, eventID) {
            return
        }
        var body struct {
            BeerID       int `json:"beer_id"`
            BeerOptionID int `json:"beer_option_id"`
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON: "+err.Error(), 400)
            return
        }
        if body.BeerID == 0 || body.BeerOptionID == 0 {
            http.Error(w, "Missing beer_id or beer_option_id", 400)
            return
        }

        typeID, abvRangeID, msg := deriveBeerFasit(db, eventID, body.BeerOptionID)
        if msg != "" {
            http.Error(w, msg, 400)
            return
        }

        if _, err := db.Exec(`
            UPDATE beers SET beer_option_id = ?, abv_range_id = ?, beer_type_id = ?
            WHERE id = ?
        `, body.BeerOptionID, abvRangeID, typeID, body.BeerID); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        json.NewEncoder(w).Encode(map[string]string{"status": "updated"})

    default:
        http.Error(w, "Method not allowed", 405)
    }
}
