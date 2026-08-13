package api

import (
    "encoding/json"
    "net/http"
)

// beerNameSQL composes a beer's display name "Brewery – Name" (falling back to
// just the name). Requires the beer_options row aliased as `bo`.
const beerNameSQL = `CASE WHEN bo.brewery IS NOT NULL AND bo.brewery <> '' ` +
    `THEN CONCAT(bo.brewery, ' – ', bo.name) ELSE bo.name END`

// ---------------------------------------------------------------------------
// Users (for the admin to pick an arrangør)
// ---------------------------------------------------------------------------

func ListUsers(w http.ResponseWriter, r *http.Request) {
    if !RequireAdmin(w, r) {
        return
    }
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }
    rows, err := db.Query(`SELECT id, name, email FROM users ORDER BY name`)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    out := []User{}
    for rows.Next() {
        var u User
        rows.Scan(&u.ID, &u.Name, &u.Email)
        out = append(out, u)
    }
    json.NewEncoder(w).Encode(out)
}

// ---------------------------------------------------------------------------
// Beer options — global catalog of beers ("lage øl")
// GET  /beer_options            list all beers in the catalog
// POST /beer_options            create a beer, optionally attaching to an event
// ---------------------------------------------------------------------------

type beerOption struct {
    ID          int      `json:"id"`
    BreweryID   *int     `json:"brewery_id"`
    Brewery     *string  `json:"brewery"`
    Name        string   `json:"name"`
    DisplayName string   `json:"display_name"` // "Brewery – Name"
    BeerTypeID  *int     `json:"beer_type_id"`
    ABV         *float64 `json:"abv"`
    UntappdLink *string  `json:"untappd_link"`
}

func BeerOptions(w http.ResponseWriter, r *http.Request) {
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    switch r.Method {
    case "GET":
        rows, err := db.Query(`SELECT bo.id, bo.brewery_id, bo.brewery, bo.name, ` + beerNameSQL + `, bo.beer_type_id, bo.abv, bo.untappd_link
            FROM beer_options bo ORDER BY bo.brewery, bo.name`)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        defer rows.Close()
        out := []beerOption{}
        for rows.Next() {
            var o beerOption
            rows.Scan(&o.ID, &o.BreweryID, &o.Brewery, &o.Name, &o.DisplayName, &o.BeerTypeID, &o.ABV, &o.UntappdLink)
            out = append(out, o)
        }
        json.NewEncoder(w).Encode(out)

    case "POST":
        var body struct {
            BreweryID   *int     `json:"brewery_id"`
            Name        string   `json:"name"`
            BeerTypeID  *int     `json:"beer_type_id"`
            ABV         *float64 `json:"abv"`
            UntappdLink *string  `json:"untappd_link"`
            EventID     *int     `json:"event_id"` // if set, also attach to this event's pool
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON", 400)
            return
        }
        if body.Name == "" {
            http.Error(w, "Missing name", 400)
            return
        }
        // Creating within an event pool requires host rights on that event;
        // creating a bare catalog entry is admin-only.
        if body.EventID != nil {
            if !RequireHost(w, r, *body.EventID) {
                return
            }
        } else if !RequireAdmin(w, r) {
            return
        }

        // brewery text is a denormalized copy of the chosen brewery's name.
        res, err := db.Exec(
            `INSERT INTO beer_options (brewery_id, brewery, name, beer_type_id, abv, untappd_link)
             VALUES (?, (SELECT name FROM breweries WHERE id = ?), ?, ?, ?, ?)`,
            body.BreweryID, body.BreweryID, body.Name, body.BeerTypeID, body.ABV, body.UntappdLink,
        )
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        id, _ := res.LastInsertId()

        if body.EventID != nil {
            if _, err := db.Exec(
                `INSERT IGNORE INTO event_beer_options (event_id, beer_option_id) VALUES (?, ?)`,
                *body.EventID, id,
            ); err != nil {
                http.Error(w, err.Error(), 500)
                return
            }
        }
        json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "name": body.Name})

    case "PUT":
        var body struct {
            ID          int      `json:"id"`
            BreweryID   *int     `json:"brewery_id"`
            Name        string   `json:"name"`
            BeerTypeID  *int     `json:"beer_type_id"`
            ABV         *float64 `json:"abv"`
            UntappdLink *string  `json:"untappd_link"`
            EventID     *int     `json:"event_id"` // host context; else admin
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON", 400)
            return
        }
        if body.ID == 0 || body.Name == "" {
            http.Error(w, "Missing id or name", 400)
            return
        }
        if body.EventID != nil {
            if !RequireHost(w, r, *body.EventID) {
                return
            }
        } else if !RequireAdmin(w, r) {
            return
        }

        if _, err := db.Exec(
            `UPDATE beer_options
             SET brewery_id = ?, brewery = (SELECT name FROM breweries WHERE id = ?),
                 name = ?, beer_type_id = ?, abv = ?, untappd_link = ?
             WHERE id = ?`,
            body.BreweryID, body.BreweryID, body.Name, body.BeerTypeID, body.ABV, body.UntappdLink, body.ID,
        ); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        json.NewEncoder(w).Encode(map[string]interface{}{"id": body.ID, "name": body.Name})

    default:
        http.Error(w, "Method not allowed", 405)
    }
}

