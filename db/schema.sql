-- USERS (Google OAuth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,         -- Google "sub" ID
    name VARCHAR(128),
    email VARCHAR(256) UNIQUE
);

-- EVENTS (Flere konkurranser)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,         -- F.eks. "Juleøl 2025"
    owner_id VARCHAR(64) NOT NULL,      -- Bruker som opprettet eventet
    is_open BOOLEAN DEFAULT TRUE,       -- Lukkes når konkurransen er ferdig
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE beer_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL
);

CREATE TABLE abv_ranges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(32) NOT NULL
);

CREATE TABLE beer_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(64) NOT NULL
);

-- BEERS (Øl for et event)
CREATE TABLE IF NOT EXISTS beers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    beer_option_id INT NOT NULL,
    abv_range_id INT,
    beer_type_id INT,

    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (beer_option_id) REFERENCES beer_options(id),
    FOREIGN KEY (abv_range_id) REFERENCES abv_ranges(id),
    FOREIGN KEY (beer_type_id) REFERENCES beer_types(id)
);

-- GUESSES (Svar levert av deltaker)
CREATE TABLE IF NOT EXISTS guesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    beer_id INT NOT NULL,

    guessed_beer_option_id INT,
    guessed_abv_range_id INT,
    guessed_type_id INT,
    rating INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (beer_id) REFERENCES beers(id),
    FOREIGN KEY (guessed_beer_option_id) REFERENCES beer_options(id),
    FOREIGN KEY (guessed_abv_range_id) REFERENCES abv_ranges(id),
    FOREIGN KEY (guessed_type_id) REFERENCES beer_types(id)
);

CREATE TABLE event_beer_options (
    event_id INT NOT NULL,
    beer_option_id INT NOT NULL,
    PRIMARY KEY (event_id, beer_option_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (beer_option_id) REFERENCES beer_options(id)
);

CREATE TABLE event_abv_ranges (
    event_id INT NOT NULL,
    abv_range_id INT NOT NULL,
    PRIMARY KEY (event_id, abv_range_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (abv_range_id) REFERENCES abv_ranges(id)
);