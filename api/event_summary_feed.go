package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
)

type SummaryFeedResponse struct {
	EventID int        `json:"event_id"`
	Beers   []BeerFeed `json:"beers"`
}

type BeerFeed struct {
	BeerID        int           `json:"beer_id"`
	Correct       BeerCorrect   `json:"correct"`
	AverageRating float64       `json:"average_rating"`
	Participants  []Participant `json:"participants"`
	Summary       BeerSummary   `json:"summary"`
}

type BeerCorrect struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Abv  string `json:"abv"`
}

type Participant struct {
	Name    string           `json:"name"`
	Guessed BeerCorrect      `json:"guessed"`
	Rating  *int             `json:"rating"`
	Correct GuessCorrectness `json:"correct"`
}

type GuessCorrectness struct {
	Name bool `json:"name"`
	Type bool `json:"type"`
	Abv  bool `json:"abv"`
}

type RatingEntry struct {
	Name   string `json:"name"`
	Rating int    `json:"rating"`
}

type BeerSummary struct {
	AllCorrect    []string      `json:"all_correct"`
	AllWrong      []string      `json:"all_wrong"`
	CorrectBeer   []string      `json:"correct_beer"`
	WrongBeer     []string      `json:"wrong_beer"`
	CorrectType   []string      `json:"correct_type"`
	WrongType     []string      `json:"wrong_type"`
	CorrectABV    []string      `json:"correct_abv"`
	WrongABV      []string      `json:"wrong_abv"`
	HighestRating []RatingEntry `json:"highest_rating"`
	LowestRating  []RatingEntry `json:"lowest_rating"`
}

// GET /api/event_summary_feed?event_id=123
func EventSummaryFeed(w http.ResponseWriter, r *http.Request) {
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

	log.Printf("🔵 [EventSummaryFeed] event_id=%d\n", eventID)

	rows, err := db.Query(`
SELECT
  eb.id,

  bo.name,
  bt.label,
  abv.label,

  u.name,

  bo2.name,
  bt2.label,
  abv2.label,

  (g.guessed_beer_option_id IS NOT NULL AND g.guessed_beer_option_id = eb.beer_option_id),
  (g.guessed_type_id IS NOT NULL AND g.guessed_type_id = eb.beer_type_id),
  (g.guessed_abv_range_id IS NOT NULL AND g.guessed_abv_range_id = eb.abv_range_id),

  r.rating
FROM beers eb
JOIN beer_options bo ON bo.id = eb.beer_option_id
JOIN beer_types bt ON bt.id = eb.beer_type_id
JOIN abv_ranges abv ON abv.id = eb.abv_range_id

LEFT JOIN guesses g ON g.beer_id = eb.id
JOIN users u ON u.id = g.user_id

LEFT JOIN beer_options bo2 ON bo2.id = g.guessed_beer_option_id
LEFT JOIN beer_types bt2   ON bt2.id = g.guessed_type_id
LEFT JOIN abv_ranges abv2  ON abv2.id = g.guessed_abv_range_id

LEFT JOIN ratings r
  ON r.beer_id = eb.id AND r.user_id = u.id

WHERE eb.event_id = ?
ORDER BY eb.id, u.name
`, eventID)

	if err != nil {
		log.Println("query error:", err)
		http.Error(w, "query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	beerMap := map[int]*BeerFeed{}
	order := []int{}

	for rows.Next() {
		var (
			beerID int

			cName, cType, cAbv string
			userName           string
			gName, gType, gAbv *string

			nameCorrect, typeCorrect, abvCorrect bool
			rating                               *int
		)

		if err := rows.Scan(
			&beerID,
			&cName, &cType, &cAbv,
			&userName,
			&gName, &gType, &gAbv,
			&nameCorrect, &typeCorrect, &abvCorrect,
			&rating,
		); err != nil {
			log.Println("scan error:", err)
			continue
		}

		if _, exists := beerMap[beerID]; !exists {
			beerMap[beerID] = &BeerFeed{
				BeerID: beerID,
				Correct: BeerCorrect{
					Name: cName,
					Type: cType,
					Abv:  cAbv,
				},
				Participants: []Participant{},
				Summary: BeerSummary{
					AllCorrect:    []string{},
					AllWrong:      []string{},
					CorrectBeer:   []string{},
					WrongBeer:     []string{},
					CorrectType:   []string{},
					WrongType:     []string{},
					CorrectABV:    []string{},
					WrongABV:      []string{},
					HighestRating: []RatingEntry{},
					LowestRating:  []RatingEntry{},
				},
			}
			order = append(order, beerID)
		}

		p := Participant{
			Name: userName,
			Guessed: BeerCorrect{
				Name: valOrEmpty(gName),
				Type: valOrEmpty(gType),
				Abv:  valOrEmpty(gAbv),
			},
			Rating: rating,
			Correct: GuessCorrectness{
				Name: nameCorrect,
				Type: typeCorrect,
				Abv:  abvCorrect,
			},
		}

		beerMap[beerID].Participants = append(beerMap[beerID].Participants, p)
	}

	// post-prosessering per øl
	result := []BeerFeed{}

	for _, id := range order {
		beer := beerMap[id]

		var sum, count int
		var maxRating *int
		var minRating *int

		for _, p := range beer.Participants {
			if p.Rating != nil {
				r := *p.Rating
				sum += r
				count++

				if maxRating == nil || r > *maxRating {
					maxRating = &r
					beer.Summary.HighestRating = []RatingEntry{
						{Name: p.Name, Rating: r},
					}
				} else if r == *maxRating {
					beer.Summary.HighestRating = append(
						beer.Summary.HighestRating,
						RatingEntry{Name: p.Name, Rating: r},
					)
				}

				if minRating == nil || r < *minRating {
					minRating = &r
					beer.Summary.LowestRating = []RatingEntry{
						{Name: p.Name, Rating: r},
					}
				} else if r == *minRating {
					beer.Summary.LowestRating = append(
						beer.Summary.LowestRating,
						RatingEntry{Name: p.Name, Rating: r},
					)
				}
			}

			if p.Correct.Name && p.Correct.Type && p.Correct.Abv {
				beer.Summary.AllCorrect = append(beer.Summary.AllCorrect, p.Name)
			} else if p.Guessed.Name != "-" && !p.Correct.Name && !p.Correct.Type && !p.Correct.Abv {
				beer.Summary.AllWrong = append(beer.Summary.AllWrong, p.Name)
			}

			if p.Correct.Name {
				beer.Summary.CorrectBeer = append(beer.Summary.CorrectBeer, p.Name)
			} else if p.Guessed.Name != "-" {
				beer.Summary.WrongBeer = append(beer.Summary.WrongBeer, p.Name)
			}

			if p.Correct.Type {
				beer.Summary.CorrectType = append(beer.Summary.CorrectType, p.Name)
			} else if p.Guessed.Type != "-" {
				beer.Summary.WrongType = append(beer.Summary.WrongType, p.Name)
			}

			if p.Correct.Abv {
				beer.Summary.CorrectABV = append(beer.Summary.CorrectABV, p.Name)
			} else if p.Guessed.Abv != "-" {
				beer.Summary.WrongABV = append(beer.Summary.WrongABV, p.Name)
			}
		}

		if count > 0 {
			beer.AverageRating = float64(sum) / float64(count)
		}

		result = append(result, *beer)
	}

	resp := SummaryFeedResponse{
		EventID: eventID,
		Beers:   result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func valOrEmpty(s *string) string {
	if s == nil {
		return "-"
	}
	return *s
}
