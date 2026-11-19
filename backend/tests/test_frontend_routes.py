import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.app import main


async def asgi_get(path):
    events = []
    received = False

    async def receive():
        nonlocal received
        if not received:
            received = True
            return {"type": "http.request", "body": b"", "more_body": False}
        return {"type": "http.disconnect"}

    async def send(event):
        events.append(event)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": b"",
        "root_path": "",
        "headers": [],
        "client": ("test", 1234),
        "server": ("test", 80),
    }
    await main.app(scope, receive, send)
    status = next(event["status"] for event in events if event["type"] == "http.response.start")
    body = b"".join(event.get("body", b"") for event in events if event["type"] == "http.response.body")
    return status, body


class FrontendRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_direct_and_unknown_bench_urls_receive_the_spa_shell(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            frontend_dist = Path(temporary_directory)
            (frontend_dist / "index.html").write_text("<main>FOOTBEAT app shell</main>", encoding="utf-8")
            with patch.object(main, "frontend_dist", frontend_dist):
                for path in ("/bench/newcastle-bench-001", "/bench/unknown-bench"):
                    status, body = await asgi_get(path)
                    self.assertEqual(status, 200)
                    self.assertIn(b"FOOTBEAT app shell", body)

    async def test_api_health_route_does_not_conflict_with_frontend_fallback(self):
        status, body = await asgi_get("/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body), {"status": "ok"})


if __name__ == "__main__":
    unittest.main()
