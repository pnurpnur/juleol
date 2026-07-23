package api

import (
    "encoding/json"
    "log"
    "net/http"
)

func DeleteEventBeer(w http.ResponseWriter, r *http.Request) {
    var req struct {
        BeerID  int `json:"beerId"`
    }

    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Log AFTER decoding so values are populated
    log.Printf("Delete beer %d \n", req.BeerID)

    if req.BeerID == 0 {
        http.Error(w, "Missing beerId", http.StatusBadRequest)
        return
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    // Look up which event this beer belongs to, then authorize the caller as
    // that event's host (or admin). Protects other events' fasit from edits.
    var eventID int
    if err := db.QueryRow(`SELECT event_id FROM beers WHERE id = ?`, req.BeerID).Scan(&eventID); err != nil {
        http.Error(w, "Beer not found", http.StatusNotFound)
        return
    }
    if !RequireHost(w, r, eventID) {
        return
    }

    log.Printf("🔴 [DeleteEventBeer] Deleting beer %d \n", req.BeerID)

    result, err := db.Exec(
        "DELETE FROM beers WHERE id = ?",
        req.BeerID,
    )
    if err != nil {
        log.Printf("Delete error: %s\n", err.Error())
        http.Error(w, "Delete error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    rowsAffected, err := result.RowsAffected()
    if err != nil {
        http.Error(w, "Error checking rows: "+err.Error(), http.StatusInternalServerError)
        return
    }

    if rowsAffected == 0 {
        http.Error(w, "Beer not found", http.StatusNotFound)
        return
    }

    w.WriteHeader(http.StatusNoContent)
    log.Printf("✅ [DeleteEventBeer] Deleted beer %d \n", req.BeerID)
}