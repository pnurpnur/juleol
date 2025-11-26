package api

import (
    "crypto/tls"
    "crypto/x509"
    "database/sql"
    "fmt"
    "os"

    "github.com/go-sql-driver/mysql"
)

func DB() (*sql.DB, error) {
    // 1. Load Aiven CA certificate
    caCertPath := "api/aiven-ca.pem"
    caCert, err := os.ReadFile(caCertPath)
    if err != nil {
        return nil, fmt.Errorf("cannot read CA file: %w", err)
    }

    rootCertPool := x509.NewCertPool()
    rootCertPool.AppendCertsFromPEM(caCert)

    // 2. Register TLS config
    err = mysql.RegisterTLSConfig("aiven", &tls.Config{
        RootCAs: rootCertPool,
    })
    if err != nil {
        return nil, fmt.Errorf("cannot register TLS: %w", err)
    }

    // 3. Build DSN
    dsn := fmt.Sprintf(
        "%s:%s@tcp(%s:%s)/%s?parseTime=true&tls=aiven",
        os.Getenv("MYSQL_USER"),
        os.Getenv("MYSQL_PASSWORD"),
        os.Getenv("MYSQL_HOST"),
        os.Getenv("MYSQL_PORT"),
        os.Getenv("MYSQL_DATABASE"),
    )

    db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil

}
