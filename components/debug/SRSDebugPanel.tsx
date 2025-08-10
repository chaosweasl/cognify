/**
 * Debug panel component for troubleshooting SRS and database issues
 * Add this to your study page to get real-time debugging information
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  checkDatabaseHealth,
  DatabaseHealthResult,
} from "@/utils/debug/databaseHealth";

interface SRSDebugPanelProps {
  userId?: string;
  projectId?: string;
  srsStates?: Record<string, unknown>;
  studySession?: Record<string, unknown>;
  onTestDatabase?: () => Promise<void>;
}

export default function SRSDebugPanel({
  userId,
  projectId,
  srsStates,
  studySession,
}: SRSDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [healthCheck, setHealthCheck] = useState<DatabaseHealthResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console errors and logs
  useEffect(() => {
    const originalError = console.error;
    const originalLog = console.log;

    console.error = (...args) => {
      setLogs((prev) => [...prev.slice(-20), `[ERROR] ${args.join(" ")}`]);
      originalError(...args);
    };

    console.log = (...args) => {
      const message = args.join(" ");
      if (message.includes("[SRS-DB]") || message.includes("[DailyStats]")) {
        setLogs((prev) => [...prev.slice(-20), `[LOG] ${message}`]);
      }
      originalLog(...args);
    };

    return () => {
      console.error = originalError;
      console.log = originalLog;
    };
  }, []);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const result = await checkDatabaseHealth();
      setHealthCheck(result);
    } catch (error) {
      console.error("Health check failed:", error);
    }
    setIsLoading(false);
  };

  const runDatabaseTest = async () => {
    setIsLoading(true);
    try {
      // Database test functionality removed - requires server-side code
      setLogs((prev) => [
        ...prev,
        "[TEST] Database test feature disabled (requires server environment)",
      ]);
    } catch (error) {
      console.error("Database test failed:", error);
    }
    setIsLoading(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-sm btn-outline bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
        >
          🐛 Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] overflow-auto">
      <div className="card border-red-300 bg-red-50 shadow-lg">
        <div className="card-body pb-2">
          <div className="text-sm flex justify-between items-center card-title">
            🐛 SRS Debug Panel
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-sm h-6 w-6 p-0"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Status Info */}
            <div className="space-y-1">
              <div className="font-medium">Status</div>
              <div>User ID: {userId || "Not set"}</div>
              <div>Project ID: {projectId || "Not set"}</div>
              <div>
                SRS States: {srsStates ? Object.keys(srsStates).length : 0}
              </div>
              <div>Study Session: {studySession ? "✅" : "❌"}</div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="font-medium">Actions</div>
              <div className="flex gap-2">
                <button
                  onClick={runHealthCheck}
                  disabled={isLoading}
                  className="btn btn-sm btn-outline text-xs"
                >
                  Health Check
                </button>
                <button
                  onClick={runDatabaseTest}
                  disabled={isLoading}
                  className="btn btn-sm btn-outline text-xs"
                >
                  Test DB
                </button>
                <button
                  onClick={clearLogs}
                  className="btn btn-sm btn-outline text-xs"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Health Check Results */}
            {healthCheck && (
              <div className="space-y-1">
                <div className="font-medium">Health Check</div>
                <span
                  className={`badge ${
                    healthCheck.status === "healthy"
                      ? "badge-success"
                      : healthCheck.status === "warning"
                      ? "badge-warning"
                      : "badge-error"
                  }`}
                >
                  {healthCheck.status}
                </span>
                <div className="max-h-20 overflow-auto bg-white p-1 rounded border">
                  {healthCheck.checks.map((check, idx) => (
                    <div key={idx} className="text-xs">
                      {check.status === "pass"
                        ? "✅"
                        : check.status === "warning"
                        ? "⚠️"
                        : "❌"}{" "}
                      {check.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="space-y-1">
              <div className="font-medium">Recent Logs</div>
              <div className="max-h-32 overflow-auto bg-white p-1 rounded border font-mono">
                {logs.length === 0 ? (
                  <div className="text-gray-500">No logs yet...</div>
                ) : (
                  logs.map((log, idx) => (
                    <div
                      key={idx}
                      className="text-xs border-b last:border-b-0 py-1"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-1">
              <div className="font-medium">Troubleshooting</div>
              <div className="text-xs text-gray-600">
                • Check browser console for detailed errors
                <br />
                • Verify you&apos;re logged in
                <br />
                • Check network tab for failed requests
                <br />
                • Make sure database tables exist
                <br />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
