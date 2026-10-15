"""
SentinelGraph Multi-Agent Security SOC (WeMakeDevs Hackathon Track 1)
Full-Stack Verification Audit Test Suite

Asserts 100% test coverage across:
- 1. GET /api/health (FalkorDB connection and MCP readiness)
- 2. GET /api/graph/stats (Topological node/edge counters)
- 3. GET /api/graph/schema (Ontology labels, relationships, indices, GraphBLAS benchmarks)
- 4. POST /api/graph/query (Cypher execution, tabular columns/rows, execution timing)
- 5. GET /api/graph/algorithms/betweenness (FalkorDB algo.betweenness() bridge detection)
- 6. GET /api/graph/algorithms/harmonic (FalkorDB algo.harmonicCentrality() blast radius)
- 7. GET /api/graph/algorithms/maxflow (FalkorDB algo.maxFlow() cut capacity)
- 8. POST /api/agent/triage (Multi-hop attack path reasoning & MCP tool trace)
- 9. POST /api/agent/contain (Autonomous mitigation mutation & explainable lineage)
"""

import os
import sys
import time

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app, GRAPH_NAME

client = TestClient(app)

audit_results = []

def record_test(name: str, passed: bool, latency_ms: float, details: str):
    audit_results.append({
        "test": name,
        "status": "PASS" if passed else "FAIL",
        "latency_ms": round(latency_ms, 2),
        "details": details
    })
    print(f"[{'PASS' if passed else 'FAIL'}] {name:<45} ({latency_ms:6.2f} ms) - {details}")

def test_1_health():
    t0 = time.perf_counter()
    res = client.get("/api/health")
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.json()
    assert "status" in data
    assert "falkordb" in data
    assert data.get("mcp_ready") is True
    record_test(
        "1. GET /api/health",
        True,
        ms,
        f"Status: {data['status']}, Host: {data['falkordb'].get('host')}:{data['falkordb'].get('port')}, MCP Ready: True"
    )

def test_2_stats():
    t0 = time.perf_counter()
    res = client.get("/api/graph/stats")
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["active_pods"] == 3
    assert data["iam_identities"] == 2
    assert data["vulnerabilities"] == 2
    assert data["total_nodes"] == 7
    assert data["total_relationships"] == 6
    record_test(
        "2. GET /api/graph/stats",
        True,
        ms,
        f"Pods: {data['active_pods']}, IAM: {data['iam_identities']}, CVEs: {data['vulnerabilities']}, Nodes: {data['total_nodes']}, Edges: {data['total_relationships']}"
    )

def test_3_schema():
    t0 = time.perf_counter()
    res = client.get("/api/graph/schema")
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["node_labels"]) == 6
    assert len(data["relationships"]) == 6
    assert len(data["indices"]) == 6
    assert len(data["graphblas_benchmarks"]) == 4
    record_test(
        "3. GET /api/graph/schema",
        True,
        ms,
        f"Labels: {len(data['node_labels'])}, Edges: {len(data['relationships'])}, Indices: {len(data['indices'])}, Benchmarks: {len(data['graphblas_benchmarks'])}"
    )

def test_4_query():
    t0 = time.perf_counter()
    query_payload = {
        "query": "MATCH (u:User)-[r:HAS_ROLE]->(i:IAM) RETURN u, r, i",
        "graph_name": GRAPH_NAME
    }
    res = client.post("/api/graph/query", json=query_payload)
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "columns" in data and len(data["columns"]) > 0
    assert "rows" in data and len(data["rows"]) > 0
    assert "execution_time_ms" in data
    record_test(
        "4. POST /api/graph/query",
        True,
        ms,
        f"Columns: {data['columns']}, Rows: {len(data['rows'])}, ExecutionTime: {data['execution_time_ms']}ms"
    )

def test_5_betweenness():
    t0 = time.perf_counter()
    res = client.get("/api/graph/algorithms/betweenness")
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["procedure"] == "CALL algo.betweenness()"
    assert "data" in data and len(data["data"]) > 0
    # Find auth-service bridge
    node_ids = [d["node"]["id"] for d in data["data"]]
    assert "auth-service" in node_ids
    auth_node = next(d for d in data["data"] if d["node"]["id"] == "auth-service")
    assert auth_node["score"] >= 0.50
    record_test(
        "5. GET /api/graph/algorithms/betweenness",
        True,
        ms,
        f"Procedure: {data['procedure']}, Bridge: auth-service (Score: {auth_node['score']}), Results: {len(data['data'])}"
    )

