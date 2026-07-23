package api

// Used by POST /create_event
type CreateEventRequest struct {
    Name    string `json:"name"`
    OwnerID int    `json:"owner_id"` // arrangør (host) for the event
}

// Used by POST /close_event
type CloseEventRequest struct {
    EventID int    `json:"event_id"`
    UserID  string `json:"user_id"`
}
