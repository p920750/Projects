"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  ShieldAlert, 
  Network, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Layers,
  Terminal,
  Share2,
  Lock,
  Flame,
  Zap,
  Server,
  KeyRound,
  ExternalLink,
  X
} from "lucide-react";

interface HealthData {
  status: string;
  uptime_seconds?: number;
  falkordb?: {
    connected: boolean;
    host: string;
    port: number;
    graph_name?: string;
    details?: string;
  };
  mcp_ready?: boolean;
}

interface GraphStats {
  success: boolean;
  mode?: string;
  graph_name?: string;
  active_pods: number;
  iam_identities: number;
  vulnerabilities: number;
  critical_vulnerabilities: number;
  total_nodes: number;
  total_relationships: number;
  execution_time_ms?: number;
}

interface ToastMessage {
  id: string;
  type: "success" | "warning" | "error";
  title: string;
  message: string;
}

export default function OverviewPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check backend and FalkorDB connection health
  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/health`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({
          status: "degraded",
          falkordb: { connected: false, host: "localhost", port: 6379, details: "API returned non-200 status" }
        });
      }
    } catch {
      setHealth({
        status: "offline",
        falkordb: { connected: false, host: "localhost", port: 6379, details: "FastAPI Backend is currently unreachable" }
      });
    } finally {
      setHealthLoading(false);
    }
  };

  // Fetch live topology stats counters from backend
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/graph/stats`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // Fallback default
        setStats({
          success: true,
          mode: "fallback",
          active_pods: 3,
          iam_identities: 2,
          vulnerabilities: 2,
          critical_vulnerabilities: 1,
          total_nodes: 7,
          total_relationships: 6
        });
      }
    } catch {
      setStats({
        success: true,
        mode: "offline_fallback",
        active_pods: 3,
        iam_identities: 2,
        vulnerabilities: 2,
        critical_vulnerabilities: 1,
        total_nodes: 7,
        total_relationships: 6
      });
    } finally {
      setStatsLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  // Trigger POST /api/graph/seed
  const handleSeedGraph = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${apiUrl}/api/graph/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      
      if (data.success) {
        setToast({
          id: Date.now().toString(),
          type: "success",
          title: "Security Graph Re-seeded",
          message: `Initialized ${data.nodes_created ?? 7} nodes and ${data.relationships_created ?? 6} relationships on '${data.graph_name || "active graph"}'.`
        });
      } else {
        setToast({
          id: Date.now().toString(),
          type: "error",
          title: "Seeding Failed",
          message: data.message || "Failed to re-seed security topology in FalkorDB."
        });
      }
      // Re-fetch health and stats
      await Promise.all([fetchHealth(), fetchStats()]);
    } catch (err: any) {
      setToast({
        id: Date.now().toString(),
        type: "warning",
        title: "Backend Unavailable",
        message: "Could not reach FastAPI server at " + apiUrl + ". Ensure backend is running."
      });
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchStats();
  }, []);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const isFalkorConnected = health?.falkordb?.connected === true;

  return (
    <div className="space-y-8 sm:space-y-10 relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Floating Cyber Toast Notification */}
      {toast && (
        <aside aria-label="Notifications" className="fixed top-20 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 ${
              toast.type === "success"
                ? "bg-slate-900/95 border-emerald-500/50 text-slate-100 shadow-emerald-500/10"
                : "bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-amber-500/10"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>{toast.title}</span>
                <button
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-white p-0.5 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">{toast.message}</p>
            </div>
          </div>
        </aside>
      )}

      {/* 1. Hero Header & Sponsor Showcase */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-[#0b1224] to-[#080d1a] p-5 sm:p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Architecture Showcase & Engine Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
              <Database className="h-3.5 w-3.5 text-purple-400" />
              Powered by FalkorDB
            </span>

            {/* Dynamic Live Health Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold border transition shadow-sm ${
                isFalkorConnected
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-amber-500/20"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isFalkorConnected
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400 animate-pulse"
                }`}
              />
              {healthLoading ? (
                <span>Checking FalkorDB...</span>
              ) : isFalkorConnected ? (
                <span>FalkorDB Connected ({health?.falkordb?.graph_name || "sentinel_soc"})</span>
              ) : (
                <span title="Running in deterministic local topology mode">
                  Local Mode Ready
                </span>
              )}
            </div>
          </div>

          {/* Platform Title & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              SentinelGraph: <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                Autonomous Multi-Agent Security SOC
              </span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl font-light">
              Graph-Native Threat Triage & Blast Radius Containment Powered by FalkorDB. SentinelGraph continuously correlates Kubernetes workloads, cloud IAM credentials, and zero-day CVEs into a low-latency knowledge graph analyzed by autonomous agent swarms via the Model Context Protocol (MCP).
            </p>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white transition shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
            >
              Launch SOC Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/analytics"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 font-semibold text-sm text-slate-200 transition hover:border-slate-600 w-full sm:w-auto"
            >
              <Network className="h-4 w-4 text-cyan-400" />
              Open Graph Analytics Console
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>

            <button
              onClick={handleSeedGraph}
              disabled={seeding}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 font-semibold text-sm transition shadow-md shadow-purple-900/20 disabled:opacity-50 w-full sm:w-auto"
            >
              {seeding ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
                  Seeding Graph...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-purple-400" />
                  Seed Security Graph
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Dynamic Topology Stats Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-300">
              Dynamic Security Topology Snapshot
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {lastUpdated && <span>Updated: {lastUpdated}</span>}
            <button
              onClick={() => {
                fetchHealth();
                fetchStats();
              }}
              disabled={statsLoading}
              className="inline-flex items-center gap-1 hover:text-cyan-400 transition"
              title="Refresh topology stats"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Active Pods & Workloads */}
          <div className="rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0f172a]/90 to-[#0b1222] p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Workloads / Pods</span>
              <Server className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {statsLoading ? "..." : stats?.active_pods ?? 3}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              k8s-pod-77, auth-service, payment-db
            </div>
            <div className="h-0.5 w-full bg-cyan-500/20 group-hover:bg-cyan-500/50 transition-all rounded" />
          </div>

          {/* Stat 2: IAM Identities & Roles */}
          <div className="rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0f172a]/90 to-[#0b1222] p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">IAM Identities & Roles</span>
              <KeyRound className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {statsLoading ? "..." : stats?.iam_identities ?? 2}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              dev-praveen, sa-admin
            </div>
            <div className="h-0.5 w-full bg-blue-500/20 group-hover:bg-blue-500/50 transition-all rounded" />
          </div>

          {/* Stat 3: Vulnerabilities */}
          <div className="rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0f172a]/90 to-[#0b1222] p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Known CVEs</span>
              <Flame className="h-4 w-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400 tracking-tight flex items-baseline gap-2">
              <span>{statsLoading ? "..." : stats?.vulnerabilities ?? 2}</span>
              <span className="text-xs text-red-400/80 font-normal font-mono">
                ({stats?.critical_vulnerabilities ?? 1} Critical)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              CVE-2026-9912 (9.8), CVE-2025-1102
            </div>
            <div className="h-0.5 w-full bg-red-500/20 group-hover:bg-red-500/50 transition-all rounded" />
          </div>

          {/* Stat 4: Multi-Hop Relationships */}
          <div className="rounded-xl border border-slate-800/90 bg-gradient-to-b from-[#0f172a]/90 to-[#0b1222] p-5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Multi-Hop Edges</span>
              <Share2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-purple-300 tracking-tight">
              {statsLoading ? "..." : stats?.total_relationships ?? 6}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              HAS_ROLE, CONTROLS, DEPENDS_ON, CALLS
            </div>
            <div className="h-0.5 w-full bg-purple-500/20 group-hover:bg-purple-500/50 transition-all rounded" />
          </div>
        </div>
      </section>

      {/* 3. Graph-Native Architecture Capabilities (3 Grid Cards) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-5 w-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">
            Graph-Native Architecture Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Multi-Hop Cypher Reasoning */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e1629]/80 p-6 space-y-4 hover:border-blue-500/50 transition group flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Network className="h-6 w-6" />
              </div>

              <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-500/10 border border-blue-500/30 text-cyan-300">
                Multi-Hop Cypher Traversal
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                Attack Path Traversal
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                Connects siloed telemetry into a unified graph. SentinelGraph models multi-hop pivot sequences spanning compromised ingress workloads (<code className="text-cyan-300 font-mono">k8s-pod-77</code>), privileged cluster role bindings (<code className="text-cyan-300 font-mono">sa-admin</code>), and crown-jewel databases (<code className="text-cyan-300 font-mono">payment-db</code>).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-cyan-400 font-semibold">Cypher Pattern:</div>
              <div className="truncate text-slate-300">
                (:User)-[:HAS_ROLE]-&gt;(:IAM)-[:CONTROLS]-&gt;(:Pod)-[:DEPENDS_ON]-&gt;(:Service)
              </div>
            </div>
          </div>

          {/* Card 2: FalkorDB GraphBLAS Algorithms */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e1629]/80 p-6 space-y-4 hover:border-purple-500/50 transition group flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="h-6 w-6" />
              </div>

              <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
                GraphBLAS In-Memory Engine
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">
                FalkorDB Graph Algorithms
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                Executes linear algebra matrix operations for real-time security analytics. Surfaces critical bridge bottlenecks using <code className="text-purple-300 font-mono">CALL algo.betweenness()</code>, computes network exfiltration throughput via <code className="text-purple-300 font-mono">CALL algo.maxFlow()</code>, and evaluates multi-hop blast radius through <code className="text-purple-300 font-mono">CALL algo.harmonicCentrality()</code>.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-purple-400 font-semibold">Native Procedures:</div>
              <div className="flex gap-2 text-slate-300 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">betweenness</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">maxFlow</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">harmonicCentrality</span>
              </div>
            </div>
          </div>

          {/* Card 3: Model Context Protocol (MCP) Integration */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e1629]/80 p-6 space-y-4 hover:border-emerald-500/50 transition group flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Terminal className="h-6 w-6" />
              </div>

              <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                Model Context Protocol (MCP)
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                Autonomous Agent Swarm
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                Empowers LLM agents with structured graph tools via standardized MCP protocol. The Alert Triage Agent, Blast Radius Agent, and Incident Commander autonomously discover ontology schemas, execute parameterized Cypher investigations, and trigger containment playbooks.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-emerald-400 font-semibold">Exposed MCP Tools:</div>
              <div className="truncate text-slate-300 text-[10px]">
                query_graph • find_blast_radius • isolate_workload
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quick Operations & Seeding Panel */}
      <section className="rounded-2xl border border-slate-800 bg-[#0e1629]/60 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Quick Action Operations Panel
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute core SOC initialization workflows and verify multi-agent communication
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleSeedGraph}
              disabled={seeding}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-md shadow-purple-600/20 disabled:opacity-50 w-full sm:w-auto"
            >
              {seeding ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Seeding Graph...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Re-Seed Graph (sentinel_soc)
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-blue-400" />
              1. Incident Triage Queue
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Real-time alert correlation feed mapped against MITRE ATT&CK techniques and agent investigation dossiers.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] pt-1"
            >
              Open SOC Dashboard <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Network className="h-4 w-4 text-cyan-400" />
              2. Graph Algorithm Console
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Live Cypher console, betweenness centrality analysis, and 2-hop blast radius inspection.
            </p>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] pt-1"
            >
              Launch Graph Analytics <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-purple-400" />
              3. Graph Engine Diagnostics
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              FalkorDB host: <code className="text-purple-300 font-mono">{health?.falkordb?.host || "localhost"}:{health?.falkordb?.port || 6379}</code>
              <br />
              Target Graph: <code className="text-purple-300 font-mono">sentinel_soc</code>
            </p>
            <span className="text-slate-400 text-[11px]">
              Status: <span className={isFalkorConnected ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                {isFalkorConnected ? "Live Connected" : "Local Fallback Ready"}
              </span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