def test_6_harmonic():
    t0 = time.perf_counter()
    res = client.get("/api/graph/algorithms/harmonic")
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["procedure"] == "CALL algo.harmonicCentrality()"
    assert "data" in data and len(data["data"]) > 0
    node_ids = [d["node"]["id"] for d in data["data"]]
    assert "k8s-pod-77" in node_ids
    pod_node = next(d for d in data["data"] if d["node"]["id"] == "k8s-pod-77")
    assert pod_node["reachable_nodes"] in (4, 5)
    record_test(
        "6. GET /api/graph/algorithms/harmonic",
        True,
        ms,
        f"Procedure: {data['procedure']}, Target k8s-pod-77 reachability: {pod_node['reachable_nodes']} nodes (Score: {pod_node['score']})"
    )

def test_7_maxflow():
    t0 = time.perf_counter()
    res = client.get("/api/graph/algorithms/maxflow?source=k8s-pod-77&target=payment-db")
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["procedure"] == "CALL algo.maxFlow()"
    assert data["max_flow"] == 50.0
    record_test(
        "7. GET /api/graph/algorithms/maxflow",
        True,
        ms,
        f"Source: {data['source']} -> Sink: {data['target']}, Max Flow Capacity: {data['max_flow']} MB/s"
    )

def test_8_agent_triage():
    t0 = time.perf_counter()
    payload = {
        "target_node": "k8s-pod-77",
        "incident_id": "INC-2026-7701",
        "graph_name": GRAPH_NAME
    }
    res = client.post("/api/agent/triage", json=payload)
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "TRIAGED"
    assert data["target_node"] == "k8s-pod-77"
    assert data["crown_jewel"]["id"] == "payment-db"
    assert len(data["attack_path"]) == 5
    assert len(data["mcp_traces"]) == 3
    assert data["algo_insights"]["bridge_node"] == "auth-service"
    record_test(
        "8. POST /api/agent/triage",
        True,
        ms,
        f"Incident: {data['incident_id']}, Crown Jewel: {data['crown_jewel']['id']}, Attack Hops: {len(data['attack_path'])}, MCP Traces: {len(data['mcp_traces'])}"
    )

def test_9_agent_contain():
    t0 = time.perf_counter()
    payload = {
        "target_node": "k8s-pod-77",
        "incident_id": "INC-2026-7701",
        "action": "isolate_workload",
        "revoke_role": True,
        "graph_name": GRAPH_NAME
    }
    res = client.post("/api/agent/contain", json=payload)
    ms = (time.perf_counter() - t0) * 1000
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == "CONTAINED"
    assert data["target_node"] == "k8s-pod-77"
    assert len(data["mutated_entities"]) == 2
    assert data["mutated_entities"][0]["new_status"] == "Isolated"
    assert data["mutated_entities"][1]["new_status"] == "Revoked"
    assert len(data["mcp_execution_logs"]) == 3
    record_test(
        "9. POST /api/agent/contain",
        True,
        ms,
        f"Status: {data['status']}, Mutated: {[m['id'] + ' -> ' + m['new_status'] for m in data['mutated_entities']]}, MCP Logs: {len(data['mcp_execution_logs'])}"
    )

def run_all_tests():
    print("=" * 80)
    print(" SentinelGraph Track 1 Verification Audit - FalkorDB & Cypher Integration")
    print("=" * 80)
    
    test_1_health()
    test_2_stats()
    test_3_schema()
    test_4_query()
    test_5_betweenness()
    test_6_harmonic()
    test_7_maxflow()
    test_8_agent_triage()
    test_9_agent_contain()
    
    passed_count = sum(1 for r in audit_results if r["status"] == "PASS")
    total_count = len(audit_results)
    
    print("-" * 80)
    print(f" Audit Summary: {passed_count}/{total_count} Passed ({passed_count/total_count*100:.1f}%)")
    print("=" * 80)
    
    if passed_count != total_count:
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
