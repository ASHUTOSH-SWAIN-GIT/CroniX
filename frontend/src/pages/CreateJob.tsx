import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CreateJobRequest, UpdateJobRequest, Job } from "../types/api.js";
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

// User-friendly schedule options
const SCHEDULE_PRESETS = [
  {
    category: "Frequent",
    options: [
      {
        label: "Every minute",
        value: "0 * * * * *",
        description: "Runs every minute",
      },
      {
        label: "Every 5 minutes",
        value: "0 */5 * * * *",
        description: "Runs every 5 minutes",
      },
      {
        label: "Every 15 minutes",
        value: "0 */15 * * * *",
        description: "Runs every 15 minutes",
      },
      {
        label: "Every 30 minutes",
        value: "0 */30 * * * *",
        description: "Runs every 30 minutes",
      },
    ],
  },
  {
    category: "Hourly",
    options: [
      {
        label: "Every hour",
        value: "0 0 * * * *",
        description: "Runs at the top of every hour",
      },
      {
        label: "Every 2 hours",
        value: "0 0 */2 * * *",
        description: "Runs every 2 hours",
      },
      {
        label: "Every 6 hours",
        value: "0 0 */6 * * *",
        description: "Runs every 6 hours",
      },
      {
        label: "Every 12 hours",
        value: "0 0 */12 * * *",
        description: "Runs every 12 hours",
      },
    ],
  },
  {
    category: "Daily",
    options: [
      {
        label: "Daily at midnight",
        value: "0 0 0 * * *",
        description: "Runs every day at 12:00 AM",
      },
      {
        label: "Daily at 6 AM",
        value: "0 0 6 * * *",
        description: "Runs every day at 6:00 AM",
      },
      {
        label: "Daily at noon",
        value: "0 0 12 * * *",
        description: "Runs every day at 12:00 PM",
      },
      {
        label: "Daily at 6 PM",
        value: "0 0 18 * * *",
        description: "Runs every day at 6:00 PM",
      },
    ],
  },
  {
    category: "Weekly",
    options: [
      {
        label: "Every Monday at 9 AM",
        value: "0 0 9 * * 1",
        description: "Runs every Monday at 9:00 AM",
      },
      {
        label: "Every Friday at 5 PM",
        value: "0 0 17 * * 5",
        description: "Runs every Friday at 5:00 PM",
      },
      {
        label: "Weekdays at 9 AM",
        value: "0 0 9 * * 1-5",
        description: "Runs Monday to Friday at 9:00 AM",
      },
      {
        label: "Weekends at 10 AM",
        value: "0 0 10 * * 0,6",
        description: "Runs Saturday and Sunday at 10:00 AM",
      },
    ],
  },
  {
    category: "Monthly",
    options: [
      {
        label: "1st of every month",
        value: "0 0 0 1 * *",
        description: "Runs on the 1st of every month at midnight",
      },
      {
        label: "15th of every month",
        value: "0 0 0 15 * *",
        description: "Runs on the 15th of every month at midnight",
      },
      {
        label: "Last day of month",
        value: "0 0 0 L * *",
        description: "Runs on the last day of every month",
      },
    ],
  },
];

// Custom schedule builder options
const CUSTOM_SCHEDULE_OPTIONS = {
  frequency: [
    { label: "Minutes", value: "minutes" },
    { label: "Hours", value: "hours" },
    { label: "Days", value: "days" },
    { label: "Weeks", value: "weeks" },
    { label: "Months", value: "months" },
  ],
  intervals: {
    minutes: [1, 2, 3, 5, 10, 15, 20, 30, 45],
    hours: [1, 2, 3, 4, 6, 8, 12],
    days: [1, 2, 3, 7, 14, 30],
    weeks: [1, 2, 4],
    months: [1, 2, 3, 6, 12],
  },
};

