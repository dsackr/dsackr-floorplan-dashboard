"""Floorplan Manager integration."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CARD_MODULE_URL, DOMAIN, PANEL_MODULE_URL
from .http import async_register_view
from .panel import async_register_panel
from .storage import FloorplanStore
from .websocket import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)


def _register_extra_url(hass: HomeAssistant, url: str) -> None:
    register = getattr(frontend, "async_register_extra_js_url", None)
    if register is None:
        register = getattr(frontend, "async_register_extra_module_url", None)

    if register is None:
        _LOGGER.warning(
            "Home Assistant frontend does not support registering extra URLs for %s",
            url,
        )
        return

    register(hass, url)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})

    async_register_view(hass)

    _register_extra_url(hass, PANEL_MODULE_URL)
    _register_extra_url(hass, CARD_MODULE_URL)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if not hass.data[DOMAIN].get("static_paths_registered"):
        static_dir_path = Path(__file__).parent / "www"
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    "/api/floorplan_manager/static", str(static_dir_path), True
                )
            ]
        )
        hass.data[DOMAIN]["static_paths_registered"] = True

    store = FloorplanStore(hass)
    await store.async_load()
    hass.data[DOMAIN][entry.entry_id] = store

    await async_register_panel(hass)
    async_register_websocket_commands(hass, store)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True
