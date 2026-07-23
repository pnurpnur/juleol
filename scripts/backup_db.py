"""
Full logical backup of the juleol MySQL database.

Reads DATABASE_URL from .env.local (or the environment) and writes a
timestamped .sql file to db/backups/ containing CREATE TABLE + INSERT
statements for every table. Safe, read-only against the database.

Usage:
    py scripts/backup_db.py
"""
import os
import re
import sys
import datetime
import pymysql


def load_database_url():
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("DATABASE_URL not found in env or .env.local")


def parse_url(url):
    # mysql://user:pass@host:port/db
    m = re.match(r"mysql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)", url)
    if not m:
        raise SystemExit("Could not parse DATABASE_URL")
    user, password, host, port, db = m.groups()
    return dict(user=user, password=password, host=host, port=int(port), db=db)


def sql_value(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (bytes, bytearray)):
        return "0x" + v.hex()
    if isinstance(v, (datetime.datetime, datetime.date)):
        return "'" + str(v) + "'"
    s = str(v).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
    return "'" + s + "'"


def main():
    cfg = parse_url(load_database_url())
    conn = pymysql.connect(
        host=cfg["host"], port=cfg["port"], user=cfg["user"],
        password=cfg["password"], database=cfg["db"], charset="utf8mb4",
    )
    cur = conn.cursor()

    out_dir = os.path.join(os.path.dirname(__file__), "..", "db", "backups")
    os.makedirs(out_dir, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = os.path.abspath(os.path.join(out_dir, f"backup_{cfg['db']}_{ts}.sql"))

    cur.execute("SHOW TABLES")
    tables = [r[0] for r in cur.fetchall()]

    total_rows = 0
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"-- Backup of `{cfg['db']}` taken {ts}\n")
        f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
        for t in tables:
            cur.execute(f"SHOW CREATE TABLE `{t}`")
            create = cur.fetchone()[1]
            f.write(f"-- ----- Table: {t} -----\n")
            f.write("DROP TABLE IF EXISTS `%s`;\n" % t)
            f.write(create + ";\n\n")

            cur.execute(f"SELECT * FROM `{t}`")
            cols = [d[0] for d in cur.description]
            rows = cur.fetchall()
            total_rows += len(rows)
            if rows:
                collist = ", ".join(f"`{c}`" for c in cols)
                for row in rows:
                    vals = ", ".join(sql_value(v) for v in row)
                    f.write(f"INSERT INTO `{t}` ({collist}) VALUES ({vals});\n")
                f.write("\n")
        f.write("SET FOREIGN_KEY_CHECKS=1;\n")

    print(f"Backup written to: {out_path}")
    print(f"Tables: {len(tables)}  Total rows: {total_rows}")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        print(f"  {t}: {cur.fetchone()[0]} rows")

    conn.close()


if __name__ == "__main__":
    main()
