package api

type CreateEventRequest struct {
    Name    string `json:"name"`
    OwnerID string `json:"owner_id"`
}

type CloseEventRequest struct {
    EventID int    `json:"event_id"`
    UserID  string `json:"user_id"`
}
