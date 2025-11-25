package main

import (
    "fmt"
    "juleol/api"

    "github.com/joho/godotenv"
    "log"
)

func main() {
    // Load .env.local automatically
    err := godotenv.Load(".env.local")
    if err != nil {
        log.Println("No .env.local file found, using system env")
    }

    db, err := api.DB()
    if err != nil {
        panic(err)
    }

    err = db.Ping()
    if err != nil {
        panic(err)
    }

    fmt.Println("Connected OK!")
}
