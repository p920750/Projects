"use client";
import React, { useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Idle");
  const [logs, setLogs] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const runPatch = async () => {
    setStatus("Scanning...");
    setLogs((prev) => [...prev, "Initiating CVE-2026-2137 security scan..."]);
    try {
      const res = await fetch(`${API_URL}/scan-and-patch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: "p920750/PatchForge", issueId: "CVE-2026-2137" }),
      });
      const data = await res.json();
      setStatus("Completed");
      setLogs((prev) => [...prev, `Patch generated cleanly. Run ID: ${data.runId}`]);
    } catch (err) {
      setStatus("Error");
      setLogs((prev) => [...prev, "Failed to connect to PatchForge backend server."]);
    }
  };

  return (
    <div style={{ padding: "clamp(16px, 4vw, 40px)", fontFamily: "sans-serif", background: "#0f172a", color: "#f8fafc", minHeight: "100vh", boxSizing: "border-box", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: "bold", marginBottom: "8px", wordBreak: "break-word", overflowWrap: "anywhere" }}>
          PatchForge Audit & Monitor
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "24px", wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: "1.5" }}>
          Real-time vulnerability detection, Daytona sandbox runner, and Qodo review logs.
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "20px", marginBottom: "24px", width: "100%", boxSizing: "border-box" }}>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", width: "100%" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "12px", wordBreak: "break-word", overflowWrap: "anywhere" }}>Agent Control Panel</h2>
            <p style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
              <strong>Status:</strong> <span style={{ color: status === "Completed" ? "#4ade80" : status === "Error" ? "#ef4444" : "#facc15" }}>{status}</span>
            </p>
            <button 
              onClick={runPatch} 
              style={{ 
                marginTop: "16px", 
                padding: "10px 16px", 
                background: "#3b82f6", 
                color: "#fff", 
                border: "none", 
                borderRadius: "6px", 
                cursor: "pointer",
                width: "100%",
                maxWidth: "240px",
                fontWeight: "600"
              }}
            >
              Execute Scan & Patch
            </button>
          </div>

          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", width: "100%" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "12px", wordBreak: "break-word", overflowWrap: "anywhere" }}>Active Target</h2>
            <p style={{ wordBreak: "break-word", overflowWrap: "anywhere", margin: "6px 0" }}><strong>Repository:</strong> p920750/PatchForge</p>
            <p style={{ wordBreak: "break-word", overflowWrap: "anywhere", margin: "6px 0" }}><strong>Target CVE:</strong> CVE-2026-2137</p>
            <p style={{ wordBreak: "break-word", overflowWrap: "anywhere", margin: "6px 0" }}><strong>Harness:</strong> TrueForge (Daytona Sandbox Enforced)</p>
          </div>
        </div>

        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "8px", border: "1px solid #334155", boxSizing: "border-box", width: "100%" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "12px", wordBreak: "break-word", overflowWrap: "anywhere" }}>Execution Audit Logs</h2>
          <div style={{ background: "#020617", padding: "12px", borderRadius: "6px", fontFamily: "monospace", fontSize: "14px", minHeight: "100px", overflowX: "auto", wordBreak: "break-all" }}>
            {logs.length === 0 ? (
              <p style={{ color: "#64748b", margin: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}>No actions triggered yet.</p>
            ) : (
              logs.map((log, i) => <p key={i} style={{ margin: "4px 0", color: "#38bdf8", wordBreak: "break-word", overflowWrap: "anywhere" }}>{log}</p>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
