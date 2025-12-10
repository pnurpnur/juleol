package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

type EventStatsResponse struct {
	EventID int            `json:"event_id"`
	Name    string         `json:"name"`
	IsOpen  bool           `json:"is_open"`
	Ratings map[string]int `json:"ratings"`
	Guesses map[string]int `json:"guesses"`
}

// GET /api/event_stats?event_id=123
func EventStats(w http.ResponseWriter, r *http.Request) {
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

	log.Printf("🔵 [GetEventStats] event_id=%d\n", eventID)

	//
	// 1) HENT EVENT NAVN OG is_open
	//
	var eventName string
	var isOpen bool

	err = db.QueryRow(`
		SELECT name, is_open
		FROM events
		WHERE id = ?
	`, eventID).Scan(&eventName, &isOpen)

	if err != nil {
		log.Println("event lookup error:", err)
		http.Error(w, "event not found", http.StatusNotFound)
		return
	}

	//
	// 2) HENT ANTALL RATINGS PER BRUKER
	//
	rows, err := db.Query(`
		SELECT u.name, COUNT(*) AS total_ratings
		FROM ratings r
		JOIN users u ON u.id = r.user_id
		WHERE r.event_id = ?
		AND r.rating IS NOT NULL
		GROUP BY u.id
		ORDER BY u.name
	`, eventID)

	if err != nil {
		log.Println("rating query error:", err)
		http.Error(w, "rating query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	ratings := make(map[string]int)
	for rows.Next() {
		var user string
		var count int
		if err := rows.Scan(&user, &count); err != nil {
			log.Println("scan rating error:", err)
			continue
		}
		ratings[user] = count
	}

	//
	// 3) HENT ANTALL GUESSES PER BRUKER
	//
	rows2, err := db.Query(`
		SELECT u.name, COUNT(*) AS total_guesses
		FROM guesses g
		JOIN users u ON u.id = g.user_id
		WHERE g.event_id = ?
		AND g.guessed_beer_option_id IS NOT NULL
		AND g.guessed_abv_range_id IS NOT NULL
		AND g.guessed_type_id IS NOT NULL
		GROUP BY u.id
		ORDER BY u.name
	`, eventID)

	if err != nil {
		log.Println("guesses query error:", err)
		http.Error(w, "guesses query error", http.StatusInternalServerError)
		return
	}
	defer rows2.Close()

	guesses := make(map[string]int)
	for rows2.Next() {
		var user string
		var count int
		if err := rows2.Scan(&user, &count); err != nil {
			log.Println("scan guesses error:", err)
			continue
		}
		guesses[user] = count
	}

	//
	// 4) BYGG JSON-RESPONS
	//
	resp := EventStatsResponse{
		EventID: eventID,
		Name:    eventName,
		IsOpen:  isOpen,
		Ratings: ratings,
		Guesses: guesses,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