export default function CreateJob() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
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

  // Schedule configuration state
  const [scheduleMode, setScheduleMode] = useState<
    "preset" | "custom" | "advanced"
  >("custom");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customFrequency, setCustomFrequency] = useState<string>("hours");
  const [customInterval, setCustomInterval] = useState<number>(1);
  const [customTime, setCustomTime] = useState<string>("09:00");
  const [customDays, setCustomDays] = useState<string[]>([]);

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

  // Load existing job data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadJob = async () => {
        try {
          setInitialLoading(true);
          const job = await apiClient.getJob(id);

          // Parse headers from JSON string
          let headersString = "";
          if (job.headers) {
            try {
              const headersObj = JSON.parse(job.headers);
              headersString = Object.entries(headersObj)
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n");
            } catch (e) {
              headersString = job.headers;
            }
          }

          setFormData({
            name: job.name,
            schedule: job.schedule,
            endpoint: job.endpoint,
            method: job.method,
            headers: headersString,
            body: job.body || "",
            timeout: 30, // Default values for fields not in Job type
            retries: 3,
            active: job.active,
          });

          // Set schedule mode based on the cron expression
          if (
            SCHEDULE_PRESETS.some((category) =>
              category.options.some((option) => option.value === job.schedule)
            )
          ) {
            setScheduleMode("preset");
            setSelectedPreset(job.schedule);
          } else {
            setScheduleMode("advanced");
          }
        } catch (error) {
          console.error("Failed to load job:", error);
          navigate("/dashboard/jobs");
        } finally {
          setInitialLoading(false);
        }
      };

      loadJob();
    }
  }, [isEditMode, id, navigate]);

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

      if (isEditMode && id) {
        // Update existing job
        const updateData: UpdateJobRequest = {
          name: formData.name,
          schedule: formData.schedule,
          endpoint: formData.endpoint,
          method: formData.method,
          headers: parsedHeaders,
          body: formData.body.trim() || undefined,
          active: formData.active,
        };

        await apiClient.updateJob(id, updateData);
      } else {
        // Create new job
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
      }

      // Redirect back to jobs page
      navigate("/dashboard/jobs");
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} job:`,
        error
      );
      setErrors({
        name:
          error instanceof Error
            ? error.message
            : `Failed to ${isEditMode ? "update" : "create"} job`,
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

  // Helper function to generate cron expression from custom settings
  const generateCustomCron = (): string => {
    const [hours, minutes] = customTime.split(":").map(Number);

    switch (customFrequency) {
      case "minutes":
        return `0 */${customInterval} * * * *`;
      case "hours":
        return `0 ${minutes} */${customInterval} * * *`;
      case "days":
        return `0 ${minutes} ${hours} */${customInterval} * *`;
      case "weeks":
        if (customDays.length === 0) return `0 ${minutes} ${hours} * * 0`; // Default to Sunday
        return `0 ${minutes} ${hours} * * ${customDays.join(",")}`;
      case "months":
        return `0 ${minutes} ${hours} 1 */${customInterval} *`;
      default:
        return "0 * * * * *";
    }
  };

  // Helper function to get human-readable schedule description
  const getScheduleDescription = (cronExpression: string): string => {
    const preset = SCHEDULE_PRESETS.flatMap((cat) => cat.options).find(
      (p) => p.value === cronExpression
    );
    if (preset) return preset.description;

    // Try to generate description for custom schedules
    const parts = cronExpression.split(" ");
    if (parts.length === 5) {
      const [min, hour, day, month, weekday] = parts;

      if (
        min.startsWith("*/") &&
        hour === "*" &&
        day === "*" &&
        month === "*" &&
        weekday === "*"
      ) {
        const interval = min.substring(2);
        return `Runs every ${interval} minutes`;
      }

      if (
        min !== "*" &&
        hour.startsWith("*/") &&
        day === "*" &&
        month === "*" &&
        weekday === "*"
      ) {
        const interval = hour.substring(2);
        return `Runs every ${interval} hours at minute ${min}`;
      }
    }

    return `Custom schedule: ${cronExpression}`;
  };

  const insertScheduleExample = (schedule: string) => {
    setFormData((prev) => ({ ...prev, schedule }));
    setSelectedPreset(schedule);
  };

  const handlePresetSelect = (schedule: string) => {
    setFormData((prev) => ({ ...prev, schedule }));
    setSelectedPreset(schedule);
    setScheduleMode("preset");
  };

  const handleCustomScheduleUpdate = () => {
    const cronExpression = generateCustomCron();
    setFormData((prev) => ({ ...prev, schedule: cronExpression }));
    setScheduleMode("custom");
  };

  const handleAdvancedScheduleChange = (schedule: string) => {
    setFormData((prev) => ({ ...prev, schedule }));
    setScheduleMode("advanced");
  };

  const testEndpoint = async () => {
    if (!formData.endpoint.trim()) {
      setTestResult({
        success: false,
        message: "Please enter an endpoint URL first",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Parse headers if provided
      let headers: Record<string, string> = {};
      if (formData.headers.trim()) {
        try {
          headers = JSON.parse(formData.headers);
        } catch {
          setTestResult({
            success: false,
            message: "Invalid JSON format for headers",
          });
          setTesting(false);
          return;
        }
      }

      // Call backend to perform the test server-side (avoids CORS)
      const result = await apiClient.testJobEndpoint({
        endpoint: formData.endpoint,
        method: formData.method,
        headers,
        body: formData.body.trim() || undefined,
      });

      setTestResult({
        success: result.status >= 200 && result.status < 300,
        message: `Request completed with status ${result.status} ${result.status_text}`,
        data: {
          status: result.status,
          statusText: result.status_text,
          headers: result.headers,
          body: result.body,
        },
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setTesting(false);
    }
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
          <h1 className="text-3xl font-bold mb-2">
            {isEditMode ? "Edit Job" : "Create New Job"}
          </h1>
          <p className="text-neutral-400">
            {isEditMode
              ? "Update your cron job configuration"
              : "Set up a new cron job to automatically hit your endpoint"}
          </p>
        </div>

        {initialLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-400">Loading job data...</p>
            </div>
          </div>
        ) : (
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
                    onChange={(e) =>
                      handleInputChange("method", e.target.value)
                    }
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

              {/* Schedule Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Choose how to set your schedule
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("custom")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scheduleMode === "custom"
                        ? "bg-white text-black"
                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                    }`}
                  >
                    Custom Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("preset")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scheduleMode === "preset"
                        ? "bg-white text-black"
                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                    }`}
                  >
                    Quick Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("advanced")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scheduleMode === "advanced"
                        ? "bg-white text-black"
                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                    }`}
                  >
                    Advanced (Cron)
                  </button>
                </div>
              </div>

              {/* Preset Schedules */}
              {scheduleMode === "preset" && (
                <div className="space-y-6">
                  {SCHEDULE_PRESETS.map((category) => (
                    <div key={category.category}>
                      <h3 className="text-lg font-medium text-white mb-3">
                        {category.category}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {category.options.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handlePresetSelect(option.value)}
                            className={`text-left p-4 rounded-lg border transition-all ${
                              selectedPreset === option.value
                                ? "border-white bg-white/10"
                                : "border-neutral-700 bg-neutral-800 hover:border-neutral-600 hover:bg-neutral-750"
                            }`}
                          >
                            <div className="font-medium text-white mb-1">
                              {option.label}
                            </div>
                            <div className="text-neutral-400 text-sm">
                              {option.description}
                            </div>
                            <div className="text-neutral-500 text-xs mt-1 font-mono">
                              {option.value}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Schedule Builder */}
              {scheduleMode === "custom" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Frequency
                      </label>
                      <select
                        value={customFrequency}
                        onChange={(e) => {
                          setCustomFrequency(e.target.value);
                          setCustomInterval(1);
                          setCustomDays([]);
                        }}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                      >
                        {CUSTOM_SCHEDULE_OPTIONS.frequency.map((freq) => (
                          <option key={freq.value} value={freq.value}>
                            {freq.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Interval
                      </label>
                      <select
                        value={customInterval}
                        onChange={(e) =>
                          setCustomInterval(Number(e.target.value))
                        }
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                      >
                        {CUSTOM_SCHEDULE_OPTIONS.intervals[
                          customFrequency as keyof typeof CUSTOM_SCHEDULE_OPTIONS.intervals
                        ]?.map((interval) => (
                          <option key={interval} value={interval}>
                            Every {interval} {customFrequency}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(customFrequency === "hours" ||
                    customFrequency === "days" ||
                    customFrequency === "weeks" ||
                    customFrequency === "months") && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                  )}

                  {customFrequency === "weeks" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "0", label: "Sunday" },
                          { value: "1", label: "Monday" },
                          { value: "2", label: "Tuesday" },
                          { value: "3", label: "Wednesday" },
                          { value: "4", label: "Thursday" },
                          { value: "5", label: "Friday" },
                          { value: "6", label: "Saturday" },
                        ].map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              setCustomDays((prev) =>
                                prev.includes(day.value)
                                  ? prev.filter((d) => d !== day.value)
                                  : [...prev, day.value]
                              );
                            }}
                            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                              customDays.includes(day.value)
                                ? "bg-white text-black"
                                : "bg-neutral-800 text-white hover:bg-neutral-700"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCustomScheduleUpdate}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Generate Schedule
                  </button>
                </div>
              )}

              {/* Advanced Cron Input */}
              {scheduleMode === "advanced" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cron Expression *
                    </label>
                    <div className="flex items-center space-x-3">
                      <IconClock className="w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.schedule}
                        onChange={(e) =>
                          handleAdvancedScheduleChange(e.target.value)
                        }
                        placeholder="* * * * *"
                        className={`flex-1 px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-mono ${
                          errors.schedule
                            ? "border-red-500"
                            : "border-neutral-700"
                        }`}
                      />
                    </div>
                    {errors.schedule && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.schedule}
                      </p>
                    )}
                    <p className="text-neutral-500 text-sm mt-2">
                      Format: minute hour day month day-of-week
                    </p>
                  </div>
                </div>
              )}

              {/* Schedule Preview */}
              {formData.schedule && (
                <div className="mt-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <IconClock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">
                      Schedule Preview
                    </span>
                  </div>
                  <div className="text-sm text-neutral-300 mb-1">
                    {getScheduleDescription(formData.schedule)}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono">
                    {formData.schedule}
                  </div>
                </div>
              )}
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
                        errors.endpoint
                          ? "border-red-500"
                          : "border-neutral-700"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={testEndpoint}
                      disabled={testing || !formData.endpoint.trim()}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {testing ? "Testing..." : "Test"}
                    </button>
                  </div>
                  {errors.endpoint && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.endpoint}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Request Headers (JSON)
                  </label>
                  <textarea
                    value={formData.headers}
                    onChange={(e) =>
                      handleInputChange("headers", e.target.value)
                    }
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                    rows={3}
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-600 font-mono text-sm ${
                      errors.headers ? "border-red-500" : "border-neutral-700"
                    }`}
                  />
                  {errors.headers && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.headers}
                    </p>
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
                      onChange={(e) =>
                        handleInputChange("body", e.target.value)
                      }
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

            {/* Test Result */}
            {testResult && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Test Result</h2>
                <div
                  className={`p-4 rounded-lg ${
                    testResult.success
                      ? "bg-green-500/20 border border-green-500/50"
                      : "bg-red-500/20 border border-red-500/50"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className={`text-sm font-medium ${
                        testResult.success ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {testResult.success ? "Success" : "Failed"}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {testResult.message}
                    </span>
                  </div>
                  {testResult.data && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-neutral-300 hover:text-white mb-2">
                          View Response Details
                        </summary>
                        <pre className="bg-neutral-800 p-3 rounded text-xs text-neutral-300 overflow-auto max-h-64">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      handleInputChange(
                        "timeout",
                        parseInt(e.target.value) || 30
                      )
                    }
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white focus:outline-none focus:border-neutral-600 ${
                      errors.timeout ? "border-red-500" : "border-neutral-700"
                    }`}
                  />
                  {errors.timeout && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.timeout}
                    </p>
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
                      handleInputChange(
                        "retries",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white focus:outline-none focus:border-neutral-600 ${
                      errors.retries ? "border-red-500" : "border-neutral-700"
                    }`}
                  />
                  {errors.retries && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.retries}
                    </p>
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
                    Schedule Configuration Tips
                  </h3>
                  <div className="space-y-2 text-neutral-400 text-sm">
                    <p>
                      <strong className="text-white">Custom Builder:</strong>{" "}
                      Create your own schedule by selecting frequency, interval,
                      and time.
                    </p>
                    <p>
                      <strong className="text-white">Quick Presets:</strong>{" "}
                      Choose from common scheduling patterns like "Every hour"
                      or "Daily at 6 AM".
                    </p>
                    <p>
                      <strong className="text-white">Advanced Mode:</strong> For
                      power users who want to write cron expressions directly.
                    </p>
                    <p className="text-neutral-500 text-xs mt-3">
                      The schedule preview shows exactly when your job will run.
                      All times are in UTC.
                    </p>
                  </div>
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
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Job"
                  : "Create Job"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
