package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

type BeerScore struct {
	BeerName    string  `json:"beerName"`
	UntappdLink string  `json:"untappdLink"`
	Sum         int     `json:"sum"`
	Ratings     int     `json:"ratings"`
	Average     float64 `json:"average"`
}

type BestBeersResp struct {
	Beers []BeerScore `json:"beers"`
}

// GET /api/best_beers?event_id=123
func GetBestBeers(w http.ResponseWriter, r *http.Request) {
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

	log.Printf("🔵 [GetBestBeers] event_id=%d\n", eventID)

	q := `
SELECT
  bo.name AS beer_name,
  bo.untappd_link,
  SUM(r.rating) AS rating_sum,
  COUNT(r.beer_id) AS ratings,
  SUM(r.rating) / COUNT(r.beer_id) AS average_rating
FROM ratings r
JOIN beers b on b.id = r.beer_id
JOIN beer_options bo ON bo.id = b.beer_option_id
WHERE r.event_id = ?
GROUP BY bo.id
ORDER BY average_rating DESC
`

	rows, err := db.Query(q, eventID)
	if err != nil {
		log.Println("query error:", err)
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var beers []BeerScore
	for rows.Next() {
		var b BeerScore
		if err := rows.Scan(&b.BeerName, &b.UntappdLink, &b.Sum, &b.Ratings, &b.Average); err != nil {
			log.Println("scan error:", err)
			continue
		}
		beers = append(beers, b)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(BestBeersResp{Beers: beers})
}
