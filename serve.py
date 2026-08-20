#!/usr/bin/env python3
"""Static dev server for the prototype that never lets the browser cache.

Plain `python3 -m http.server` sends Last-Modified with no Cache-Control, so
browsers hold on to old JS and CSS and you end up wondering why an edit did
nothing. This sends no-store on everything.

    python3 serve.py [port]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    handler = partial(NoCache, directory="prototype")
    print(f"prototype → http://localhost:{port}  (caching disabled)")
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
