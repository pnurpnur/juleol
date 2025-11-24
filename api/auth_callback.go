package api

import (
    "encoding/json"
    "net/http"
)

func AuthCallback(w http.ResponseWriter, r *http.Request) {
    // Forenklet – normalt henter du tokens, brukerinfo etc.
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "status": "logged_in",
    })
}
