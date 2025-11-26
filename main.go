package main

import (
    "log"
    "net/http"
    "os"

    // API-pakkene dine
    "juleol/api" // ← endre hvis mappestrukturen din er annerledes
)

func main() {
    log.Println("Starting Juleøl server...")

    // 🔧 Les PORT fra Railway eller bruk fallback
    port := os.Getenv("PORT")
    if port == "" {
        port = "3001"
        log.Println("PORT not set, using default:", port)
    }

    // 🔧 Test database connection
    db, err := api.DB()
    if err != nil {
        log.Fatal("Database connection failed:", err)
    }
    defer db.Close()
    log.Println("Database connected successfully.")

    // 🔥 API ROUTES
    http.HandleFunc("/submit_guess", api.SubmitGuess)
    http.HandleFunc("/register_user", api.RegisterUser)
    http.HandleFunc("/events", api.ListEvents)
    http.HandleFunc("/event_abv_ranges", api.EventABVRanges)
    http.HandleFunc("/event_beer_options", api.EventBeerOptions)
    http.HandleFunc("/types", api.BeerTypes)
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    // 🚀 Start server
    log.Println("Server running on port:", port)
    log.Fatal(http.ListenAndServe(":"+port, nil))
}
