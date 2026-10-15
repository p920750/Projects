"""
SentinelGraph Multi-Agent Security SOC
FalkorDB Topology Seeding Script
"""

import os
import sys
import time
from typing import Any, Dict, Optional
from dotenv import load_dotenv

# Load environment configuration
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

try:
    from database import (
        get_falkordb_client,
        FALKORDB_HOST,
        FALKORDB_PORT,
        FALKORDB_GRAPH_NAME,
        FALKORDB_USER,
        FALKORDB_PASSWORD,
        get_connection_metadata,
    )
except ImportError:
    from backend.database import (
        get_falkordb_client,
        FALKORDB_HOST,
        FALKORDB_PORT,
        FALKORDB_GRAPH_NAME,
        FALKORDB_USER,
        FALKORDB_PASSWORD,
        get_connection_metadata,
    )


def get_falkor_client(
    host: Optional[str] = None,
    port: Optional[int] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
):
    """Instantiate FalkorDB client with provided or env configuration."""
    return get_falkordb_client(host=host, port=port, username=username, password=password)


def seed_graph(
    host: Optional[str] = None,
    port: Optional[int] = None,
    graph_name: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Seeds the FalkorDB graph with the SentinelGraph SOC multi-hop topology:
    - 3 Host/Pod nodes ('k8s-pod-77', 'auth-service', 'payment-db')
    - 2 User/IAM nodes ('dev-praveen', 'sa-admin')
    - 2 Vulnerabilities ('CVE-2026-9912' Critical, 'CVE-2025-1102' Medium)
    - Relationships:
      (:User)-[:HAS_ROLE]->(:IAM)
      (:IAM)-[:CONTROLS]->(:Pod)
      (:Pod)-[:DEPENDS_ON]->(:Service)
      (:Service)-[:CALLS]->(:Database)
      (:Pod)-[:EXPOSES]->(:Vulnerability)
      (:Service)-[:EXPOSES]->(:Vulnerability)
    """
    target_host = host or FALKORDB_HOST
    target_port = port or FALKORDB_PORT
    target_graph = graph_name or FALKORDB_GRAPH_NAME
    start_time = time.perf_counter()

    try:
        client = get_falkordb_client(
            host=target_host,
            port=target_port,
            username=username or FALKORDB_USER,
            password=password or FALKORDB_PASSWORD,
        )
        if client is None:
            raise ConnectionError(f"Could not initialize FalkorDB client for {target_host}:{target_port}")
        graph = client.select_graph(target_graph)
    except Exception as exc:
        return {
            "success": False,
            "graph_name": target_graph,
            "host": f"{target_host}:{target_port}",
            "message": f"Could not connect to FalkorDB ({exc.__class__.__name__}): {str(exc)}",
            "hint": "Please verify FalkorDB credentials or Docker container is active: `docker compose up -d`"
        }

    try:
        # Step 1: Clean slate - remove previous nodes and edges
        graph.query("MATCH (n) DETACH DELETE n")

        # Step 2: Create Host / Pod Nodes
        create_hosts_cypher = """
        CREATE (pod:Pod:Host {
            id: 'k8s-pod-77',
            name: 'k8s-pod-77',
            type: 'Pod',
            namespace: 'prod-workloads',
            ip: '10.244.1.77',
            status: 'Running',
            criticality: 'High'
        })
        CREATE (svc:Service:Host {
            id: 'auth-service',
            name: 'auth-service',
            type: 'Service',
            port: 8080,
            tier: 'Internal',
            criticality: 'High'
        })
        CREATE (db:Database:Host {
            id: 'payment-db',
            name: 'payment-db',
            type: 'Database',
            engine: 'PostgreSQL',
            port: 5432,
            criticality: 'CrownJewel'
        })
        """
        graph.query(create_hosts_cypher)

        # Step 3: Create User / IAM Nodes
        create_identities_cypher = """
        CREATE (user:User {
            id: 'dev-praveen',
            username: 'praveen',
            department: 'DevSecOps',
            email: 'praveen@sentinel.local',
            status: 'Active'
        })
        CREATE (iam:IAM:Role {
            id: 'sa-admin',
            name: 'sa-admin',
            role: 'ClusterAdmin',
            permissions: 'FullAccess',
            scope: 'Production'
        })
        """
        graph.query(create_identities_cypher)

        # Step 4: Create Vulnerabilities
        create_cves_cypher = """
        CREATE (cve1:Vulnerability {
            id: 'CVE-2026-9912',
            cve: 'CVE-2026-9912',
            cvss: 9.8,
            severity: 'Critical',
            description: 'Remote code execution via unauthorized header injection in pod gateway'
        })
        CREATE (cve2:Vulnerability {
            id: 'CVE-2025-1102',
            cve: 'CVE-2025-1102',
            cvss: 5.3,
            severity: 'Medium',
            description: 'Information disclosure via debug endpoint in auth service'
        })
        """
        graph.query(create_cves_cypher)

        # Step 5: Connect Relationships
        # (:User)-[:HAS_ROLE]->(:IAM)
        # (:IAM)-[:CONTROLS]->(:Pod)
        # (:Pod)-[:DEPENDS_ON]->(:Service)
        # (:Service)-[:CALLS]->(:Database)
        # (:Pod)-[:EXPOSES]->(:Vulnerability)
        # (:Service)-[:EXPOSES]->(:Vulnerability)
        create_relationships_cypher = """
        MATCH (u:User {id: 'dev-praveen'}), (i:IAM {id: 'sa-admin'})
        CREATE (u)-[:HAS_ROLE]->(i);

        MATCH (i:IAM {id: 'sa-admin'}), (p:Pod {id: 'k8s-pod-77'})
        CREATE (i)-[:CONTROLS]->(p);

        MATCH (p:Pod {id: 'k8s-pod-77'}), (s:Service {id: 'auth-service'})
        CREATE (p)-[:DEPENDS_ON {weight: 1.0, capacity: 100}]->(s);

        MATCH (s:Service {id: 'auth-service'}), (d:Database {id: 'payment-db'})
        CREATE (s)-[:CALLS {weight: 1.0, capacity: 50}]->(d);

        MATCH (p:Pod {id: 'k8s-pod-77'}), (v:Vulnerability {id: 'CVE-2026-9912'})
        CREATE (p)-[:EXPOSES]->(v);

        MATCH (s:Service {id: 'auth-service'}), (v:Vulnerability {id: 'CVE-2025-1102'})
        CREATE (s)-[:EXPOSES]->(v);
        """
        # Execute individual relationship statements
        for query in create_relationships_cypher.strip().split(";"):
            cleaned = query.strip()
            if cleaned:
                graph.query(cleaned)

        # Step 6: Create Indices for low-latency lookups
        indices = [
            "CREATE INDEX FOR (p:Pod) ON (p.id)",
            "CREATE INDEX FOR (s:Service) ON (s.id)",
            "CREATE INDEX FOR (d:Database) ON (d.id)",
            "CREATE INDEX FOR (u:User) ON (u.id)",
            "CREATE INDEX FOR (i:IAM) ON (i.id)",
            "CREATE INDEX FOR (v:Vulnerability) ON (v.id)",
        ]
        for idx in indices:
            try:
                graph.query(idx)
            except Exception:
                pass  # Index may already exist

        # Step 7: Verify counts
        res_nodes = graph.query("MATCH (n) RETURN count(n) AS total_nodes")
        res_rels = graph.query("MATCH ()-[r]->() RETURN count(r) AS total_relationships")

        total_nodes = res_nodes.result_set[0][0] if res_nodes.result_set else 0
        total_rels = res_rels.result_set[0][0] if res_rels.result_set else 0

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "success": True,
            "graph_name": target_graph,
            "host": f"{target_host}:{target_port}",
            "execution_time_ms": elapsed_ms,
            "nodes_created": total_nodes,
            "relationships_created": total_rels,
            "entities": {
                "hosts": ["k8s-pod-77", "auth-service", "payment-db"],
                "identities": ["dev-praveen", "sa-admin"],
                "vulnerabilities": ["CVE-2026-9912", "CVE-2025-1102"]
            },
            "relationships": [
                "(:User)-[:HAS_ROLE]->(:IAM)",
                "(:IAM)-[:CONTROLS]->(:Pod)",
                "(:Pod)-[:DEPENDS_ON]->(:Service)",
                "(:Service)-[:CALLS]->(:Database)",
                "(:Pod)-[:EXPOSES]->(:Vulnerability)",
                "(:Service)-[:EXPOSES]->(:Vulnerability)"
            ],
            "message": f"Successfully seeded {total_nodes} nodes and {total_rels} relationships into '{target_graph}'"
        }

    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return {
            "success": False,
            "graph_name": target_graph,
            "host": f"{target_host}:{target_port}",
            "execution_time_ms": elapsed_ms,
            "message": f"Error during graph seeding: {str(exc)}",
            "hint": "Check FalkorDB server logs."
        }


def run_cli():
    print("=" * 65)
    print("  SentinelGraph FalkorDB SOC Topology Seeder")
    print("=" * 65)
    print(f"Target FalkorDB: {FALKORDB_HOST}:{FALKORDB_PORT}")
    print(f"Target Graph:    {FALKORDB_GRAPH_NAME}")
    print(f"Authenticated:   {bool(FALKORDB_USER or FALKORDB_PASSWORD)}")
    if FALKORDB_USER:
        print(f"Username:        {FALKORDB_USER}")
    print("-" * 65)

    result = seed_graph()

    if result.get("success"):
        print(f"[+] Status: SUCCESS ({result.get('execution_time_ms')}ms)")
        print(f"[+] Nodes in Graph:         {result.get('nodes_created')}")
        print(f"[+] Relationships in Graph: {result.get('relationships_created')}")
        print("\nCreated Entities:")
        for category, items in result.get("entities", {}).items():
            print(f"  • {category.capitalize()}: {', '.join(items)}")
        print("\nTopology Edges:")
        for edge in result.get("relationships", []):
            print(f"  -> {edge}")
        print("-" * 65)
        print("Ready for Graph Algorithm queries (betweenness, maxflow, harmonic)!")
        print("=" * 65)
        sys.exit(0)
    else:
        print(f"[-] Status: FAILED")
        print(f"[-] Error:  {result.get('message')}")
        if result.get("hint"):
            print(f"[-] Hint:   {result.get('hint')}")
        print("=" * 65)
        sys.exit(1)


if __name__ == "__main__":
    run_cli()
