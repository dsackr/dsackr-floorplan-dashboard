"""Floorplan Manager integration."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPath
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CARD_MODULE_URL, DOMAIN, PANEL_MODULE_URL
from .http import async_register_view
from .panel import async_register_panel
from .storage import FloorplanStore
from .websocket import async_register_websocket_commands


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})

    www_dir = Path(__file__).parent / "www"
    hass.http.async_register_static_paths(
        [StaticPath("/floorplan_manager", str(www_dir), cache_headers=False)]
    )

    async_register_view(hass)

    frontend.async_register_extra_js_url(hass, PANEL_MODULE_URL)
    frontend.async_register_extra_js_url(hass, CARD_MODULE_URL)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = FloorplanStore(hass)
    await store.async_load()
    hass.data[DOMAIN][entry.entry_id] = store

    await async_register_panel(hass)
    async_register_websocket_commands(hass, store)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True
