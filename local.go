//go:build local
package main

import (
    "log"
    "net/http"

    "github.com/joho/godotenv"
    "juleol/api"
)

func main() {
    godotenv.Load(".env.local")

    http.HandleFunc("/submit_guess", api.SubmitGuess)
    http.HandleFunc("/leaderboard", api.Leaderboard)
    http.HandleFunc("/create_event", api.CreateEvent)
    http.HandleFunc("/close_event", api.CloseEvent)
	http.HandleFunc("/register_user", api.RegisterUser)

    log.Println("API running at http://localhost:3001")
    log.Fatal(http.ListenAndServe(":3001", nil))
}
