package api

import (
    "encoding/json"
    "log"
    "net/http"
)

func RegisterUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    log.Println("RegisterUser called")

    var u struct {
        ID    string `json:"id"`
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
        log.Println("RegisterUser decode error:", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    log.Printf("RegisterUser payload: id=%s name=%s email=%s\n", u.ID, u.Name, u.Email)

    db, err := DB()
    if err != nil {
        log.Println("RegisterUser DB error:", err)
        http.Error(w, "DB error", http.StatusInternalServerError)
        return
    }

    _, err = db.Exec(`
        INSERT INTO users (id, name, email)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)
    `, u.ID, u.Name, u.Email)

    if err != nil {
        log.Println("RegisterUser SQL error:", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    log.Println("RegisterUser success for user:", u.ID)
    w.Write([]byte(`{"status":"ok"}`))
}
