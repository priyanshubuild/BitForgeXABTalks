import os
import requests
from typing import Dict, Any, Optional

class BreethClient:
    def __init__(self, api_key: Optional[str] = None):
        # Read API key from parameter, falling back to environment variables
        self.api_key = api_key or os.getenv("BREETH_API_KEY")
        self.base_url = "https://api.thebreeth.com/v1"

    def write_episode(self, content: str, group_id: str, extract_intent: bool = False) -> Optional[Dict[str, Any]]:
        """
        Sends an episode memory entry to the Breeth memory graph.
        Calls POST /v1/episodes
        """
        if not self.api_key:
            print("Breeth Client: API Key is missing or not configured in environment.")
            return None

        url = f"{self.base_url}/episodes"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "content": content,
            "group_id": group_id,
            "extract_intent": extract_intent
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 429:
                print("Breeth Client: 429 quota_exceeded response received from server. Returning None.")
                return None
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Breeth Client Exception in write_episode: {e}")
            return None

    def search(self, query: str, group_id: str, limit: int = 5) -> Optional[Dict[str, Any]]:
        """
        Queries the Breeth memory graph semantically.
        Calls POST /v1/search
        """
        if not self.api_key:
            print("Breeth Client: API Key is missing or not configured in environment.")
            return None

        url = f"{self.base_url}/search"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "query": query,
            "group_id": group_id,
            "limit": limit
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 429:
                print("Breeth Client: 429 quota_exceeded response received from server. Returning None.")
                return None
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Breeth Client Exception in search: {e}")
            return None
