package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"strconv"
)

type FasitItem struct {
	BeerID      int            `json:"beer_id"`
	CorrectName string         `json:"correct_name"`
	CorrectType string         `json:"correct_type"`
	CorrectAbv  string         `json:"correct_abv"`
	Stats       FasitItemStats `json:"stats"`
}

type FasitItemStats struct {
	NameCorrect int `json:"name_correct"`
	TypeCorrect int `json:"type_correct"`
	AbvCorrect  int `json:"abv_correct"`
}

type FasitResponse struct {
	Items []FasitItem `json:"items"`
}

// GET /api/event_fasit_stats?event_id=123
func EventFasitStats(w http.ResponseWriter, r *http.Request) {
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

	log.Printf("🔵 [EventFasitStats] event_id=%d\n", eventID)

	//
	// 1) HENT FASIT + STATISTIKK I ÉN QUERY
	//
	rows, err := db.Query(`
		SELECT 
			eb.id AS beer_id,
			bo.name AS correct_name,
			bt.label AS correct_type,
			abv.label AS correct_abv,
			COALESCE(SUM(CASE WHEN g.guessed_beer_option_id = eb.beer_option_id THEN 1 ELSE 0 END),0) AS name_correct,
			COALESCE(SUM(CASE WHEN g.guessed_type_id = eb.beer_type_id THEN 1 ELSE 0 END),0) AS type_correct,
			COALESCE(SUM(CASE WHEN g.guessed_abv_range_id = eb.abv_range_id THEN 1 ELSE 0 END),0) AS abv_correct
		FROM beers eb
		JOIN beer_options bo ON bo.id = eb.beer_option_id
		JOIN beer_types bt ON bt.id = eb.beer_type_id
		JOIN abv_ranges abv ON abv.id = eb.abv_range_id
		LEFT JOIN guesses g 
			ON g.beer_id = eb.id
			AND g.event_id = ?
		WHERE eb.event_id = ?
		GROUP BY eb.id, bo.name, bt.label, abv.label
		ORDER BY eb.id
	`, eventID, eventID)
	if err != nil {
		log.Println("query error:", err)
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var result []FasitItem
	for rows.Next() {
		var item FasitItem
		if err := rows.Scan(
			&item.BeerID,
			&item.CorrectName,
			&item.CorrectType,
			&item.CorrectAbv,
			&item.Stats.NameCorrect,
			&item.Stats.TypeCorrect,
			&item.Stats.AbvCorrect,
		); err != nil {
			log.Println("scan error:", err)
			continue
		}
		result = append(result, item)
	}

	// 2) SIKRE SORTERING ETTER BEERID (selv om queryen har ORDER BY)
	sort.Slice(result, func(i, j int) bool {
		return result[i].BeerID < result[j].BeerID
	})

	resp := FasitResponse{
		Items: result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
