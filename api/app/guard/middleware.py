"""Security middleware for FastAPI."""

import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Minimal CSP (adjust based on your frontend needs)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:;"
        )
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter."""
    
    def __init__(self, app, limits: dict[str, tuple[int, int]]):
        """
        Args:
            limits: Dict mapping path prefix to (max_requests, window_seconds)
        """
        super().__init__(app)
        self.limits = limits
        self.requests: dict[str, list[float]] = defaultdict(list)
        self._cleanup_interval = 300  # Clean up old entries every 5 minutes
        self._last_cleanup = time.time()
    
    def _get_identifier(self, request: Request) -> str:
        """Get identifier for rate limiting (IP or user_id)."""
        # Try to get user_id from JWT if available
        # For now, use IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"{request.url.path}:{client_ip}"
    
    def _is_rate_limited(self, identifier: str, path: str) -> bool:
        """Check if request should be rate limited."""
        # Find matching limit
        limit_config = None
        for prefix, config in self.limits.items():
            if path.startswith(prefix):
                limit_config = config
                break
        
        if not limit_config:
            return False
        
        max_requests, window_seconds = limit_config
        now = time.time()
        
        # Clean up old entries periodically
        if now - self._last_cleanup > self._cleanup_interval:
            self._cleanup_old_entries(now)
            self._last_cleanup = now
        
        # Get requests in window
        requests_in_window = [
            ts for ts in self.requests[identifier]
            if now - ts < window_seconds
        ]
        self.requests[identifier] = requests_in_window
        
        # Check limit
        if len(requests_in_window) >= max_requests:
            return True
        
        # Record this request
        self.requests[identifier].append(now)
        return False
    
    def _cleanup_old_entries(self, now: float):
        """Remove old entries from rate limit tracking."""
        window_max = max(w for _, w in self.limits.values())
        cutoff = now - window_max
        
        for identifier in list(self.requests.keys()):
            self.requests[identifier] = [
                ts for ts in self.requests[identifier]
                if ts > cutoff
            ]
            if not self.requests[identifier]:
                del self.requests[identifier]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health check
        if request.url.path == "/api/health":
            return await call_next(request)
        
        identifier = self._get_identifier(request)
        path = request.url.path
        
        if self._is_rate_limited(identifier, path):
            return Response(
                content='{"detail":"Rate limit exceeded"}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
            )
        
        return await call_next(request)
