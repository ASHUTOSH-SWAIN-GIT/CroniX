import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CreateJobRequest } from "../types/api.js";
import { apiClient } from "../services/api";

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

const IconInfo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01" />
    <path d="M11 12h1v4h1" />
  </svg>
);

type JobFormData = {
  name: string;
  schedule: string;
  endpoint: string;
  method: string;
  headers: string;
  body: string;
  timeout: number;
  retries: number;
  active: boolean;
};

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

const SCHEDULE_EXAMPLES = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 2 AM", value: "0 2 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every month on the 1st", value: "0 0 1 * *" },
];

export default function CreateJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    name: "",
    schedule: "",
    endpoint: "",
    method: "GET",
    headers: "",
    body: "",
    timeout: 30,
    retries: 3,
    active: true,
  });

  const [errors, setErrors] = useState<Partial<JobFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<JobFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Job name is required";
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = "Schedule is required";
    }

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = "Endpoint URL is required";
    } else {
      try {
        new URL(formData.endpoint);
      } catch {
        newErrors.endpoint = "Please enter a valid URL";
      }
    }

    if (formData.timeout < 1 || formData.timeout > 300) {
      newErrors.timeout = "Timeout must be between 1 and 300 seconds";
    }

    if (formData.retries < 0 || formData.retries > 10) {
      newErrors.retries = "Retries must be between 0 and 10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Parse headers if provided
      let parsedHeaders: Record<string, string> | undefined;
      if (formData.headers.trim()) {
        try {
          parsedHeaders = JSON.parse(formData.headers);
        } catch {
          setErrors({ headers: "Invalid JSON format for headers" });
          setLoading(false);
          return;
        }
      }

      const jobData: CreateJobRequest = {
        name: formData.name,
        schedule: formData.schedule,
        endpoint: formData.endpoint,
        method: formData.method,
        headers: parsedHeaders,
        body: formData.body.trim() || undefined,
        active: formData.active,
      };

      await apiClient.createJob(jobData);

      // Redirect back to jobs page
      navigate("/dashboard/jobs");
    } catch (error) {
      console.error("Failed to create job:", error);
      setErrors({
        name: error instanceof Error ? error.message : "Failed to create job",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof JobFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const insertScheduleExample = (schedule: string) => {
    setFormData((prev) => ({ ...prev, schedule }));
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate("/dashboard/jobs")}
            className="flex items-center space-x-2 text-neutral-400 hover:text-white transition-colors"
          >
            <IconArrowLeft />
            <span>Back to Jobs</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Job</h1>
          <p className="text-neutral-400">
            Set up a new cron job to automatically hit your endpoint
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Daily Backup"
                  className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 ${
                    errors.name ? "border-red-500" : "border-neutral-700"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  HTTP Method *
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => handleInputChange("method", e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                >
                  {HTTP_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              Schedule Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cron Schedule *
                </label>
                <div className="flex items-center space-x-3">
                  <IconClock className="w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) =>
                      handleInputChange("schedule", e.target.value)
                    }
                    placeholder="* * * * *"
                    className={`flex-1 px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 ${
                      errors.schedule ? "border-red-500" : "border-neutral-700"
                    }`}
                  />
                </div>
                {errors.schedule && (
                  <p className="text-red-400 text-sm mt-1">{errors.schedule}</p>
                )}
                <p className="text-neutral-500 text-sm mt-2">
                  Format: minute hour day month day-of-week
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Common Schedules
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SCHEDULE_EXAMPLES.map((example) => (
                    <button
                      key={example.value}
                      type="button"
                      onClick={() => insertScheduleExample(example.value)}
                      className="text-left px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm hover:bg-neutral-700 transition-colors"
                    >
                      <div className="font-medium text-white">
                        {example.label}
                      </div>
                      <div className="text-neutral-400 text-xs">
                        {example.value}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint Configuration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              Endpoint Configuration
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Endpoint URL *
                </label>
                <div className="flex items-center space-x-3">
                  <IconGlobe className="w-4 h-4 text-neutral-400" />
                  <input
                    type="url"
                    value={formData.endpoint}
                    onChange={(e) =>
                      handleInputChange("endpoint", e.target.value)
                    }
                    placeholder="https://api.example.com/webhook"
                    className={`flex-1 px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 ${
                      errors.endpoint ? "border-red-500" : "border-neutral-700"
                    }`}
                  />
                </div>
                {errors.endpoint && (
                  <p className="text-red-400 text-sm mt-1">{errors.endpoint}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Request Headers (JSON)
                </label>
                <textarea
                  value={formData.headers}
                  onChange={(e) => handleInputChange("headers", e.target.value)}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  rows={3}
                  className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-mono text-sm ${
                    errors.headers ? "border-red-500" : "border-neutral-700"
                  }`}
                />
                {errors.headers && (
                  <p className="text-red-400 text-sm mt-1">{errors.headers}</p>
                )}
                <p className="text-neutral-500 text-sm mt-1">
                  Optional: JSON object with custom headers
                </p>
              </div>

              {(formData.method === "POST" ||
                formData.method === "PUT" ||
                formData.method === "PATCH") && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Request Body
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => handleInputChange("body", e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-mono text-sm"
                  />
                  <p className="text-neutral-500 text-sm mt-1">
                    Optional: JSON payload for POST/PUT/PATCH requests
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Advanced Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={formData.timeout}
                  onChange={(e) =>
                    handleInputChange("timeout", parseInt(e.target.value) || 30)
                  }
                  className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white focus:outline-none focus:border-neutral-600 ${
                    errors.timeout ? "border-red-500" : "border-neutral-700"
                  }`}
                />
                {errors.timeout && (
                  <p className="text-red-400 text-sm mt-1">{errors.timeout}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.retries}
                  onChange={(e) =>
                    handleInputChange("retries", parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white focus:outline-none focus:border-neutral-600 ${
                    errors.retries ? "border-red-500" : "border-neutral-700"
                  }`}
                />
                {errors.retries && (
                  <p className="text-red-400 text-sm mt-1">{errors.retries}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    handleInputChange("active", e.target.checked)
                  }
                  className="w-4 h-4 text-white bg-neutral-800 border-neutral-700 rounded focus:ring-neutral-600"
                />
                <span className="text-sm font-medium">
                  Activate job immediately after creation
                </span>
              </label>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <IconInfo className="w-4 h-4 text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium mb-2">
                  Need help with cron schedules?
                </h3>
                <p className="text-neutral-400 text-sm mb-3">
                  Cron uses a 5-field format: minute (0-59), hour (0-23), day of
                  month (1-31), month (1-12), day of week (0-7, where 0 and 7
                  are Sunday).
                </p>
                <p className="text-neutral-400 text-sm">
                  Use <code className="bg-neutral-800 px-1 rounded">*</code> for
                  "any value",{" "}
                  <code className="bg-neutral-800 px-1 rounded">*/5</code> for
                  "every 5", and{" "}
                  <code className="bg-neutral-800 px-1 rounded">1,3,5</code> for
                  "1, 3, and 5".
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard/jobs")}
              className="px-6 py-3 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
