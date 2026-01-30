"""HTTP views for Floorplan Manager."""

from __future__ import annotations

from pathlib import Path

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.util import slugify

from .const import ALLOWED_EXTENSIONS, DOMAIN, MAX_UPLOAD_SIZE


class FloorplanUploadView(HomeAssistantView):
    """Upload endpoint for floorplan images."""

    url = "/api/floorplan_manager/upload"
    name = f"api:{DOMAIN}:upload"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request: web.Request) -> web.Response:
        reader = await request.multipart()
        field = await reader.next()
        if field is None or field.name != "file":
            return web.json_response({"error": "file field required"}, status=400)

        filename = field.filename or "floorplan"
        sanitized = slugify(Path(filename).stem) or "floorplan"
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            return web.json_response({"error": "unsupported file type"}, status=400)

        safe_filename = f"{sanitized}{ext}"
        target_dir = Path(self.hass.config.path("www", "floorplan_manager"))
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / safe_filename

        size = 0
        with open(target_path, "wb") as output:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_SIZE:
                    target_path.unlink(missing_ok=True)
                    return web.json_response({"error": "file too large"}, status=400)
                output.write(chunk)

        image_url = f"/local/floorplan_manager/{safe_filename}"
        return web.json_response({"image_url": image_url})


def async_register_view(hass: HomeAssistant) -> None:
    hass.http.register_view(FloorplanUploadView(hass))
