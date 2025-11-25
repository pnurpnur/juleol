package api

type Guess struct {
    EventID     int    `json:"event_id"`
    UserID      string `json:"user_id"`
    BeerID      int    `json:"beer_id"`

    GuessedBeerOptionID int `json:"guessed_beer_option_id"`
    GuessedABVRangeID   int `json:"guessed_abv_range_id"`
    GuessedTypeID       int `json:"guessed_type_id"`
    Rating              int `json:"rating"`
}

type CreateEventRequest struct {
    Name    string `json:"name"`
    OwnerID string `json:"owner_id"`
}

type CloseEventRequest struct {
    EventID int    `json:"event_id"`
    UserID  string `json:"user_id"`
}
