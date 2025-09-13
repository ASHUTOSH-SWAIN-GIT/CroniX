import { useState, useEffect } from "react";
import { apiClient, getAuthToken, removeAuthToken } from "../services/api";

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export default function UserBadge() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .getProfile()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        // Token might be invalid, remove it
        removeAuthToken();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-neutral-700 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="w-8 h-8 rounded-full border border-neutral-600"
        />
      ) : (
        <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {user.name?.charAt(0)?.toUpperCase() ||
              user.email?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      )}
      <div className="hidden sm:block">
        <div className="text-sm font-medium text-white">
          {user.name || user.email}
        </div>
      </div>
    </div>
  );
}
