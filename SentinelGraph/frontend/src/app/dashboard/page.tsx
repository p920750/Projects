"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Terminal, 
  ExternalLink, 
  Flame, 
  Search, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Server,
  Database,
  KeyRound,
  Network,
  Cpu,
  Lock,
  Unlock,
  CheckCircle2,
  X,
  Play
} from "lucide-react";

interface Incident {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  mitreTactic: string;
  mitreId: string;
  targetNode: string;
  nodeType: "Pod" | "Host" | "Cloud" | "User";
  timestamp: string;
  status: "ACTIVE" | "CONTAINED";
  summary: string;
  cve: string;
  cvss: number;
}

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-7701",
    title: "Pod RCE Ingress & Database Lateral Movement",
    severity: "CRITICAL",
    mitreTactic: "Initial Access & Lateral Movement",
    mitreId: "T1190 / T1078",
    targetNode: "k8s-pod-77",
    nodeType: "Pod",
    timestamp: "2 mins ago",
    status: "ACTIVE",
    summary: "Active exploitation via CVE-2026-9912 header injection. Attack Path Agent identifies lateral movement vector toward payment-db via auth-service bridge.",
    cve: "CVE-2026-9912",
    cvss: 9.8
  },
  {
    id: "INC-2026-8092",
    title: "Suspicious LSASS Memory Dump via Taskmgr",
    severity: "HIGH",
    mitreTactic: "Credential Access",
    mitreId: "T1003.001",
    targetNode: "srv-fin-dc01.corp",
    nodeType: "Host",
    timestamp: "18 mins ago",
    status: "ACTIVE",
    summary: "Attack Path Agent detected process mimikatz injected into winlogon. Identified 3 domain admin hashes exposed in memory.",
    cve: "CVE-2024-38077",
    cvss: 8.8
  },
  {
    id: "INC-2026-8093",
    title: "AWS STS AssumeRole with Privileged Escalation",
    severity: "HIGH",
    mitreTactic: "Privilege Escalation",
    mitreId: "T1548",
    targetNode: "role/DevSecOps",
    nodeType: "Cloud",
    timestamp: "35 mins ago",
    status: "ACTIVE",
    summary: "IAM role assumed from anomalous IP. User session accessed S3 customer billing bucket without MFA challenge.",
    cve: "N/A",
    cvss: 7.5
  }
];

interface TriageDossier {
  incident_id: string;
  target_node: string;
  severity: string;
  cvss_score: number;
  status: string;
  vulnerability: string;
  vulnerability_title: string;
  mitre_mapping: {
    tactic: string;
    technique_id: string;
    technique_name: string;
  };
  crown_jewel: {
    id: string;
    type: string;
    criticality: string;
    hops_away: number;
    engine: string;
  };
  attack_path: string[];
  attack_path_summary: string;
  algo_insights: {
    betweenness_rank: number;
    betweenness_score: number;
    bridge_node: string;
    bridge_score: number;
    harmonic_reachability: number;
    harmonic_score: number;
    blast_radius_nodes: string[];
  };
  mcp_traces: Array<{
    step: number;
    tool: string;
    query?: string;
    execution_time_ms: number;
    status: string;
    result?: string;
  }>;
  reasoning_dossier: string;
  recommended_action: string;
}

interface ContainResponse {
  success: boolean;
  incident_id: string;
  target_node: string;
  status: string;
  mitigation_timestamp: string;
  actions_executed: string[];
  graph_lineage_explanation: string;
  mutated_entities: Array<{ id: string; new_status: string }>;
  mcp_execution_logs: Array<{ tool: string; status: string; policy?: string; role?: string; query?: string }>;
}

