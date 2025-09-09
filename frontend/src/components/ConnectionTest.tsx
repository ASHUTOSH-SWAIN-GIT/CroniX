import { useState } from "react";
import { apiClient } from "../services/api";

export default function ConnectionTest() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.testConnection();
      setResult(`✅ Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Backend Connection Test</h3>

      <button
        onClick={testConnection}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Connection"}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-neutral-800 rounded-lg">
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
