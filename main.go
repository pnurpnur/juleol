package main

import (
    "log"
    "net/http"
    "os"

    "juleol/api"
)

func main() {
    log.Println("🚀 Starting Juleøl backend (PRODUCTION MODE)...")

    //
    // ----------- Setup PORT ----------
    //
    port := os.Getenv("PORT")
    if port == "" {
        port = "3001" // fallback for lokal docker kjøring
        log.Println("⚠️  PORT not set, defaulting to :3001")
    }

    //
    // ----------- Test DB Connection ----------
    //
    db, err := api.DB()
    if err != nil {
        log.Fatal("❌ Database connection failed:", err)
    }
    defer db.Close()

    log.Println("🟢 Connected to database")

    //
    // ----------- API ROUTES -----------
    //

    // Guessing
    http.HandleFunc("/submit_guess", api.SubmitGuess)
    http.HandleFunc("/get_guess", api.GetGuess)

    // Rating
    http.HandleFunc("/submit_rating", api.SubmitRating)
    http.HandleFunc("/get_rating", api.GetRating)

    // Event data
    http.HandleFunc("/events", api.ListEvents)
    http.HandleFunc("/event_beer_options", api.EventBeerOptions)
    http.HandleFunc("/event_abv_ranges", api.EventABVRanges)
    http.HandleFunc("/types", api.BeerTypes)

    // Users
    http.HandleFunc("/register_user", api.RegisterUser)

    // Health check
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    //
    // ----------- START SERVER -----------
    //

    log.Printf("📡 Listening on :%s\n", port)
    log.Fatal(http.ListenAndServe("0.0.0.0:"+port, nil))
}
