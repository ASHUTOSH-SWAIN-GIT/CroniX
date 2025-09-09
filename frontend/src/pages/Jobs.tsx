import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Job } from "../types/api.js";
import { apiClient } from "../services/api";

// Icons
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

const IconPlay = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const IconPause = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const IconEdit = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="3,6 5,6 21,6" />
    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
  </svg>
);

const IconClock = ({ className = "w-4 h-4" }: { className?: string }) => (
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

const IconGlobe = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconFilter = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </svg>
);

const IconSearch = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobsData = await apiClient.getJobs();
      setJobs(jobsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await apiClient.updateJob(jobId, { active: !currentStatus });
      // Update local state
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, active: !currentStatus } : job
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update job status"
      );
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await apiClient.deleteJob(jobId);
      // Update local state
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && job.active) ||
      (statusFilter === "inactive" && !job.active);
    return matchesSearch && matchesStatus;
  });

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-500/20 text-blue-400";
      case "POST":
        return "bg-green-500/20 text-green-400";
      case "PUT":
        return "bg-yellow-500/20 text-yellow-400";
      case "DELETE":
        return "bg-red-500/20 text-red-400";
      case "PATCH":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-neutral-500/20 text-neutral-400";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-32 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-neutral-900 rounded-xl"></div>
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
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
            <h1 className="text-3xl font-bold mb-2">Jobs</h1>
            <p className="text-neutral-400">
              Manage your cron jobs and schedules
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard/jobs/create")}
            className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            <IconPlus />
            <span>Create Job</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div className="flex items-center space-x-2">
            <IconFilter className="w-4 h-4 text-neutral-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neutral-600"
            >
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconClock className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-neutral-400 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first cron job to get started"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={() => navigate("/dashboard/jobs/create")}
                className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
              >
                <IconPlus />
                <span>Create Job</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        {job.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-neutral-500/20 text-neutral-400"
                        }`}
                      >
                        {job.active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(
                          job.method
                        )}`}
                      >
                        {job.method}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-neutral-400">
                        <IconGlobe className="w-4 h-4" />
                        <span className="truncate">{job.endpoint}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-neutral-400">
                        <IconClock className="w-4 h-4" />
                        <span>{job.schedule}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-neutral-500">
                      Created {new Date(job.created_at).toLocaleDateString()}
                      {job.updated_at !== job.created_at && (
                        <span>
                          {" "}
                          • Updated{" "}
                          {new Date(job.updated_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleJobStatus(job.id, job.active)}
                      className={`p-2 rounded-lg transition-colors ${
                        job.active
                          ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                      title={job.active ? "Pause job" : "Start job"}
                    >
                      {job.active ? <IconPause /> : <IconPlay />}
                    </button>

                    <button
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Edit job"
                    >
                      <IconEdit />
                    </button>

                    <button
                      onClick={() => deleteJob(job.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete job"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
