import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseTrafficAgent(ABC):
    """Abstract base class for discrete, composable traffic intelligence agents."""

    def __init__(self, agent_id: str, name: str, role: str):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.logs: List[str] = []
        self.evidence: List[Dict[str, Any]] = []

    def log(self, message: str) -> None:
        entry = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [{self.name}] {message}"
        self.logs.append(entry)

    def record_evidence(self, title: str, metrics: Dict[str, Any], rationale: str) -> None:
        self.evidence.append({
            "title": title,
            "agent_id": self.agent_id,
            "metrics": metrics,
            "rationale": rationale,
            "timestamp": time.time()
        })

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        self.logs.clear()
        self.evidence.clear()
        self.log(f"Agent '{self.name}' starting execution.")

        try:
            result = self.run(state)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            self.log(f"Agent '{self.name}' completed in {duration_ms}ms.")

            return {
                "agent_id": self.agent_id,
                "name": self.name,
                "status": "COMPLETED",
                "duration_ms": duration_ms,
                "logs": self.logs,
                "evidence": self.evidence,
                "data": result
            }
        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            self.log(f"ERROR in agent '{self.name}': {str(e)}")
            return {
                "agent_id": self.agent_id,
                "name": self.name,
                "status": "FAILED",
                "duration_ms": duration_ms,
                "error": str(e),
                "logs": self.logs,
                "evidence": self.evidence,
                "data": {}
            }

    @abstractmethod
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Agent specific logic to implement."""
        pass
