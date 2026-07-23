package api

import (
    "net/http"
    "os"
    "strconv"
    "strings"
)

// Identity of the calling user, forwarded from the trusted Next.js layer via
// request headers. The Next.js API routes derive these from the verified
// Google session, so the backend only needs to trust that they came from
// Next.js (guarded by the shared INTERNAL_API_SECRET).
type Caller struct {
    UserID int
    Email  string
}

func GetCaller(r *http.Request) Caller {
    id, _ := strconv.Atoi(r.Header.Get("X-User-Id"))
    return Caller{
        UserID: id,
        Email:  strings.ToLower(strings.TrimSpace(r.Header.Get("X-User-Email"))),
    }
}

func adminEmail() string {
    return strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))
}

func (c Caller) IsAdmin() bool {
    a := adminEmail()
    return a != "" && c.Email == a
}

// internalSecretOK verifies the request came through the trusted Next.js proxy.
// If INTERNAL_API_SECRET is not configured, the check is skipped (dev/back-compat).
func internalSecretOK(r *http.Request) bool {
    secret := os.Getenv("INTERNAL_API_SECRET")
    if secret == "" {
        return true
    }
    return r.Header.Get("X-Internal-Secret") == secret
}

// RequireAdmin allows only the super-admin. Writes an HTTP error and returns
// false when the caller is not authorized.
func RequireAdmin(w http.ResponseWriter, r *http.Request) bool {
    if !internalSecretOK(r) {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return false
    }
    c := GetCaller(r)
    if !c.IsAdmin() {
        http.Error(w, "Admin only", http.StatusForbidden)
        return false
    }
    return true
}

// RequireHost allows the super-admin or the owner (arrangør) of the given event.
func RequireHost(w http.ResponseWriter, r *http.Request, eventID interface{}) bool {
    if !internalSecretOK(r) {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return false
    }
    c := GetCaller(r)
    if c.IsAdmin() {
        return true
    }

    db, err := DB()
    if err != nil {
        http.Error(w, "DB error", http.StatusInternalServerError)
        return false
    }

    var ownerID int
    if err := db.QueryRow(`SELECT owner_id FROM events WHERE id = ?`, eventID).Scan(&ownerID); err != nil {
        http.Error(w, "Event not found", http.StatusNotFound)
        return false
    }

    if c.UserID != 0 && c.UserID == ownerID {
        return true
    }

    http.Error(w, "Not authorized for this event", http.StatusForbidden)
    return false
}
