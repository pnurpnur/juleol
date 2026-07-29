"""
Migration: richer beer model.

- beer_options gains: brewery, beer_type_id (FK -> beer_types), abv DECIMAL(4,2)
- abv_ranges gains:   min_abv, max_abv DECIMAL(4,2)  (numeric bounds for auto-placement)

Backfill:
- abv_ranges min/max parsed from the existing label (e.g. "5,0–7,9%" -> 5.0 / 7.9)
- beer_options: split "Brewery - Name" -> brewery + name (first " - " only)
- beer_options.beer_type_id: taken from the beer's fasit row in `beers` where unique

Idempotent: safe to re-run (checks columns before adding, only backfills NULLs).
Run:  py scripts/migrate_beer_model.py
"""
import re
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
import pymysql

url = open(".env.local", encoding="utf-8").read()
m = re.search(r"mysql://([^:]+):([^@]+)@([^:/]+):(\d+)/(\S+)", url)
u, p, h, port, db = m.groups()
db = db.strip()
conn = pymysql.connect(host=h, port=int(port), user=u, password=p, database=db, charset="utf8mb4", autocommit=False)
cur = conn.cursor()


def col_exists(table, col):
    cur.execute(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME=%s AND COLUMN_NAME=%s",
        (db, table, col),
    )
    return cur.fetchone()[0] > 0


def add_col(table, col, ddl):
    if col_exists(table, col):
        print(f"  = {table}.{col} already exists")
    else:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {ddl}")
        print(f"  + added {table}.{col}")


print("== 1. Schema ==")
add_col("beer_options", "brewery", "brewery VARCHAR(128) NULL AFTER id")
add_col("beer_options", "beer_type_id", "beer_type_id INT NULL")
add_col("beer_options", "abv", "abv DECIMAL(4,2) NULL")
add_col("abv_ranges", "min_abv", "min_abv DECIMAL(4,2) NULL")
add_col("abv_ranges", "max_abv", "max_abv DECIMAL(4,2) NULL")

# FK for beer_options.beer_type_id (add once)
cur.execute(
    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=%s AND TABLE_NAME='beer_options' AND CONSTRAINT_NAME='fk_beeropt_type'",
    (db,),
)
if cur.fetchone()[0] == 0:
    cur.execute("ALTER TABLE beer_options ADD CONSTRAINT fk_beeropt_type FOREIGN KEY (beer_type_id) REFERENCES beer_types(id)")
    print("  + added FK fk_beeropt_type")
else:
    print("  = FK fk_beeropt_type already exists")

conn.commit()

print("== 2. Backfill abv_ranges bounds ==")
cur.execute("SELECT id, label, min_abv, max_abv FROM abv_ranges")
for rid, label, mn, mx in cur.fetchall():
    if mn is not None and mx is not None:
        print(f"  = range {rid} already has bounds")
        continue
    # label like "5,0–7,9%" (norwegian comma, en-dash). Extract two numbers.
    nums = re.findall(r"\d+[.,]?\d*", label.replace("%", ""))
    if len(nums) >= 2:
        lo = float(nums[0].replace(",", "."))
        hi = float(nums[1].replace(",", "."))
        cur.execute("UPDATE abv_ranges SET min_abv=%s, max_abv=%s WHERE id=%s", (lo, hi, rid))
        print(f"  + range {rid} '{label}' -> {lo} / {hi}")
    else:
        print(f"  ! range {rid} '{label}' — could not parse, left NULL")
conn.commit()

print("== 3. Backfill beer_options brewery/name split ==")
cur.execute("SELECT id, name, brewery FROM beer_options")
for oid, name, brewery in cur.fetchall():
    if brewery:
        continue  # already split
    if " - " in name:
        brew, rest = name.split(" - ", 1)
        cur.execute("UPDATE beer_options SET brewery=%s, name=%s WHERE id=%s", (brew.strip(), rest.strip(), oid))
        print(f"  + {oid}: '{name}' -> brewery='{brew.strip()}', name='{rest.strip()}'")
conn.commit()

print("== 4. Backfill beer_options.beer_type_id from fasit ==")
# Each option used in beers gets its fasit type (only where a single distinct type exists).
cur.execute(
    """
    UPDATE beer_options bo
    JOIN (
        SELECT beer_option_id, MIN(beer_type_id) AS t, COUNT(DISTINCT beer_type_id) AS c
        FROM beers GROUP BY beer_option_id
    ) x ON x.beer_option_id = bo.id AND x.c = 1
    SET bo.beer_type_id = x.t
    WHERE bo.beer_type_id IS NULL
    """
)
print(f"  + backfilled type on {cur.rowcount} beer_options")
conn.commit()

print("== Done. Final state ==")
cur.execute("SELECT id, brewery, name, beer_type_id, abv FROM beer_options ORDER BY id LIMIT 8")
for r in cur.fetchall():
    print("  ", r)
cur.execute("SELECT id, label, min_abv, max_abv FROM abv_ranges ORDER BY id")
for r in cur.fetchall():
    print("  ", r)
conn.close()