// ---------------------------------------------------------------------------
// ABV ranges — global catalog
// GET  /abv_ranges     list all
// POST /abv_ranges     create, optionally attaching to an event
// ---------------------------------------------------------------------------

func ABVRanges(w http.ResponseWriter, r *http.Request) {
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    switch r.Method {
    case "GET":
        rows, err := db.Query(`SELECT id, label, min_abv, max_abv FROM abv_ranges ORDER BY min_abv, id`)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        defer rows.Close()
        type ABV struct {
            ID     int      `json:"id"`
            Label  string   `json:"label"`
            MinABV *float64 `json:"min_abv"`
            MaxABV *float64 `json:"max_abv"`
        }
        out := []ABV{}
        for rows.Next() {
            var a ABV
            rows.Scan(&a.ID, &a.Label, &a.MinABV, &a.MaxABV)
            out = append(out, a)
        }
        json.NewEncoder(w).Encode(out)

    case "POST":
        var body struct {
            Label   string   `json:"label"`
            MinABV  *float64 `json:"min_abv"`
            MaxABV  *float64 `json:"max_abv"`
            EventID *int     `json:"event_id"`
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
            http.Error(w, "Invalid JSON", 400)
            return
        }
        if body.Label == "" {
            http.Error(w, "Missing label", 400)
            return
        }
        if body.EventID != nil {
            if !RequireHost(w, r, *body.EventID) {
                return
            }
        } else if !RequireAdmin(w, r) {
            return
        }

        res, err := db.Exec(`INSERT INTO abv_ranges (label, min_abv, max_abv) VALUES (?, ?, ?)`,
            body.Label, body.MinABV, body.MaxABV)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        id, _ := res.LastInsertId()

        if body.EventID != nil {
            if _, err := db.Exec(
                `INSERT IGNORE INTO event_abv_ranges (event_id, abv_range_id) VALUES (?, ?)`,
                *body.EventID, id,
            ); err != nil {
                http.Error(w, err.Error(), 500)
                return
            }
        }
        json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "label": body.Label})

    default:
        http.Error(w, "Method not allowed", 405)
    }
}

// ---------------------------------------------------------------------------
// Beer types — global taxonomy (admin only)
// POST /beer_types    create a new type {label}
// PUT  /beer_types    rename a type {id, label}
// ---------------------------------------------------------------------------

func CreateBeerType(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" && r.Method != "PUT" {
        http.Error(w, "POST or PUT required", 405)
        return
    }
    var body struct {
        ID      int    `json:"id"`
        Label   string `json:"label"`
        EventID *int   `json:"event_id"` // host context; else admin
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }
    if body.Label == "" {
        http.Error(w, "Missing label", 400)
        return
    }
    if body.EventID != nil {
        if !RequireHost(w, r, *body.EventID) {
            return
        }
    } else if !RequireAdmin(w, r) {
        return
    }
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    if r.Method == "PUT" {
        if body.ID == 0 {
            http.Error(w, "Missing id", 400)
            return
        }
        if _, err := db.Exec(`UPDATE beer_types SET label = ? WHERE id = ?`, body.Label, body.ID); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        json.NewEncoder(w).Encode(map[string]interface{}{"id": body.ID, "name": body.Label})
        return
    }

    res, err := db.Exec(`INSERT INTO beer_types (label) VALUES (?)`, body.Label)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    id, _ := res.LastInsertId()
    json.NewEncoder(w).Encode(map[string]interface{}{"id": id, "name": body.Label})
}
