//go:build local
package main

import (
    "log"
    "net/http"

	"github.com/joho/godotenv"
    // API-pakkene dine
    "juleol/api" // ← endre hvis mappestrukturen din er annerledes
)

func main() {
    godotenv.Load(".env.local")
	log.Println("Starting Juleøl server...")

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
    log.Println("API running at http://localhost:3001")
    log.Fatal(http.ListenAndServe(":3001", nil))
}
