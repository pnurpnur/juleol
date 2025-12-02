package api

import (
    "database/sql"
	"encoding/json"
    "log"
    "net/http"
    "strconv"
)

// GET /user_results?event_id=123&user_id=1
func GetUserResults(w http.ResponseWriter, r *http.Request) {
    eventIDStr := r.URL.Query().Get("event_id")
    userIDStr := r.URL.Query().Get("user_id")

    log.Println("🔵 [GetUserResults] incoming:", "event_id=", eventIDStr, "user_id=", userIDStr)

    if eventIDStr == "" || userIDStr == "" {
        http.Error(w, "missing event_id or user_id", http.StatusBadRequest)
        return
    }
    eventID, err := strconv.Atoi(eventIDStr)
    if err != nil {
        http.Error(w, "invalid event_id", http.StatusBadRequest)
        return
    }
	userID, err := strconv.Atoi(userIDStr)
    if err != nil {
        http.Error(w, "invalid user_id", http.StatusBadRequest)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    q := `
SELECT
  eb.id AS event_beer_id,
  bo.name AS correct_option_name,
  abv.label AS correct_abv_name,
  bt.label AS correct_type_name,
  bopt.name AS guessed_option_name,
  abvpt.label AS guessed_abv_range_name,
  btpt.label AS guessed_type_name,
  r.rating,
  r.untappd_score,
  bo.untappd_link
FROM beers eb
LEFT JOIN guesses g
  ON g.event_id = eb.event_id AND g.beer_id = eb.id AND g.user_id = ?
LEFT JOIN ratings r
  ON r.event_id = eb.event_id AND r.beer_id = eb.id AND r.user_id = ?
LEFT JOIN beer_options bo
  ON eb.beer_option_id = bo.id
LEFT JOIN beer_options bopt
  ON g.guessed_beer_option_id = bopt.id
LEFT JOIN abv_ranges abv
  ON eb.abv_range_id = abv.id
LEFT JOIN abv_ranges abvpt
  ON g.guessed_abv_range_id = abvpt.id
LEFT JOIN beer_types bt
  ON eb.beer_type_id = bt.id
LEFT JOIN beer_types btpt
  ON g.guessed_type_id = btpt.id
WHERE eb.event_id = ?
ORDER BY eb.id ASC
`

    rows, err := db.Query(q, userID, userID, eventID)
    if err != nil {
        log.Println("query error:", err)
        http.Error(w, "query error", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    type item struct {
        EventBeerID       int      `json:"eventBeerId"`
        CorrectOptionName *string  `json:"correctOptionName,omitempty"`
        GuessedOptionName *string  `json:"guessedOptionName,omitempty"`
        Correct           bool     `json:"correct"`
        Rating            *int     `json:"rating,omitempty"`
        UntappdScore      *float64 `json:"untappdScore,omitempty"`
        UntappdLink    	  *string  `json:"untappdLink,omitempty"`
        CorrectAbvName    *string  `json:"correctAbvName,omitempty"`
        GuessedAbvName    *string  `json:"guessedAbvName,omitempty"`
        CorrectTypeName   *string  `json:"correctTypeName,omitempty"`
        GuessedTypeName   *string  `json:"guessedTypeName,omitempty"`
        AbvCorrect        bool     `json:"abvCorrect"`
        TypeCorrect       bool     `json:"typeCorrect"`
    }

    var out struct {
        EventID int    `json:"eventId"`
        UserID  int    `json:"userId"`
        Items   []item `json:"items"`
    }
    out.EventID = eventID
    out.UserID = userID

    for rows.Next() {
        var (
            eventBeerID         int
            correctOptionName   sql.NullString
            correctAbvName      sql.NullString
            correctTypeName     sql.NullString
            guessedOptionName   sql.NullString
            guessedAbvName      sql.NullString
            guessedTypeName     sql.NullString
            ratingNull          sql.NullInt64
            untappdNull         sql.NullFloat64
            untappdLinkNull     sql.NullString
        )

        if err := rows.Scan(
            &eventBeerID,
            &correctOptionName,
            &correctAbvName,
            &correctTypeName,
            &guessedOptionName,
            &guessedAbvName,
            &guessedTypeName,
            &ratingNull,
            &untappdNull,
            &untappdLinkNull,
        ); err != nil {
            log.Printf("❌ [GetUserResults] Scan error: %v (12 columns expected)\n", err)
            continue
        }

        it := item{
            EventBeerID:    eventBeerID,
            Correct:        false,
            AbvCorrect:     false,
            TypeCorrect:    false,
        }
        if correctOptionName.Valid {
            s := correctOptionName.String
            it.CorrectOptionName = &s
        }
        if guessedOptionName.Valid {
            s := guessedOptionName.String
            it.GuessedOptionName = &s
        }
        if it.CorrectOptionName != nil && it.GuessedOptionName != nil {
            it.Correct = (*it.CorrectOptionName == *it.GuessedOptionName)
        }
        if correctAbvName.Valid {
            s := correctAbvName.String
            it.CorrectAbvName = &s
        }
        if guessedAbvName.Valid {
            s := guessedAbvName.String
            it.GuessedAbvName = &s
        }
        if it.CorrectAbvName != nil && it.GuessedAbvName != nil {
            it.AbvCorrect = (*it.CorrectAbvName == *it.GuessedAbvName)
        }
        if correctTypeName.Valid {
            s := correctTypeName.String
			it.CorrectTypeName = &s
		}	
        if guessedTypeName.Valid {
            s := guessedTypeName.String
			it.GuessedTypeName = &s
		}			
        if it.CorrectTypeName != nil && it.GuessedTypeName != nil {
            it.TypeCorrect = (*it.CorrectTypeName == *it.GuessedTypeName)
        }
        if ratingNull.Valid {
            v := int(ratingNull.Int64)
            it.Rating = &v
        }
        if untappdNull.Valid {
            v := float64(untappdNull.Float64)
            it.UntappdScore = &v
        }
        if untappdLinkNull.Valid {
			s := untappdLinkNull.String
			it.UntappdLink = &s
		}

        out.Items = append(out.Items, it)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(out)
}