import time
from uuid import uuid4

from flask import g, request


def register_request_hooks(app):
    @app.before_request
    def before_request():
        g.request_id = str(uuid4())
        g.started_at = time.perf_counter()

    @app.after_request
    def after_request(response):
        response.headers["X-Request-ID"] = g.get("request_id", "")
        response.headers["X-Response-Time-ms"] = f"{(time.perf_counter() - g.get('started_at', 0)) * 1000:.2f}"
        return response
