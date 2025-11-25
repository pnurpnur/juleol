import { auth } from "@/auth";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return <div>Du må være innlogget.</div>;
  }

  return <div>Hei {session.user.name}! Du er innlogget.</div>;
}
