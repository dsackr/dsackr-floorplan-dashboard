"""Panel registration for Floorplan Manager."""

from __future__ import annotations

from homeassistant.components import frontend
from homeassistant.core import HomeAssistant

from .const import PANEL_MODULE_URL, PANEL_TITLE, PANEL_URL_PATH


async def async_register_panel(hass: HomeAssistant) -> None:
    frontend.async_register_built_in_panel(
        hass,
        component_name="floorplan_manager",
        sidebar_title=PANEL_TITLE,
        sidebar_icon="mdi:floor-plan",
        frontend_url_path=PANEL_URL_PATH,
        config={"module_url": PANEL_MODULE_URL},
        require_admin=False,
    )
