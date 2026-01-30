"""Constants for Floorplan Manager."""

DOMAIN = "floorplan_manager"
STORAGE_KEY = DOMAIN
STORAGE_VERSION = 1

DEFAULT_CONFIG = {
    "image_url": None,
    "selected_area_id": None,
    "entities": {},
    "areas": {},
}

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024

PANEL_TITLE = "Floorplan Setup"
PANEL_URL_PATH = "floorplan_setup"
PANEL_MODULE_URL = "/floorplan_manager/floorplan-manager-panel.js"

CARD_MODULE_URL = "/floorplan_manager/floorplan-manager-card.js"
