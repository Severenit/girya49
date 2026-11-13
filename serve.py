#!/usr/bin/env python3
"""Serve the buildless application on this computer and its local network."""

import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class AppHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".webmanifest": "application/manifest+json; charset=utf-8",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        # Let a newly published service worker update without a browser cache delay.
        if self.path.split("?", 1)[0].endswith("/sw.js"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description="Локальный запуск Гиря49")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8080")))
    parser.add_argument("--host", default="0.0.0.0")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    handler = partial(AppHandler, directory=str(root))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Гиря49: http://localhost:{args.port}", flush=True)
    print(f"На телефоне в той же Wi-Fi сети: http://<IP компьютера>:{args.port}", flush=True)
    print("Для установки и офлайна на телефоне нужен HTTPS-хостинг. Ctrl+C — остановить.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
