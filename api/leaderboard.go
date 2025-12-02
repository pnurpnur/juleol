package api

import (
    "encoding/json"
    "log"
    "net/http"
    "strconv"
)

type standing struct {
    UserID    int 	 `json:"userId"`
    UserName  string `json:"userName"`
    Placement int    `json:"placement"`
    Points    int    `json:"points"`
    BeerPoints int   `json:"beerPoints"`
    AbvPoints  int   `json:"abvPoints"`
    TypePoints int   `json:"typePoints"`
}

type leaderboardResp struct {
    Standings []standing `json:"standings"`
    Total     int        `json:"totalParticipants"`
}

// GET /results?event_id=123
func Leaderboard(w http.ResponseWriter, r *http.Request) {
    eventIDStr := r.URL.Query().Get("event_id")
    if eventIDStr == "" {
        http.Error(w, "missing event_id", http.StatusBadRequest)
        return
    }
    eventID, err := strconv.Atoi(eventIDStr)
    if err != nil {
        http.Error(w, "invalid event_id", http.StatusBadRequest)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    log.Printf("🔵 [GetLeaderboard] event_id=%d\n", eventID)

    // Query: for each user, count correct guesses in each category + fetch user name
    q := `
SELECT
  g.user_id,
  COALESCE(u.name, u.email, g.user_id) AS user_name,
  SUM(CASE WHEN g.guessed_beer_option_id = eb.beer_option_id THEN 1 ELSE 0 END) AS beer_points,
  SUM(CASE WHEN g.guessed_abv_range_id = eb.abv_range_id THEN 1 ELSE 0 END) AS abv_points,
  SUM(CASE WHEN g.guessed_type_id = eb.beer_type_id THEN 1 ELSE 0 END) AS type_points
FROM guesses g
LEFT JOIN users u ON g.user_id = u.id
JOIN beers eb
  ON g.event_id = eb.event_id AND g.beer_id = eb.id
WHERE g.event_id = ?
GROUP BY g.user_id
ORDER BY (beer_points + abv_points + type_points) DESC
`

    rows, err := db.Query(q, eventID)
    if err != nil {
        log.Println("leaderboard query error:", err)
        http.Error(w, "query error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var standings []standing
    for rows.Next() {
        var s standing
        var beerPts, abvPts, typePts int
        if err := rows.Scan(&s.UserID, &s.UserName, &beerPts, &abvPts, &typePts); err != nil {
            log.Println("scan error:", err)
            continue
        }
        s.BeerPoints = beerPts
        s.AbvPoints = abvPts
        s.TypePoints = typePts
        s.Points = beerPts + abvPts + typePts
        standings = append(standings, s)
    }

    // Assign placements, accounting for ties
    if len(standings) > 0 {
        standings[0].Placement = 1
        for i := 1; i < len(standings); i++ {
            if standings[i].Points == standings[i-1].Points {
                standings[i].Placement = standings[i-1].Placement
            } else {
                standings[i].Placement = i + 1
            }
        }
    }

    resp := leaderboardResp{
        Standings: standings,
        Total:     len(standings),
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}
