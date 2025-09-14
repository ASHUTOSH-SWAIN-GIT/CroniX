import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../services/api";
import type { Job, JobLog } from "../types/api";
import { getRefreshInterval, formatCronExpression } from "../utils/cronParser";

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

const IconCopy = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// Log Detail Dialog Component
const LogDetailDialog = ({
  isOpen,
  onClose,
  log,
  job,
}: {
  isOpen: boolean;
  onClose: () => void;
  log: JobLog | null;
  job: Job | null;
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen || !log) return null;

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Execution Details
            </h3>
            <p className="text-sm text-neutral-400">
              {job?.name} • {formatTimestamp(log.started_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <IconX className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-1">Status</div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    log.status
                  )}`}
                >
                  {log.status.toUpperCase()}
                </span>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-1">
                  Response Code
                </div>
                <div
                  className={`text-lg font-semibold ${getResponseCodeColor(
                    log.response_code
                  )}`}
                >
                  {log.response_code
                    ? `HTTP ${Number(log.response_code)}`
                    : "N/A"}
                </div>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-1">Duration</div>
                <div className="text-lg font-semibold text-white">
                  {log.duration_ms ? `${log.duration_ms}ms` : "N/A"}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-1">Started At</div>
                <div className="text-white font-mono text-sm">
                  {formatTimestamp(log.started_at)}
                </div>
              </div>
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-1">Finished At</div>
                <div className="text-white font-mono text-sm">
                  {log.finished_at ? formatTimestamp(log.finished_at) : "N/A"}
                </div>
              </div>
            </div>

            {/* Job Details */}
            {job && (
              <div className="bg-neutral-800/50 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-3">Job Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">
                      Endpoint
                    </div>
                    <div className="text-white font-mono text-sm break-all">
                      {job.method} {job.endpoint}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">
                      Schedule
                    </div>
                    <div className="text-white font-mono text-sm">
                      {job.schedule}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Details */}
            {log.error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-red-400 font-medium">Error Details</div>
                  <button
                    onClick={() => copyToClipboard(log.error || "", "error")}
                    className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                  >
                    {copied === "error" ? (
                      <IconCheck className="w-3 h-3" />
                    ) : (
                      <IconCopy className="w-3 h-3" />
                    )}
                    <span>{copied === "error" ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap break-words bg-red-950/20 p-3 rounded border border-red-500/20">
                  {log.error}
                </pre>
              </div>
            )}

            {/* Response Body */}
            {log.response_body && (
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-neutral-300 font-medium">
                    Response Body
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        typeof log.response_body === "string"
                          ? log.response_body
                          : JSON.stringify(log.response_body, null, 2),
                        "response"
                      )
                    }
                    className="flex items-center space-x-1 px-2 py-1 bg-neutral-600/20 text-neutral-300 rounded text-xs hover:bg-neutral-600/30 transition-colors"
                  >
                    {copied === "response" ? (
                      <IconCheck className="w-3 h-3" />
                    ) : (
                      <IconCopy className="w-3 h-3" />
                    )}
                    <span>{copied === "response" ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <pre className="text-neutral-300 text-sm font-mono whitespace-pre-wrap break-words bg-neutral-900/50 p-3 rounded border border-neutral-600/50 max-h-60 overflow-y-auto">
                  {typeof log.response_body === "string"
                    ? log.response_body
                    : JSON.stringify(log.response_body, null, 2)}
                </pre>
              </div>
            )}

            {/* Log ID */}
            <div className="bg-neutral-800/50 rounded-lg p-4">
              <div className="text-sm text-neutral-400 mb-1">Log ID</div>
              <div className="flex items-center justify-between">
                <div className="text-white font-mono text-sm">{log.id}</div>
                <button
                  onClick={() => copyToClipboard(log.id, "id")}
                  className="flex items-center space-x-1 px-2 py-1 bg-neutral-600/20 text-neutral-300 rounded text-xs hover:bg-neutral-600/30 transition-colors"
                >
                  {copied === "id" ? (
                    <IconCheck className="w-3 h-3" />
                  ) : (
                    <IconCopy className="w-3 h-3" />
                  )}
                  <span>{copied === "id" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Logs() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedLog, setSelectedLog] = useState<JobLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [justExecuted, setJustExecuted] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10000); // Default 10 seconds
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const jobData = await apiClient.getJob(id);
        setJob(jobData);

        // Calculate refresh interval based on job schedule
        const interval = getRefreshInterval(jobData.schedule);
        setRefreshInterval(interval);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch job");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Fetch logs (always returns the 5 most recent)
  const fetchLogs = async () => {
    if (!id) return;

    setLogsLoading(true);
    try {
      const logsData = await apiClient.getJobLogs(id);
      setLogs(logsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  // Set up auto-refresh with dynamic interval based on job schedule
  useEffect(() => {
    if (id && refreshInterval) {
      // Clear all cache for this job to ensure fresh data
      apiClient.clearJobCache(id);

      fetchLogs(); // Fetch the 5 most recent logs

      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set up new interval with calculated refresh rate
      intervalRef.current = setInterval(() => {
        fetchLogs();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [id, refreshInterval]);

  // Auto-refresh when page loads (useful when navigating from Jobs page after Run Now)
  useEffect(() => {
    if (id) {
      // Refresh logs after a short delay to ensure the job has completed
      const timeout = setTimeout(() => {
        fetchLogs();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [id]);

  // Run job manually
  const runJob = async () => {
    if (!id) return;

    setRunning(true);
    setJustExecuted(true);
    try {
      await apiClient.runJob(id);
      // Clear cache and refresh logs immediately
      apiClient.clearJobCache(id);
      // Wait a moment for the job to complete, then fetch logs
      setTimeout(() => {
        fetchLogs();
        setJustExecuted(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run job");
      setJustExecuted(false);
    } finally {
      setRunning(false);
    }
  };

  // Open log detail dialog
  const openLogDialog = (log: JobLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  // Close log detail dialog
  const closeLogDialog = () => {
    setDialogOpen(false);
    setSelectedLog(null);
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
              onClick={() => fetchLogs()}
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
                <div className="text-white font-medium">
                  {formatCronExpression(job.schedule)}
                </div>
                <div className="text-xs text-neutral-500">{job.schedule}</div>
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
                  (Recent Logs)
                </span>
              </h2>
              <div className="flex items-center space-x-4">
                {justExecuted && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Job executed, refreshing...</span>
                  </div>
                )}
                <div className="text-sm text-neutral-400">
                  Auto-refreshes every{" "}
                  {refreshInterval < 1000
                    ? `${refreshInterval}ms`
                    : refreshInterval < 60000
                    ? `${Math.round(refreshInterval / 1000)}s`
                    : `${Math.round(refreshInterval / 60000)}m`}
                </div>
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
                    onClick={() => openLogDialog(log)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 cursor-pointer hover:bg-neutral-700 hover:border-neutral-600 transition-all duration-200 hover:shadow-lg"
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
                            HTTP {Number(log.response_code)}
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

                    {/* Click indicator */}
                    <div className="mt-3 text-xs text-neutral-500 text-center">
                      Click to view detailed information
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Simple logs count */}
            {logs.length > 0 && (
              <div className="mt-6 text-center">
                <div className="text-sm text-neutral-400">
                  Showing {logs.length} most recent logs
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Detail Dialog */}
      <LogDetailDialog
        isOpen={dialogOpen}
        onClose={closeLogDialog}
        log={selectedLog}
        job={job}
      />
    </div>
  );
}
