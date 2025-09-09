import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

export default function UserBadge() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/profile", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !profile) return null;

  const displayName = profile.name || profile.email;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/70 backdrop-blur px-3 py-2">
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span className="text-sm text-white">{displayName}</span>
    </div>
  );
}
