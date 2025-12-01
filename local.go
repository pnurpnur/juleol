//go:build local

package main

import (
    "log"
    "net/http"

    "github.com/joho/godotenv"

    "juleol/api"
)

func main() {
    // Load env file
    if err := godotenv.Load(".env.local"); err != nil {
        log.Println("⚠️  .env.local ikke funnet – bruker systemvariabler")
    } else {
        log.Println("📄 Lastet .env.local")
    }

    log.Println("🚀 Starter Juleøl-server (LOCAL MODE) ...")

    // Test DB
    db, err := api.DB()
    if err != nil {
        log.Fatal("❌ Klarte ikke koble til database:", err)
    }
    defer db.Close()

    log.Println("🟢 Database connection OK")

    //
    // ---------------- API ROUTES ----------------
    //

    // GUESS
    http.HandleFunc("/submit_guess", api.SubmitGuess)
    http.HandleFunc("/get_guess", api.GetGuess)

    // RATING
    http.HandleFunc("/submit_rating", api.SubmitRating)
    http.HandleFunc("/get_rating", api.GetRating)

    // EVENT DATA
    http.HandleFunc("/events", api.ListEvents)
	http.HandleFunc("/event", api.GetEvent)
	http.HandleFunc("/update_event", api.UpdateEvent)
	http.HandleFunc("/event_beers", api.EventBeers)
    http.HandleFunc("/event_beer_options", api.EventBeerOptions)
    http.HandleFunc("/event_abv_ranges", api.EventABVRanges)
    http.HandleFunc("/types", api.BeerTypes)
	http.HandleFunc("/delete_event_beer", api.DeleteEventBeer)

    // USERS
    http.HandleFunc("/register_user", api.RegisterUser)

    // HEALTH CHECK
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("ok"))
    })

    //
    // ---------------- START SERVER ----------------
    //

    log.Println("📡 API lytter på http://localhost:3001")
    log.Fatal(http.ListenAndServe(":3001", nil))
}
