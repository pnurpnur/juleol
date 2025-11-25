import mysql from "mysql2/promise";

export async function query(sql: string, params?: any[]) {
  console.log("🔵 DB QUERY:", sql);
  console.log("🔵 DB PARAMS:", params);

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST!,
    port: Number(process.env.MYSQL_PORT!),
    user: process.env.MYSQL_USER!,
    password: process.env.MYSQL_PASSWORD!,
    database: process.env.MYSQL_DATABASE!,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const [rows] = await connection.execute(sql, params);
    console.log("🟢 DB RESULT:", rows);
    return rows;
  } catch (err) {
    console.error("🔴 DB ERROR:", err);
    throw err;
  } finally {
    await connection.end();
  }
}
