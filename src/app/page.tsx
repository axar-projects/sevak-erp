// src/app/page.tsx
import { getUsers } from "@/actions/user-actions";
import UserList from "@/components/UserList";
import Link from "next/link"; // In case we want a CTA for empty state

export default async function Home() {
  const users = await getUsers();

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <UserList users={users} />
      </div>
    </main>
  );
}