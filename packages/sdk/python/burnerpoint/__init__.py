"""
BurnerPoint Python SDK
======================
Interact with the BurnerPoint API from Python.

Example::

    from burnerpoint import BurnerPoint

    bp = BurnerPoint(api_key="bp_your_api_key")

    # Search for numbers
    numbers = bp.numbers.search("US")

    # Provision a burner number
    number = bp.numbers.provision(numbers[0]["number"], "burner", "US")
    print(f"Got number: {number['number']}")

    # List messages
    messages = bp.messages.list(number["id"])
"""

__version__ = "1.0.0"
__author__ = "BurnerPoint"

import httpx
import json
from typing import Optional, List, Dict, Any, Literal
from dataclasses import dataclass


class BurnerPointError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        super().__init__(f"[{status_code}] {message}")


@dataclass
class BurnerPointConfig:
    api_key: str
    base_url: str = "https://api.burnerpoint.app"
    timeout: int = 30


class _NumbersClient:
    def __init__(self, client: "BurnerPoint"):
        self._c = client

    def search(self, country: str, area_code: Optional[str] = None) -> List[Dict]:
        """Search available phone numbers."""
        params = {"country": country}
        if area_code:
            params["areaCode"] = area_code
        return self._c._request("GET", "/numbers/search", params=params)

    def provision(self, phone_number: str, type: str, country_code: str) -> Dict:
        """Provision a phone number."""
        return self._c._request("POST", "/numbers/provision", json={
            "phoneNumber": phone_number, "type": type, "countryCode": country_code
        })

    def list(self) -> List[Dict]:
        """List all provisioned numbers."""
        return self._c._request("GET", "/numbers")

    def get(self, number_id: str) -> Dict:
        """Get a specific number."""
        return self._c._request("GET", f"/numbers/{number_id}")

    def renew(self, number_id: str) -> Dict:
        """Renew a number."""
        return self._c._request("POST", f"/numbers/{number_id}/renew")

    def release(self, number_id: str) -> Dict:
        """Release/destroy a number."""
        return self._c._request("DELETE", f"/numbers/{number_id}")


class _MessagesClient:
    def __init__(self, client: "BurnerPoint"):
        self._c = client

    def list(self, phone_number_id: str) -> List[Dict]:
        """List messages for a phone number."""
        return self._c._request("GET", "/messages", params={"phoneNumberId": phone_number_id})

    def send(self, to: str, from_: str, body: str) -> Dict:
        """Send an SMS message."""
        return self._c._request("POST", "/messages", json={"to": to, "from": from_, "body": body})


class _PaymentsClient:
    def __init__(self, client: "BurnerPoint"):
        self._c = client

    def packages(self) -> List[Dict]:
        """List available credit packages."""
        return self._c._request("GET", "/payments/packages")

    def initialize(self, package_id: str, gateway: str) -> Dict:
        """Initialize a payment session."""
        return self._c._request("POST", "/payments/initialize", json={
            "packageId": package_id, "gateway": gateway
        })

    def history(self) -> List[Dict]:
        """Get payment transaction history."""
        return self._c._request("GET", "/payments/history")


class BurnerPoint:
    """BurnerPoint API client."""

    def __init__(self, api_key: str, base_url: str = "https://api.burnerpoint.app", timeout: int = 30):
        self.config = BurnerPointConfig(api_key=api_key, base_url=base_url, timeout=timeout)
        self._http = httpx.Client(
            base_url=base_url,
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            timeout=timeout,
        )
        self.numbers = _NumbersClient(self)
        self.messages = _MessagesClient(self)
        self.payments = _PaymentsClient(self)

    def _request(self, method: str, path: str, **kwargs) -> Any:
        response = self._http.request(method, path, **kwargs)
        if not response.is_success:
            try:
                err = response.json()
                raise BurnerPointError(response.status_code, err.get("message", "Request failed"))
            except (json.JSONDecodeError, KeyError):
                raise BurnerPointError(response.status_code, response.text)
        return response.json()

    def wallet_balance(self) -> Dict:
        """Get wallet balance."""
        return self._request("GET", "/users/me/wallet")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._http.close()
