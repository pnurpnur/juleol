package api

import (
    "database/sql"
    "fmt"
    "log"
    "os"
    "strings"

    _ "github.com/go-sql-driver/mysql"
)

var dbInstance *sql.DB

func DB() (*sql.DB, error) {
    if dbInstance != nil {
        return dbInstance, nil
    }

    dsn := os.Getenv("DATABASE_URL")
    if dsn == "" {
        return nil, fmt.Errorf("Missing environment variable DATABASE_URL")
    }

    // Railway gives URL format: mysql://user:pass@host:port/db
    // mysql driver needs:        user:pass@tcp(host:port)/db?parseTime=true
    if strings.HasPrefix(dsn, "mysql://") {
        dsn = strings.TrimPrefix(dsn, "mysql://")

        // Split on @ → left: user:pass, right: host:port/db
        parts := strings.SplitN(dsn, "@", 2)
        if len(parts) != 2 {
            return nil, fmt.Errorf("Invalid DATABASE_URL format")
        }

        userPass := parts[0]
        hostPart := parts[1]

        // Replace first "/" with ")/"
        idx := strings.Index(hostPart, "/")
        if idx == -1 {
            return nil, fmt.Errorf("Invalid DATABASE_URL (missing '/')")
        }

        host := hostPart[:idx]
        dbname := hostPart[idx+1:]

        // Convert to Go MySQL DSN
        dsn = fmt.Sprintf("%s@tcp(%s)/%s?parseTime=true", userPass, host, dbname)
    } else {
        // If user already provides DSN in correct format
        if !strings.Contains(dsn, "parseTime") {
            dsn += "?parseTime=true"
        }
    }

    log.Println("Connecting to DB:", dsn)

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        return nil, err
    }

    if err := db.Ping(); err != nil {
        return nil, err
    }

    dbInstance = db
    return dbInstance, nil
}
