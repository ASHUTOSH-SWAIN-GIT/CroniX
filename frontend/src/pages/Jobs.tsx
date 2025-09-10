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

const IconX = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  jobName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobName: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Delete Job</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <IconX className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <p className="text-neutral-300 mb-2">
          Are you sure you want to delete this job?
        </p>
        <p className="text-neutral-400 text-sm mb-6">
          <span className="font-medium">"{jobName}"</span> will be permanently
          removed and cannot be recovered.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    job: Job | null;
  }>({
    isOpen: false,
    job: null,
  });

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

  const handleDeleteClick = (job: Job) => {
    setDeleteDialog({ isOpen: true, job });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.job) return;

    try {
      await apiClient.deleteJob(deleteDialog.job.id);
      setJobs(jobs.filter((job) => job.id !== deleteDialog.job!.id));
      setDeleteDialog({ isOpen: false, job: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      job.name.toLowerCase().includes(searchLower) ||
      job.endpoint.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 bg-neutral-800 rounded w-32"></div>
                <div className="h-4 bg-neutral-800 rounded w-48"></div>
              </div>
              <div className="h-10 bg-neutral-800 rounded w-32"></div>
            </div>
            <div className="h-10 bg-neutral-800 rounded w-80"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="border border-neutral-800 rounded-xl p-6 bg-neutral-900">
            <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
            <p className="text-neutral-400 mb-4">{error}</p>
            <button
              onClick={fetchJobs}
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
    <>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Jobs</h1>
              <p className="text-neutral-400">
                Manage your cron jobs and schedules
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard/jobs/create")}
              className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
            >
              <IconPlus className="w-4 h-4" />
              <span>Create Job</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative w-full max-w-md">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconClock className="w-6 h-6 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? "No jobs found" : "No jobs yet"}
              </h3>
              <p className="text-neutral-400 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Create your first cron job to get started"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/dashboard/jobs/create")}
                  className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                >
                  <IconPlus className="w-4 h-4" />
                  <span>Create Job</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-neutral-800 bg-neutral-900 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-white truncate">
                          <button
                            className="hover:underline text-left"
                            onClick={() =>
                              navigate(`/dashboard/jobs/${job.id}/logs`)
                            }
                          >
                            {job.name}
                          </button>
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs bg-neutral-800 text-neutral-300 shrink-0">
                          {job.active ? "Active" : "Inactive"}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs bg-neutral-800 text-neutral-300 shrink-0">
                          {job.method}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-neutral-400">
                          <IconGlobe className="w-4 h-4 shrink-0" />
                          <span className="truncate">{job.endpoint}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-neutral-400">
                          <IconClock className="w-4 h-4 shrink-0" />
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

                    <div className="flex items-center space-x-2 ml-6 shrink-0">
                      <button
                        onClick={() => toggleJobStatus(job.id, job.active)}
                        className="p-2.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                        title={job.active ? "Pause job" : "Start job"}
                      >
                        {job.active ? <IconPause /> : <IconPlay />}
                      </button>

                      <button
                        className="p-2.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                        title="Edit job"
                      >
                        <IconEdit />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(job)}
                        className="p-2.5 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, job: null })}
        onConfirm={confirmDelete}
        jobName={deleteDialog.job?.name || ""}
      />
    </>
  );
}
