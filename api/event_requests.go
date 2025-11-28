package api

// Used by POST /create_event
type CreateEventRequest struct {
    Name    string `json:"name"`
    UserID  string `json:"user_id"` // owner of event
}

// Used by POST /close_event
type CloseEventRequest struct {
    EventID int    `json:"event_id"`
    UserID  string `json:"user_id"`
}
