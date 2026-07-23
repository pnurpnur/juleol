package api

import (
    "encoding/json"
    "net/http"
)

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
    ID          int     `json:"id"`
    Name        string  `json:"name"`
    UntappdLink *string `json:"untappd_link"`
}

func BeerOptions(w http.ResponseWriter, r *http.Request) {
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
        return
    }

    switch r.Method {
    case "GET":
        rows, err := db.Query(`SELECT id, name, untappd_link FROM beer_options ORDER BY name`)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        defer rows.Close()
        out := []beerOption{}
        for rows.Next() {
            var o beerOption
            rows.Scan(&o.ID, &o.Name, &o.UntappdLink)
            out = append(out, o)
        }
        json.NewEncoder(w).Encode(out)

    case "POST":
        var body struct {
            Name        string  `json:"name"`
            UntappdLink *string `json:"untappd_link"`
            EventID     *int    `json:"event_id"` // if set, also attach to this event's pool
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

        res, err := db.Exec(`INSERT INTO beer_options (name, untappd_link) VALUES (?, ?)`, body.Name, body.UntappdLink)
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
        rows, err := db.Query(`SELECT id, label FROM abv_ranges ORDER BY id`)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        defer rows.Close()
        type ABV struct {
            ID    int    `json:"id"`
            Label string `json:"label"`
        }
        out := []ABV{}
        for rows.Next() {
            var a ABV
            rows.Scan(&a.ID, &a.Label)
            out = append(out, a)
        }
        json.NewEncoder(w).Encode(out)

    case "POST":
        var body struct {
            Label   string `json:"label"`
            EventID *int   `json:"event_id"`
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

        res, err := db.Exec(`INSERT INTO abv_ranges (label) VALUES (?)`, body.Label)
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
// Beer types — global taxonomy (admin only to create)
// POST /beer_types    create a new type
// ---------------------------------------------------------------------------

func CreateBeerType(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", 405)
        return
    }
    if !RequireAdmin(w, r) {
        return
    }
    var body struct {
        Label string `json:"label"`
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, "Invalid JSON", 400)
        return
    }
    if body.Label == "" {
        http.Error(w, "Missing label", 400)
        return
    }
    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", 500)
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
