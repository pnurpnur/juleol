package api

import (
    "encoding/json"
    "net/http"
)

func RegisterUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST required", 405)
        return
    }

    var u struct {
        ID    string `json:"id"`
        Name  string `json:"name"`
        Email string `json:"email"`
    }

    json.NewDecoder(r.Body).Decode(&u)

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
