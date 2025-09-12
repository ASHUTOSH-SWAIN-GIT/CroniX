import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../services/api";
import type { Job } from "../types/api";

type Profile = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
};

// Icons
const IconClock = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconPlus = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile and jobs
        const [profileData, jobsData] = await Promise.all([
          apiClient.getProfile(),
          apiClient.getJobs(5, 0), // Get first 5 jobs only
        ]);

        setProfile(profileData);
        setJobs(jobsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeJobs = jobs.filter((job) => job.active).length;

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-900 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-neutral-900 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-neutral-800 rounded-xl p-6 bg-neutral-900">
            <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
            <p className="text-neutral-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-neutral-400">
              Welcome back, {profile?.name || profile?.email}
            </p>
          </div>
          <Link
            to="/dashboard/jobs/create"
            className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            <IconPlus />
            <span>Create Job</span>
          </Link>
        </div>

        {/* Simple Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {jobs.length}
            </div>
            <div className="text-neutral-400">Total Jobs</div>
            <div className="text-sm text-green-400 mt-1">
              {activeJobs} active
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {activeJobs}
            </div>
            <div className="text-neutral-400">Active Jobs</div>
            <div className="text-sm text-neutral-500 mt-1">Running now</div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {jobs.length - activeJobs}
            </div>
            <div className="text-neutral-400">Inactive Jobs</div>
            <div className="text-sm text-neutral-500 mt-1">Paused</div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Jobs</h2>
            <Link
              to="/dashboard/jobs"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              View all
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconClock className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No jobs yet
              </h3>
              <p className="text-neutral-400 mb-6">
                Create your first cron job to get started
              </p>
              <Link
                to="/dashboard/jobs/create"
                className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                <IconPlus />
                <span>Create your first job</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/dashboard/jobs/${job.id}/logs`}
                  className="block p-4 rounded-lg bg-neutral-800 hover:bg-neutral-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-white">{job.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-neutral-500/20 text-neutral-400"
                          }`}
                        >
                          {job.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400">{job.endpoint}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {job.schedule}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
