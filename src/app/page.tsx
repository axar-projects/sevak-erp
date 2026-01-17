// src/app/page.tsx
import { getUsers } from "@/actions/user-actions";
import UserList from "@/components/UserList";
import Link from "next/link"; // In case we want a CTA for empty state

export default async function Home() {
  const users = await getUsers();

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Registered Sevaks</h1>
            <span className="inline-flex items-center rounded-md border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
                Total: {users.length}
            </span>
        </div>
        
        <UserList users={users} />
      </div>
    </main>
  );
}