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
	http.HandleFunc("/create_event", api.CreateEvent)
	http.HandleFunc("/close_event", api.CloseEvent)
	http.HandleFunc("/update_event", api.UpdateEvent)
	http.HandleFunc("/event_beers", api.EventBeers)
	http.HandleFunc("/event_beer_options", api.EventBeerOptions)
	http.HandleFunc("/event_abv_ranges", api.EventABVRanges)
	http.HandleFunc("/types", api.BeerTypes)
	http.HandleFunc("/delete_event_beer", api.DeleteEventBeer)
	http.HandleFunc("/event_stats", api.EventStats)
	http.HandleFunc("/event_fasit_stats", api.EventFasitStats)
	http.HandleFunc("/event_summary_feed", api.EventSummaryFeed)

	// RESULTS
	http.HandleFunc("/user_results", api.GetUserResults)
	http.HandleFunc("/results", api.Leaderboard)
	http.HandleFunc("/best_beers", api.GetBestBeers)

	// ADMIN CATALOGS
	http.HandleFunc("/users", api.ListUsers)
	http.HandleFunc("/beer_options", api.BeerOptions)
	http.HandleFunc("/abv_ranges", api.ABVRanges)
	http.HandleFunc("/beer_types", api.CreateBeerType)
	http.HandleFunc("/breweries", api.Breweries)

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
