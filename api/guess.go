type Guess struct {
    EventID             int     `json:"event_id"`
    UserID              string  `json:"user_id"`
    BeerID              int     `json:"beer_id"`
    GuessedBeerOptionID *int    `json:"guessed_beer_option_id"`
    GuessedABVRangeID   *int    `json:"guessed_abv_range_id"`
    GuessedTypeID       *int    `json:"guessed_type_id"`
    CreatedAt           string  `json:"created_at"`
}
