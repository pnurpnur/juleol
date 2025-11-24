package api

import (
    "net/http"
    "os"

    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

var googleConfig = &oauth2.Config{
    RedirectURL:  os.Getenv("GOOGLE_CALLBACK_URL"),
    ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
    ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
    Scopes:       []string{"email", "profile"},
    Endpoint:     google.Endpoint,
}

func AuthLogin(w http.ResponseWriter, r *http.Request) {
    url := googleConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
    http.Redirect(w, r, url, 302)
}
