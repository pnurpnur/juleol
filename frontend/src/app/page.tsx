export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Juleølsmaking 🎄🍺</h1>
      <a
        href="/api/auth_login"
        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded"
      >
        Logg inn med Google
      </a>
    </main>
  );
}