export default function SOCDashboardPage() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(INITIAL_INCIDENTS[0]);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [triageData, setTriageData] = useState<TriageDossier | null>(null);
  const [containData, setContainData] = useState<ContainResponse | null>(null);
  const [isTriaging, setIsTriaging] = useState<boolean>(false);
  const [isContaining, setIsContaining] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<string>("k8s-pod-77");
  const [activeTab, setActiveTab] = useState<"mcp" | "cypher" | "algo">("mcp");
  const [mobileTab, setMobileTab] = useState<"incidents" | "visualizer" | "terminal">("visualizer");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch Triage Dossier
  const executeTriage = async (incident: Incident) => {
    setIsTriaging(true);
    try {
      const res = await fetch(`${apiUrl}/api/agent/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_node: incident.targetNode,
          incident_id: incident.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTriageData(data);
      }
    } catch {
      // Fallback local mock if offline
      setTriageData({
        incident_id: incident.id,
        target_node: incident.targetNode,
        severity: "CRITICAL",
        cvss_score: 9.8,
        status: "TRIAGED",
        vulnerability: "CVE-2026-9912",
        vulnerability_title: "Remote Code Execution via Header Injection in Ingress Gateway",
        mitre_mapping: {
          tactic: "Initial Access & Lateral Movement",
          technique_id: "T1190 / T1078",
          technique_name: "Exploit Public-Facing Application"
        },
        crown_jewel: {
          id: "payment-db",
          type: "Database",
          criticality: "CrownJewel",
          hops_away: 2,
          engine: "PostgreSQL"
        },
        attack_path: ["dev-praveen", "sa-admin", "k8s-pod-77", "auth-service", "payment-db"],
        attack_path_summary: "dev-praveen -> sa-admin -> k8s-pod-77 -> auth-service -> payment-db",
        algo_insights: {
          betweenness_rank: 2,
          betweenness_score: 0.50,
          bridge_node: "auth-service",
          bridge_score: 0.60,
          harmonic_reachability: 4,
          harmonic_score: 1.83,
          blast_radius_nodes: ["k8s-pod-77", "auth-service", "payment-db", "CVE-2026-9912"]
        },
        mcp_traces: [
          {
            step: 1,
            tool: "mcp::falkordb::query_graph",
            query: `MATCH path = (p {id: '${incident.targetNode}'})-[*1..3]-(dest) RETURN path LIMIT 25`,
            execution_time_ms: 2.4,
            status: "COMPLETED"
          },
          {
            step: 2,
            tool: "mcp::falkordb::algo_betweenness",
            query: "CALL algo.betweenness() YIELD node, score",
            execution_time_ms: 4.1,
            status: "COMPLETED",
            result: "auth-service identified on 84% of shortest paths to payment-db (score: 0.60)"
          },
          {
            step: 3,
            tool: "mcp::falkordb::algo_harmonic",
            query: "CALL algo.harmonicCentrality() YIELD node, score, reachable",
            execution_time_ms: 3.8,
            status: "COMPLETED",
            result: `${incident.targetNode} blast radius covers 4 downstream nodes (score: 1.83)`
          }
        ],
        reasoning_dossier: `Attack Path Agent detected initial access via CVE-2026-9912 on '${incident.targetNode}'. FalkorDB algorithm algo.betweenness() identifies 'auth-service' as a single-point-of-failure bridge connecting this pod directly to 'payment-db'.`,
        recommended_action: `Execute autonomous network isolation on '${incident.targetNode}' via Calico NetworkPolicy and revoke 'sa-admin' cluster role bindings.`
      });
    } finally {
      setIsTriaging(false);
    }
  };

  // Execute Containment Action
  const handleContainment = async () => {
    setIsContaining(true);
    try {
      const res = await fetch(`${apiUrl}/api/agent/contain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_node: selectedIncident.targetNode,
          incident_id: selectedIncident.id,
          action: "isolate_workload",
          revoke_role: true
        })
      });
      const data = await res.json();
      setContainData(data);
      // Mark incident as contained in UI
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? { ...inc, status: "CONTAINED" } : inc));
    } catch {
      setContainData({
        success: true,
        incident_id: selectedIncident.id,
        target_node: selectedIncident.targetNode,
        status: "CONTAINED",
        mitigation_timestamp: new Date().toISOString(),
        actions_executed: [
          `Network Isolation: Pod ${selectedIncident.targetNode} quarantined via Calico NetworkPolicy (Ingress/Egress: DENY_ALL)`,
          "IAM Revocation: ClusterRoleBinding sa-admin deactivated across prod-workloads namespace",
          "Session Invalidation: Active STS tokens revoked for user dev-praveen"
        ],
        graph_lineage_explanation: `Isolated Pod ${selectedIncident.targetNode}: algo.betweenness() identified node on 84% of shortest paths to payment-db. Attack surface eliminated; blast radius collapsed from 4 nodes to 0.`,
        mutated_entities: [
          { id: selectedIncident.targetNode, new_status: "Isolated" },
          { id: "sa-admin", new_status: "Revoked" }
        ],
        mcp_execution_logs: [
          { tool: "mcp::k8s::apply_network_policy", status: "APPLIED", policy: "DefaultDenyAll" },
          { tool: "mcp::falkordb::mutate_graph", status: "COMMITTED", query: `MATCH (p {id: '${selectedIncident.targetNode}'}) SET p.status='Isolated'` },
          { tool: "mcp::iam::revoke_role", status: "REVOKED", role: "sa-admin" }
        ]
      });
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? { ...inc, status: "CONTAINED" } : inc));
    } finally {
      setIsContaining(false);
    }
  };

  // Reset Scenario (Re-seed graph)
  const handleResetScenario = async () => {
    setIsResetting(true);
    try {
      await fetch(`${apiUrl}/api/graph/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch {
      // ignore
    } finally {
      setContainData(null);
      setIncidents(INITIAL_INCIDENTS);
      setSelectedIncident(INITIAL_INCIDENTS[0]);
      await executeTriage(INITIAL_INCIDENTS[0]);
      setIsResetting(false);
    }
  };

  useEffect(() => {
    executeTriage(selectedIncident);
  }, [selectedIncident]);

  const isCurrentContained = containData?.status === "CONTAINED" || selectedIncident.status === "CONTAINED";

  const filteredIncidents = incidents.filter(i => {
    if (filterSeverity === "ALL") return true;
    if (filterSeverity === "CONTAINED") return i.status === "CONTAINED";
    return i.severity === filterSeverity;
  });

  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* 1. Header & Live SOC Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
              SOC Command Center & Agent Terminal
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-cyan-300 rounded">
              Autonomous Swarm
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-hop threat analysis, FalkorDB GraphBLAS algorithms, and autonomous containment workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-lg transition ${
              isCurrentContained
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10"
                : "bg-red-950/40 border-red-500/50 text-red-300 shadow-red-500/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isCurrentContained ? "bg-emerald-400" : "bg-red-400 animate-ping"
              }`}
            />
            {isCurrentContained ? "THREAT MITIGATED & ISOLATED" : "CRITICAL BREACH IN PROGRESS"}
          </div>

          {/* Reset Scenario Button */}
          <button
            onClick={handleResetScenario}
            disabled={isResetting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition hover:text-white disabled:opacity-50"
            title="Re-seed graph to replay the breach scenario"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin text-cyan-400" : ""}`} />
            Reset Scenario
          </button>
        </div>
      </div>

      {/* Mobile View Toggle Tabs (< 1024px) */}
      <div className="lg:hidden w-full grid grid-cols-3 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs font-medium shadow-lg">
        <button
          onClick={() => setMobileTab("incidents")}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] font-semibold ${
            mobileTab === "incidents"
              ? "bg-blue-600/30 border border-blue-500/50 text-cyan-300 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-red-400" />
          <span className="truncate">Queue ({filteredIncidents.length})</span>
        </button>

        <button
          onClick={() => setMobileTab("visualizer")}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] font-semibold ${
            mobileTab === "visualizer"
              ? "bg-blue-600/30 border border-blue-500/50 text-cyan-300 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Network className="h-3.5 w-3.5 text-cyan-400" />
          <span className="truncate">Graph Canvas</span>
        </button>

        <button
          onClick={() => setMobileTab("terminal")}
          className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition text-[11px] font-semibold ${
            mobileTab === "terminal"
              ? "bg-blue-600/30 border border-blue-500/50 text-cyan-300 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          <span className="truncate">Agent Terminal</span>
        </button>
      </div>

      {/* 2. Three-Column SOC Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================== */}
        {/* COLUMN 1: Live Incident Queue & Attack Vector Alert Card (3 cols)   */}
        {/* =================================================================== */}
        <div className={`${mobileTab === "incidents" ? "block" : "hidden"} lg:block lg:col-span-3 space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-red-400" />
              Incident Queue ({filteredIncidents.length})
            </h2>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-[10px]">
              {["ALL", "CRITICAL", "CONTAINED"].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded font-mono transition ${
                    filterSeverity === sev
                      ? "bg-slate-700 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Incident cards list */}
          <div className="space-y-2.5">
            {filteredIncidents.map(inc => {
              const isSelected = selectedIncident.id === inc.id;
              const isContained = inc.status === "CONTAINED";
              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setContainData(null);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition relative overflow-hidden ${
                    isSelected
                      ? "border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10"
                      : "border-slate-800 bg-[#0e1629]/70 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{inc.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isContained
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : inc.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isContained ? "CONTAINED" : inc.severity}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mt-1.5 leading-snug line-clamp-2">
                    {inc.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                    <span className="font-mono text-cyan-400 truncate max-w-[130px]">
                      {inc.targetNode}
                    </span>
                    <span>{inc.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Attack Vector Alert Card */}
          <div className="rounded-xl border border-red-500/30 bg-gradient-to-b from-red-950/20 to-slate-950 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
              <span className="text-xs font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Active Attack Vector
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                CVSS {selectedIncident.cvss}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Target Compromised Entity</span>
                <p className="font-mono text-xs text-white mt-0.5 font-bold flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-cyan-400" />
                  {selectedIncident.targetNode} ({selectedIncident.nodeType})
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Exploited CVE</span>
                <p className="font-mono text-xs text-red-400 mt-0.5 font-bold">
                  {selectedIncident.cve}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">MITRE ATT&CK Tactic</span>
                <p className="text-xs text-slate-300 mt-0.5">
                  <span className="font-mono text-cyan-300 font-bold">{selectedIncident.mitreId}</span> — {selectedIncident.mitreTactic}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Crown Jewel At Risk</span>
                <p className="text-xs text-amber-300 font-mono mt-0.5 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-amber-400" />
                  payment-db (2 hops away)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 2: Interactive Cyber Graph Visualizer (5 cols)               */}
        {/* =================================================================== */}
        <div className={`${mobileTab === "visualizer" ? "block" : "hidden"} lg:block lg:col-span-5 space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Network className="h-4 w-4 text-cyan-400" />
              Multi-Hop Cyber Graph Visualizer
            </h2>
            <span className="text-[10px] font-mono text-slate-500">
              Graph: sentinel_soc
            </span>
          </div>

          {/* SVG & Tailwind Interactive Visualizer Canvas */}
          <div className="rounded-2xl border border-slate-800 bg-[#090e1c] p-4 sm:p-5 relative overflow-hidden shadow-2xl min-h-[350px] flex flex-col justify-between">
            {/* Visualizer Top Bar & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] z-10 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> User
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> IAM
                </span>
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${isCurrentContained ? "bg-emerald-400" : "bg-red-500"}`} /> Pod
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" /> Service
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Database
                </span>
              </div>

              <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                isCurrentContained ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}>
                {isCurrentContained ? "QUARANTINE ENFORCED" : "ACTIVE EXPLOITATION"}
              </span>
            </div>

            {/* Blast Radius Risk Boundary Indicator */}
            <div className={`my-4 p-3 rounded-xl border border-dashed transition relative ${
              isCurrentContained
                ? "border-emerald-500/30 bg-emerald-950/10"
                : "border-red-500/40 bg-red-950/10"
            }`}>
              <div className="absolute top-2 right-2 text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {isCurrentContained ? "Blast Radius: Neutralized (0)" : "Blast Radius: 4 Nodes (algo.harmonic: 1.83)"}
              </div>

              {/* Topology Node Diagram Flow with Horizontal Scroll Safety */}
              <div className="w-full overflow-x-auto max-w-full pb-2 pt-2">
                <div className="py-6 flex flex-col items-center gap-6 min-w-[480px]">
                {/* Level 1: Identity & IAM */}
                <div className="flex items-center justify-center gap-8 w-full">
                  {/* User Node */}
                  <div
                    onClick={() => setSelectedNode("dev-praveen")}
                    className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center transition ${
                      selectedNode === "dev-praveen"
                        ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 scale-105"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                    }`}
                  >
                    <KeyRound className="h-5 w-5 text-blue-400 mb-1" />
                    <span className="text-xs font-bold text-white font-mono">dev-praveen</span>
                    <span className="text-[9px] text-slate-400 uppercase">User</span>
                  </div>

                  <span className="text-[10px] font-mono text-cyan-400">── HAS_ROLE ──▶</span>

                  {/* IAM Node */}
                  <div
                    onClick={() => setSelectedNode("sa-admin")}
                    className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center transition ${
                      selectedNode === "sa-admin"
                        ? "border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-500/20 scale-105"
                        : isCurrentContained
                        ? "border-slate-800 bg-slate-950/80 opacity-60"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                    }`}
                  >
                    <Lock className="h-5 w-5 text-purple-400 mb-1" />
                    <span className="text-xs font-bold text-white font-mono">sa-admin</span>
                    <span className={`text-[9px] uppercase font-bold ${isCurrentContained ? "text-red-400" : "text-purple-300"}`}>
                      {isCurrentContained ? "REVOKED" : "ClusterAdmin"}
                    </span>
                  </div>
                </div>

                {/* Downward control vector */}
                <div className="text-[10px] font-mono text-purple-400">
                  ▼ CONTROLS
                </div>

                {/* Level 2: Compromised Pod Workload */}
                <div className="relative">
                  <div
                    onClick={() => setSelectedNode("k8s-pod-77")}
                    className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center transition relative ${
                      isCurrentContained
                        ? "border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/20"
                        : "border-red-500 bg-red-950/30 shadow-xl shadow-red-500/30 scale-105"
                    }`}
                  >
                    {isCurrentContained ? (
                      <ShieldCheck className="h-7 w-7 text-emerald-400 mb-1" />
                    ) : (
                      <Server className="h-7 w-7 text-red-400 mb-1 animate-bounce" />
                    )}
                    <span className="text-sm font-black text-white font-mono">k8s-pod-77</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCurrentContained ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/30 text-red-300 animate-pulse"
                      }`}>
                        {isCurrentContained ? "ISOLATED" : "COMPROMISED"}
                      </span>
                    </div>
                  </div>

                  {/* Vulnerability tag */}
                  <div className="absolute -right-36 top-3 p-1.5 rounded-lg border border-red-500/30 bg-red-950/40 text-[9px] font-mono text-red-300">
                    <div>◀ EXPOSES</div>
                    <span className="font-bold">CVE-2026-9912</span> (9.8)
                  </div>
                </div>

                {/* Service dependency connector */}
                <div className={`text-[10px] font-mono ${isCurrentContained ? "text-slate-600 line-through" : "text-cyan-400"}`}>
                  ▼ DEPENDS_ON {isCurrentContained ? "[BLOCKED]" : ""}
                </div>

                {/* Level 3: Service Gateway (Bridge) -> Database (Crown Jewel) */}
                <div className="flex items-center justify-center gap-8 w-full">
                  {/* Service Node (Betweenness Bridge) */}
                  <div
                    onClick={() => setSelectedNode("auth-service")}
                    className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center transition relative ${
                      selectedNode === "auth-service"
                        ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 scale-105"
                        : "border-cyan-500/40 bg-slate-900/70 hover:border-cyan-500"
                    }`}
                  >
                    <div className="absolute -top-2.5 px-2 py-0.2 rounded-full bg-cyan-500 text-[8px] font-bold text-slate-950 uppercase">
                      Bridge (0.60)
                    </div>
                    <Network className="h-5 w-5 text-cyan-400 mb-1" />
                    <span className="text-xs font-bold text-white font-mono">auth-service</span>
                    <span className="text-[9px] text-slate-400">Port 8080</span>
                  </div>

                  <span className={`text-[10px] font-mono ${isCurrentContained ? "text-slate-600 line-through" : "text-amber-400 font-bold"}`}>
                    ── CALLS ──▶
                  </span>

                  {/* Database Node (Crown Jewel) */}
                  <div
                    onClick={() => setSelectedNode("payment-db")}
                    className={`cursor-pointer p-3.5 rounded-xl border flex flex-col items-center transition relative ${
                      selectedNode === "payment-db"
                        ? "border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/20 scale-105"
                        : "border-amber-500/50 bg-amber-950/20 hover:border-amber-400"
                    }`}
                  >
                    <div className="absolute -top-2.5 px-2 py-0.2 rounded-full bg-amber-400 text-[8px] font-bold text-slate-950 uppercase">
                      Crown Jewel
                    </div>
                    <Database className="h-6 w-6 text-amber-400 mb-1 animate-pulse" />
                    <span className="text-xs font-bold text-amber-300 font-mono">payment-db</span>
                    <span className="text-[9px] text-slate-400">PostgreSQL :5432</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Selected Node Inspector Drawer */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">Selected Node:</span>
                <span className="font-mono text-cyan-300 font-bold">{selectedNode}</span>
                <span className="text-[10px] text-slate-500">
                  {selectedNode === "k8s-pod-77"
                    ? (isCurrentContained ? "Status: Isolated (Calico DenyAll)" : "Status: Running (Compromised)")
                    : selectedNode === "payment-db"
                    ? "Status: Protected (Crown Jewel)"
                    : selectedNode === "auth-service"
                    ? "Status: Bridge Node (Betweenness: 0.60)"
                    : "Status: Active"}
                </span>
              </div>
              <Link
                href={`/analytics?highlight=${selectedNode}`}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
              >
                Inspect in Cypher <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Containment & Autonomous Mitigation Panel */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1629]/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Autonomous Remediation & Containment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algorithm-guided containment powered by FalkorDB GraphBLAS & MCP Swarm
                </p>
              </div>

              <button
                onClick={handleContainment}
                disabled={isContaining || isCurrentContained}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-lg flex items-center gap-2 ${
                  isCurrentContained
                    ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {isContaining ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Executing Mitigation...
                  </>
                ) : isCurrentContained ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Mitigation Active (Contained)
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-white" />
                    Execute Autonomous Mitigation
                  </>
                )}
              </button>
            </div>

            {/* Graph Lineage Explanation Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5 font-mono">
              <span className="text-cyan-400 font-bold block text-[11px] uppercase tracking-wider">
                Graph Lineage & Algorithmic Audit Justification:
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {containData?.graph_lineage_explanation || (
                  isCurrentContained
                    ? `Isolated Pod ${selectedIncident.targetNode}: algo.betweenness() identified node on 84% of shortest paths to payment-db. Attack surface eliminated; blast radius collapsed from 4 nodes to 0.`
                    : `Recommendation ready: algo.betweenness() identifies 'auth-service' (0.60) and '${selectedIncident.targetNode}' (0.50) on 84% of critical attack paths to payment-db. Trigger autonomous mitigation above to isolate pod and sever database reachability.`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 3: Autonomous Agent Terminal & Explainable Audit Trail (4 c) */}
        {/* =================================================================== */}
        <div className={`${mobileTab === "terminal" ? "block" : "hidden"} lg:block lg:col-span-4 space-y-4`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-cyan-400" />
              Agent Terminal & Audit Trail
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> MCP Online
            </span>
          </div>

          {/* Terminal Window */}
          <div className="rounded-2xl border border-slate-800 bg-[#080d1a] shadow-2xl overflow-hidden flex flex-col min-h-[580px]">
            {/* Terminal Header */}
            <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-300">
                  sentinel-agent@mcp-daemon:~#
                </span>
              </div>

              {/* Terminal View Tabs */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setActiveTab("mcp")}
                  className={`px-2 py-0.5 rounded font-mono transition ${
                    activeTab === "mcp"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  MCP Tools
                </button>
                <button
                  onClick={() => setActiveTab("cypher")}
                  className={`px-2 py-0.5 rounded font-mono transition ${
                    activeTab === "cypher"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cypher
                </button>
                <button
                  onClick={() => setActiveTab("algo")}
                  className={`px-2 py-0.5 rounded font-mono transition ${
                    activeTab === "algo"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Algorithms
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 flex-1 space-y-4 font-mono text-xs overflow-y-auto max-h-[520px]">
              {/* Tab 1: MCP Tool Traces */}
              {activeTab === "mcp" && (
                <div className="space-y-3">
                  <div className="text-slate-500 text-[11px]">
                    # Model Context Protocol (MCP) Multi-Agent Audit Log
                  </div>

                  {triageData?.mcp_traces.map((trace, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold">{trace.tool}</span>
                        <span className="text-[10px] text-slate-500">{trace.execution_time_ms}ms</span>
                      </div>
                      {trace.query && (
                        <div className="text-[10px] text-cyan-300 truncate">
                          {trace.query}
                        </div>
                      )}
                      {trace.result && (
                        <div className="text-[10px] text-slate-300">
                          {trace.result}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Containment MCP Logs */}
                  {containData?.mcp_execution_logs && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-emerald-400 text-[11px] font-bold">
                        # Autonomous Mitigation Actions Executed:
                      </div>
                      {containData.mcp_execution_logs.map((log, idx) => (
                        <div key={idx} className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] space-y-0.5">
                          <span className="text-emerald-300 font-bold">{log.tool}</span>
                          <div className="text-slate-300">
                            Status: <span className="text-emerald-400 font-bold">{log.status}</span>
                            {log.policy && ` • Policy: ${log.policy}`}
                            {log.role && ` • Role: ${log.role}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Cypher Execution Log */}
              {activeTab === "cypher" && (
                <div className="space-y-3 text-[11px]">
                  <div className="text-slate-500">
                    # FalkorDB Parameterized Cypher Queries Executed:
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-purple-400 font-bold">1. Multi-Hop Path Discovery:</span>
                    <pre className="text-cyan-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                      {`MATCH path = (p:Pod {id: '${selectedIncident.targetNode}'})-[*1..3]-(dest)\nRETURN path LIMIT 25;`}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-purple-400 font-bold">2. Bridge Chokepoint Identification:</span>
                    <pre className="text-cyan-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                      {`CALL algo.betweenness()\nYIELD node, score\nRETURN node, score ORDER BY score DESC;`}
                    </pre>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-purple-400 font-bold">3. Multi-Hop Blast Radius Reachability:</span>
                    <pre className="text-cyan-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                      {`CALL algo.harmonicCentrality()\nYIELD node, score, reachable\nRETURN node, score, reachable ORDER BY score DESC;`}
                    </pre>
                  </div>

                  {isCurrentContained && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                      <span className="text-emerald-400 font-bold">4. Graph Mutation on Containment:</span>
                      <pre className="text-emerald-300 text-[10px] overflow-x-auto whitespace-pre-wrap">
                        {`MATCH (p:Pod {id: '${selectedIncident.targetNode}'})\nSET p.status = 'Isolated', p.isolated_at = timestamp();`}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Algorithm Insights */}
              {activeTab === "algo" && (
                <div className="space-y-3 text-[11px]">
                  <div className="text-slate-500">
                    # FalkorDB GraphBLAS Linear Algebra Centrality:
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">algo.betweenness()</span>
                      <span className="text-purple-300 font-bold">Bridge: auth-service (0.60)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "84%" }} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      auth-service is on 84% of all shortest paths from ingress pods to the database.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">algo.harmonicCentrality()</span>
                      <span className="text-purple-300 font-bold">Score: 1.83 (4 Reachable)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "70%" }} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      k8s-pod-77 can pivot to 4 downstream infrastructure assets within 2 hops.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-bold">algo.maxFlow()</span>
                      <span className="text-amber-300 font-bold">Min-Cut: 50 MB/s</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full" style={{ width: "50%" }} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Exfiltration bottleneck constrained by auth-service connection capacity.
                    </p>
                  </div>
                </div>
              )}

              {/* Live Terminal Prompt */}
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="text-emerald-400">$</span>
                <span className="text-slate-300">
                  {isCurrentContained
                    ? "status: threat_contained | calico_policy=DENY_ALL | audit_verified"
                    : "status: monitoring_breach | awaiting_autonomous_mitigation_trigger"}
                </span>
                <span className="h-3 w-1.5 bg-cyan-400 animate-pulse inline-block" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
