import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import type { Job, JobLog } from "../types/api";

// Icons
const IconArrowLeft = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
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

const IconRefresh = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15" />
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
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
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12,2a15.3,15.3,0,0,1,4,10,15.3,15.3,0,0,1-4,10,15.3,15.3,0,0,1-4-10A15.3,15.3,0,0,1,12,2Z" />
  </svg>
);

export default function Logs() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const jobData = await apiClient.getJob(id);
        setJob(jobData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch job");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Fetch logs
  const fetchLogs = async () => {
    if (!id) return;

    setLogsLoading(true);
    try {
      const logsData = await apiClient.getJobLogs(id, 100, 0);
      setLogs(logsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch logs on mount and set up auto-refresh
  useEffect(() => {
    if (id) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [id]);

  // Run job manually
  const runJob = async () => {
    if (!id) return;

    setRunning(true);
    try {
      await apiClient.runJob(id);
      // Refresh logs after running
      setTimeout(fetchLogs, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run job");
    } finally {
      setRunning(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "failure":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/30";
    }
  };

  const getResponseCodeColor = (code: number | null) => {
    if (!code) return "text-neutral-400";
    if (code >= 200 && code < 300) return "text-green-400";
    if (code >= 400 && code < 500) return "text-yellow-400";
    if (code >= 500) return "text-red-400";
    return "text-neutral-400";
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-neutral-400">Loading job details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-400 mb-4">
                {error || "Job not found"}
              </div>
              <button
                onClick={() => navigate("/dashboard/jobs")}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg"
              >
                Back to Jobs
              </button>
            </div>
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/dashboard/jobs")}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <IconArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">{job.name}</h1>
              <p className="text-neutral-400">Execution Logs</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 text-white rounded-lg transition-colors"
            >
              <IconRefresh className={logsLoading ? "animate-spin" : ""} />
              <span>{logsLoading ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button
              onClick={runJob}
              disabled={running}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
            >
              <IconPlay />
              <span>{running ? "Running..." : "Run Now"}</span>
            </button>
          </div>
        </div>

        {/* Job Info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <IconClock className="w-5 h-5 text-neutral-400" />
              <div>
                <div className="text-sm text-neutral-400">Schedule</div>
                <div className="text-white font-medium">{job.schedule}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <IconGlobe className="w-5 h-5 text-neutral-400" />
              <div>
                <div className="text-sm text-neutral-400">Endpoint</div>
                <div className="text-white font-medium">
                  {job.method} {job.endpoint}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  job.active ? "bg-green-400" : "bg-neutral-400"
                }`}
              />
              <div>
                <div className="text-sm text-neutral-400">Status</div>
                <div className="text-white font-medium">
                  {job.active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Execution History
                <span className="text-sm font-normal text-neutral-400 ml-2">
                  ({logs.length} entries)
                </span>
              </h2>
              <div className="text-sm text-neutral-400">
                Auto-refreshes every 10 seconds
              </div>
            </div>
          </div>

          <div className="p-6">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-neutral-400 mb-4">
                  No execution logs yet
                </div>
                <div className="text-sm text-neutral-500">
                  This job hasn't been executed yet. Click "Run Now" to trigger
                  it manually.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                        {log.response_code && (
                          <span
                            className={`text-sm font-medium ${getResponseCodeColor(
                              log.response_code
                            )}`}
                          >
                            HTTP {log.response_code}
                          </span>
                        )}
                        {log.duration_ms && (
                          <span className="text-sm text-neutral-400">
                            {log.duration_ms}ms
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {formatTimestamp(log.started_at)}
                      </div>
                    </div>

                    {log.error && (
                      <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded">
                        <div className="text-red-400 text-sm font-medium mb-1">
                          Error:
                        </div>
                        <p className="text-red-300 text-sm font-mono">
                          {log.error}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
                      <div>Started: {formatTimestamp(log.started_at)}</div>
                      {log.finished_at && (
                        <div>Finished: {formatTimestamp(log.finished_at)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
