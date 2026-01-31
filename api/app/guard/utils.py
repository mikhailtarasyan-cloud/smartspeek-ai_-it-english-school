"""Normalization utilities for Guard v2."""

import base64
import unicodedata
import urllib.parse
from typing import Tuple

from .patterns import MAX_INPUT_CHARS


def normalize_for_guard(text: str) -> Tuple[str, dict]:
    """
    Normalize text for guard analysis.
    
    Returns:
        Tuple of (normalized_text, metadata_dict)
    """
    metadata = {
        "original_length": len(text),
        "normalizations_applied": [],
    }
    
    normalized = text
    
    # 1. Unicode NFKC normalization
    normalized = unicodedata.normalize("NFKC", normalized)
    metadata["normalizations_applied"].append("NFKC")
    
    # 2. Remove zero-width characters
    zero_width_chars = [
        "\u200B",  # Zero-width space
        "\u200C",  # Zero-width non-joiner
        "\u200D",  # Zero-width joiner
        "\uFEFF",  # Zero-width no-break space
    ]
    original_normalized = normalized
    for char in zero_width_chars:
        normalized = normalized.replace(char, "")
    if normalized != original_normalized:
        metadata["normalizations_applied"].append("zero_width_removal")
    
    # 3. URL decode
    try:
        decoded = urllib.parse.unquote(normalized)
        if decoded != normalized:
            normalized = decoded
            metadata["normalizations_applied"].append("url_decode")
    except Exception:
        pass
    
    # 4. Base64 decode (only if looks like base64 and decodes to printable text)
    # Check if string looks like base64 (alphanumeric + / + = padding)
    base64_like = len(normalized) > 10 and all(
        c.isalnum() or c in "+/=" for c in normalized.replace(" ", "").replace("\n", "")
    )
    if base64_like:
        try:
            # Try to decode
            decoded_bytes = base64.b64decode(normalized.replace(" ", "").replace("\n", ""), validate=True)
            decoded_str = decoded_bytes.decode("utf-8", errors="ignore")
            # Only use if result is mostly printable ASCII
            if decoded_str.isprintable() and len(decoded_str) > 5:
                normalized = decoded_str
                metadata["normalizations_applied"].append("base64_decode")
        except Exception:
            pass
    
    # 5. Length limit
    if len(normalized) > MAX_INPUT_CHARS:
        normalized = normalized[:MAX_INPUT_CHARS]
        metadata["normalizations_applied"].append("truncated")
        metadata["truncated_to"] = MAX_INPUT_CHARS
    
    metadata["normalized_length"] = len(normalized)
    
    return normalized, metadata
