import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../services/api";
import type { Job, JobLog } from "../types/api";

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

const IconCheckCircle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </svg>
);

const IconXCircle = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </svg>
);

const IconActivity = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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
  const [recentLogs, setRecentLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile, jobs, and recent logs in parallel
        const [profileData, jobsData] = await Promise.all([
          apiClient.getProfile(),
          apiClient.getJobs(10, 0), // Get first 10 jobs
        ]);

        setProfile(profileData);
        setJobs(jobsData);

        // Fetch recent logs for all jobs (limit to 20 most recent)
        if (jobsData.length > 0) {
          const allLogs: JobLog[] = [];
          for (const job of jobsData.slice(0, 5)) {
            // Get logs for first 5 jobs
            try {
              const logs = await apiClient.getJobLogs(job.id); // Gets 5 most recent logs
              allLogs.push(...logs);
            } catch (err) {
              console.warn(`Failed to fetch logs for job ${job.id}:`, err);
            }
          }

          // Sort by started_at and take most recent
          const sortedLogs = allLogs
            .sort(
              (a, b) =>
                new Date(b.started_at).getTime() -
                new Date(a.started_at).getTime()
            )
            .slice(0, 10);

          setRecentLogs(sortedLogs);
        }
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
  const totalExecutions = recentLogs.length;
  const successRate =
    recentLogs.length > 0
      ? Math.round(
          (recentLogs.filter((log) => log.status === "success").length /
            recentLogs.length) *
            100
        )
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "running":
        return "text-blue-400";
      default:
        return "text-neutral-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <IconCheckCircle />;
      case "error":
        return <IconXCircle />;
      default:
        return <IconClock />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-900 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
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
    <div className="p-8">
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
            to="/dashboard/jobs"
            className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            <IconPlus />
            <span>New Job</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <IconClock className="text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{jobs.length}</span>
            </div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">
              Total Jobs
            </h3>
            <p className="text-xs text-neutral-500">{activeJobs} active</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <IconCheckCircle className="text-green-400" />
              </div>
              <span className="text-2xl font-bold">{totalExecutions}</span>
            </div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">
              Recent Executions
            </h3>
            <p className="text-xs text-neutral-500">Last 10 executions</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <IconActivity className="text-purple-400" />
              </div>
              <span className="text-2xl font-bold">{successRate}%</span>
            </div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">
              Success Rate
            </h3>
            <p className="text-xs text-neutral-500">Recent executions</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <IconClock className="text-orange-400" />
              </div>
              <span className="text-2xl font-bold">
                {recentLogs.length > 0
                  ? Math.round(
                      recentLogs.reduce(
                        (acc, log) => acc + (log.duration_ms || 0),
                        0
                      ) / recentLogs.length
                    )
                  : 0}
                ms
              </span>
            </div>
            <h3 className="text-sm font-medium text-neutral-300 mb-1">
              Avg Duration
            </h3>
            <p className="text-xs text-neutral-500">Recent executions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Jobs */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Jobs</h2>
              <Link
                to="/dashboard/jobs"
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-neutral-800"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{job.name}</h3>
                    <p className="text-sm text-neutral-400">{job.endpoint}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {job.schedule}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
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
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-400 mb-4">No jobs created yet</p>
                  <Link
                    to="/dashboard/jobs"
                    className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                  >
                    <IconPlus />
                    <span>Create your first job</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <Link
                to="/dashboard/logs"
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center space-x-4 p-4 rounded-lg bg-neutral-800"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      log.status === "success"
                        ? "bg-green-500/20"
                        : log.status === "error"
                        ? "bg-red-500/20"
                        : "bg-blue-500/20"
                    }`}
                  >
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      Job execution {log.status}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {new Date(log.started_at).toLocaleString()}
                    </p>
                    {log.response_code && (
                      <p className="text-xs text-neutral-500">
                        Response: {log.response_code} • {log.duration_ms}ms
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${getStatusColor(
                      log.status
                    )}`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connection Test removed */}
      </div>
    </div>
  );
}
