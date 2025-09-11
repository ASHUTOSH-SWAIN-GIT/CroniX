import { useEffect, useState, useRef } from "react";
import { apiClient } from "../services/api";

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

export default function UserBadge() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const data = await apiClient.getProfile();
        if (isMounted) setProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      console.log("Attempting to sign out...");

      await apiClient.logout();

      console.log("Logout successful");

      // Clear any cached data
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.clear();
      }

      // Clear cache from our cache manager
      apiClient.clearCache();

      // Redirect to login page
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      // Still redirect even if API call fails
      window.location.href = "/";
    }
  };

  if (loading || !profile) return null;

  const displayName = profile.name || profile.email;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 rounded-xl bg-neutral-900/70 backdrop-blur px-3 py-2 hover:bg-neutral-800/70 transition-colors"
      >
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
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
