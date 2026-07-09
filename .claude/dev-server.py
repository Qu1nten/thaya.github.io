"""Local dev server that mimics GitHub Pages' extensionless URLs:
a request to /about serves about.html, just like on qu1nten.github.io."""
import http.server
import os

PORT = 8123


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p) and os.path.exists(p + '.html'):
            return p + '.html'
        return p

    def end_headers(self):
        # Dev server: never let the browser cache stale files
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    with http.server.ThreadingHTTPServer(('', PORT), Handler) as httpd:
        print(f"Serving on http://localhost:{PORT}")
        httpd.serve_forever()
