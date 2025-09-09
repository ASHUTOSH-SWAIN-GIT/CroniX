import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {!profile && !error && (
        <p className="text-neutral-400">Loading profile…</p>
      )}
      {error && <div className="text-red-400">{error}. Please sign in.</div>}
      {profile && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 max-w-lg">
          <p className="text-neutral-300 text-sm mb-2">Signed in as</p>
          <p className="text-lg font-semibold">{profile.email}</p>
          {profile.name && (
            <p className="text-neutral-400 mt-1">Name: {profile.name}</p>
          )}
        </div>
      )}
    </div>
  );
}
