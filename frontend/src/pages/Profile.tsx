import { useEffect, useState } from "react";
import { apiClient } from "../services/api";

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient.getProfile();
        setProfile(data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-48 mb-6"></div>
            <div className="bg-neutral-900 rounded-xl p-8">
              <div className="space-y-4">
                <div className="h-4 bg-neutral-800 rounded w-1/4"></div>
                <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                <div className="h-4 bg-neutral-800 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>
          <div className="bg-neutral-900 rounded-xl p-8 text-center">
            <p className="text-neutral-400">
              Failed to load profile information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.name || profile.email;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>

        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 px-8 py-6 border-b border-neutral-700">
            <div className="flex items-center gap-6">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/20">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">
                  {displayName}
                </h2>
                <p className="text-neutral-400">{profile.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                      Email Address
                    </label>
                    <p className="text-white">{profile.email}</p>
                  </div>

                  {profile.name && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-1">
                        Display Name
                      </label>
                      <p className="text-white">{profile.name}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                      Member Since
                    </label>
                    <p className="text-white">
                      {formatDate(profile.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Account Actions
                </h3>
                <div className="space-y-4">
                  <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                    <h4 className="text-white font-medium mb-2">Sign Out</h4>
                    <p className="text-neutral-400 text-sm mb-4">
                      Sign out of your account and return to the login page.
                    </p>
                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      {signingOut ? (
                        <>
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Signing Out...
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
