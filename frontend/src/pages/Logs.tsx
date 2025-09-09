import { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import type { Job, JobLog } from "../types/api";

export default function Logs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsData = await apiClient.getJobs(100, 0);
        setJobs(jobsData);
        if (jobsData.length > 0 && !selectedJobId) {
          setSelectedJobId(jobsData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      }
    };
    fetchJobs();
  }, [selectedJobId]);

  // Fetch logs when selected job changes
  useEffect(() => {
    if (selectedJobId) {
      fetchLogs();
    }
  }, [selectedJobId]);

  // Auto-refresh logs every 5 seconds
  useEffect(() => {
    if (selectedJobId) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedJobId]);

  const fetchLogs = async () => {
    if (!selectedJobId) return;

    setLoading(true);
    try {
      const logsData = await apiClient.getJobLogs(selectedJobId, 100, 0);
      console.log("Fetched logs:", logsData);
      console.log("Logs length:", logsData.length);
      setLogs(logsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "failure":
        return "text-red-400";
      default:
        return "text-neutral-400";
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">Logs</h1>

        {/* Job Selection */}
        <div className="mb-6">
          <label
            htmlFor="job-select"
            className="block text-sm font-medium text-neutral-300 mb-2"
          >
            Select Job
          </label>
          <select
            id="job-select"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a job...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name} ({job.schedule})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Logs Display */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900">
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Execution Logs
                {selectedJobId && (
                  <span className="text-sm font-normal text-neutral-400 ml-2">
                    ({logs.length} entries)
                  </span>
                )}
              </h2>
              {selectedJobId && (
                <button
                  onClick={fetchLogs}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {!selectedJobId ? (
              <p className="text-neutral-400 text-center py-8">
                Select a job to view its execution logs
              </p>
            ) : logs.length === 0 ? (
              <div className="text-neutral-400 text-center py-8">
                <p>No logs found for this job</p>
                <p className="text-xs mt-2">
                  Debug: selectedJobId = {selectedJobId}
                </p>
                <p className="text-xs">
                  Debug: logs array length = {logs.length}
                </p>
                <p className="text-xs">
                  Debug: logs = {JSON.stringify(logs, null, 2)}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-neutral-800 rounded-lg p-4 border border-neutral-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span
                          className={`font-medium ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status.toUpperCase()}
                        </span>
                        {log.response_code && (
                          <span
                            className={`text-sm ${getResponseCodeColor(
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
                        <p className="text-red-400 text-sm font-mono">
                          {log.error}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-neutral-500 mt-2">
                      Finished: {formatTimestamp(log.finished_at || "")}
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
