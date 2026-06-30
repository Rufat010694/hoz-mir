from PIL import Image
from io import BytesIO


def process_image(data: bytes, max_size: tuple = (1200, 1200), quality: int = 85) -> bytes:
    """Resize and convert image to WebP."""
    img = Image.open(BytesIO(data))
    img = img.convert("RGB")
    img.thumbnail(max_size, Image.LANCZOS)
    output = BytesIO()
    img.save(output, format="WEBP", quality=quality, optimize=True)
    return output.getvalue()


def make_thumbnail(data: bytes, size: tuple = (300, 300), quality: int = 75) -> bytes:
    """Create thumbnail in WebP."""
    img = Image.open(BytesIO(data))
    img = img.convert("RGB")
    img.thumbnail(size, Image.LANCZOS)
    output = BytesIO()
    img.save(output, format="WEBP", quality=quality, optimize=True)
    return output.getvalue()
