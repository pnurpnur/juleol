package api

import (
    "database/sql"
    "os"

    _ "github.com/go-sql-driver/mysql"
)

func DB() (*sql.DB, error) {
    dsn := os.Getenv("JULEOL_Db") // ex: "mysql://..."
    return sql.Open("mysql", dsn)
}
