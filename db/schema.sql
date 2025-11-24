CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128),
    email VARCHAR(256) UNIQUE
);

CREATE TABLE beers (
    id INT PRIMARY KEY,
    name VARCHAR(128),
    abv_range VARCHAR(32),
    type VARCHAR(64)
);

CREATE TABLE guesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64),
    beer_id INT,
    guessed_beer VARCHAR(128),
    guessed_abv_range VARCHAR(32),
    guessed_type VARCHAR(64),
    rating INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (beer_id) REFERENCES beers(id)
);
