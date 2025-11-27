package api

type Rating struct {
    EventID      int        `json:"event_id"`
    UserID       string     `json:"user_id"`
    BeerID       int        `json:"beer_id"`
    Rating       float64    `json:"rating"`
    UntappdScore *float64   `json:"untappd_score"`
    CreatedAt    string     `json:"created_at"`
}
