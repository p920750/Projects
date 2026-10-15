"""
SentinelGraph Multi-Agent Security SOC
Centralized FalkorDB Database Client & Connection Factory
Supports Local Docker, Authenticated FalkorDB Cloud, and Deterministic Fallback
"""

import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv

# Load environment configuration
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
FALKORDB_USER = os.getenv("FALKORDB_USER") or os.getenv("FALKORDB_USERNAME") or None
FALKORDB_PASSWORD = os.getenv("FALKORDB_PASSWORD") or None
FALKORDB_SSL = os.getenv("FALKORDB_SSL", "false").lower() in ("true", "1", "yes")
FALKORDB_URL = os.getenv("FALKORDB_URL") or None
FALKORDB_GRAPH_NAME = os.getenv("FALKORDB_GRAPH_NAME", "sentinel_soc")


def get_falkordb_client(
    host: Optional[str] = None,
    port: Optional[int] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    ssl: Optional[bool] = None,
    url: Optional[str] = None,
):
    """
    Instantiate and return a FalkorDB client.
    Supports:
    1. Direct connection URL (e.g., falkors://user:password@host:port) via FalkorDB.from_url()
    2. Explicit host/port with optional username, password, and SSL for FalkorDB Cloud
    3. Unauthenticated local fallback (defaults to localhost:6379 without credentials)
    """
    try:
        from falkordb import FalkorDB

        target_url = url or FALKORDB_URL
        if target_url:
            return FalkorDB.from_url(target_url)

        target_host = host or FALKORDB_HOST
        target_port = port if port is not None else FALKORDB_PORT
        target_user = username if username is not None else FALKORDB_USER
        target_pass = password if password is not None else FALKORDB_PASSWORD
        target_ssl = ssl if ssl is not None else FALKORDB_SSL

        kwargs: Dict[str, Any] = {
            "host": target_host,
            "port": target_port,
        }

        # Include authentication credentials only if provided
        if target_user:
            kwargs["username"] = target_user
        if target_pass:
            kwargs["password"] = target_pass
        if target_ssl:
            kwargs["ssl"] = True

        return FalkorDB(**kwargs)
    except Exception:
        return None


def get_falkordb_graph(
    client=None,
    graph_name: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    ssl: Optional[bool] = None,
    url: Optional[str] = None,
):
    """
    Convenience helper to select a FalkorDB graph directly.
    Returns (client, graph) tuple or (None, None) if unreachable.
    """
    try:
        target_client = client or get_falkordb_client(
            host=host,
            port=port,
            username=username,
            password=password,
            ssl=ssl,
            url=url,
        )
        if target_client is None:
            return None, None
        target_graph_name = graph_name or FALKORDB_GRAPH_NAME
        graph = target_client.select_graph(target_graph_name)
        return target_client, graph
    except Exception:
        return None, None


def get_connection_metadata(
    host: Optional[str] = None,
    port: Optional[int] = None,
    graph_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns sanitized metadata about the active FalkorDB configuration.
    """
    target_host = host or FALKORDB_HOST
    target_port = port if port is not None else FALKORDB_PORT
    target_graph = graph_name or FALKORDB_GRAPH_NAME
    is_authenticated = bool(FALKORDB_USER or FALKORDB_PASSWORD or (FALKORDB_URL and "@" in FALKORDB_URL))

    return {
        "host": target_host,
        "port": target_port,
        "graph_name": target_graph,
        "authenticated": is_authenticated,
        "user": FALKORDB_USER if FALKORDB_USER else ("Configured in URL" if (FALKORDB_URL and "@" in FALKORDB_URL) else None),
        "ssl": FALKORDB_SSL or (bool(FALKORDB_URL) and FALKORDB_URL.startswith("falkors://")),
        "url_mode": bool(FALKORDB_URL),
    }
