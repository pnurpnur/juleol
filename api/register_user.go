package api

import (
    "encoding/json"
    "log"
    "net/http"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func RegisterUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    log.Println("RegisterUser called")

    var u struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
        log.Println("RegisterUser decode error:", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    if u.Email == "" {
        http.Error(w, "Email is required", http.StatusBadRequest)
        return
    }

    log.Printf("RegisterUser payload: name=%s email=%s\n", u.Name, u.Email)

    db, err := DB()
    if err != nil {
        log.Println("RegisterUser DB error:", err)
        http.Error(w, "DB error", http.StatusInternalServerError)
        return
    }

    // Upsert med autoincrement ID
    res, err := db.Exec(`
        INSERT INTO users (name, email)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    `, u.Name, u.Email)

    if err != nil {
        log.Println("RegisterUser SQL error:", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    var userID int
    // Hvis nytt insert, hent siste autoincrement ID
    id, err := res.LastInsertId()
    if err == nil && id > 0 {
        userID = int(id)
    } else {
        // Hvis eksisterende rad, hent ID basert på email
        row := db.QueryRow("SELECT id FROM users WHERE email = ?", u.Email)
        if err := row.Scan(&userID); err != nil {
            log.Println("RegisterUser fetch ID error:", err)
            http.Error(w, "Failed to get user ID", http.StatusInternalServerError)
            return
        }
    }

    log.Println("RegisterUser success for user:", u.Email, "ID:", userID)

    user := User{
        ID:    userID,
        Name:  u.Name,
        Email: u.Email,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}
