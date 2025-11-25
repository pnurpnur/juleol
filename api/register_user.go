package api

import (
    "encoding/json"
    "net/http"
)

func RegisterUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "Method not allowed", 405)
        return
    }

    var u struct {
        ID    string `json:"id"`
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
        http.Error(w, err.Error(), 400)
        return
    }

    db, _ := DB()

    _, err := db.Exec(`
        INSERT INTO users (id, name, email)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)
    `, u.ID, u.Name, u.Email)

    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    w.Write([]byte(`{"status":"ok"}`))
}
