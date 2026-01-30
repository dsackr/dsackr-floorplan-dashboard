"""Websocket commands for Floorplan Manager."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .storage import FloorplanStore


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _maybe_number(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _normalize_entities(current: dict[str, Any], updates: dict[str, Any]) -> dict[str, Any]:
    entities = dict(current)
    for entity_id, data in updates.items():
        if not isinstance(data, dict):
            continue
        entry = dict(entities.get(entity_id, {}))
        if "include" in data:
            entry["include"] = bool(data["include"])
        if "x" in data:
            num = _maybe_number(data["x"])
            entry["x"] = _clamp(num, 0, 100) if num is not None else None
        if "y" in data:
            num = _maybe_number(data["y"])
            entry["y"] = _clamp(num, 0, 100) if num is not None else None
        entities[entity_id] = entry
    return entities


def _normalize_areas(current: dict[str, Any], updates: dict[str, Any]) -> dict[str, Any]:
    areas = dict(current)
    for area_id, data in updates.items():
        if not isinstance(data, dict):
            continue
        entry = dict(areas.get(area_id, {}))
        if "include" in data:
            entry["include"] = bool(data["include"])
        if "x" in data:
            num = _maybe_number(data["x"])
            entry["x"] = _clamp(num, 0, 100) if num is not None else None
        if "y" in data:
            num = _maybe_number(data["y"])
            entry["y"] = _clamp(num, 0, 100) if num is not None else None
        if "r" in data:
            num = _maybe_number(data["r"])
            entry["r"] = _clamp(num, 1, 50) if num is not None else None
        areas[area_id] = entry
    return areas


def async_register_websocket_commands(hass: HomeAssistant, store: FloorplanStore) -> None:
    @websocket_api.websocket_command({"type": f"{DOMAIN}/get_config"})
    async def get_config(
        hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
    ) -> None:
        data = await store.async_load()
        connection.send_result(msg["id"], data)

    @websocket_api.websocket_command(
        {
            "type": f"{DOMAIN}/set_config",
            "config": vol.Schema(dict, extra=vol.ALLOW_EXTRA),
        }
    )
    async def set_config(
        hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
    ) -> None:
        current = await store.async_load()
        updates = dict(msg.get("config") or {})

        if "image_url" in updates:
            current["image_url"] = updates.get("image_url")

        if "selected_area_id" in updates:
            current["selected_area_id"] = updates.get("selected_area_id")

        if "entities" in updates and isinstance(updates["entities"], dict):
            current["entities"] = _normalize_entities(current.get("entities", {}), updates["entities"])

        if "areas" in updates and isinstance(updates["areas"], dict):
            current["areas"] = _normalize_areas(current.get("areas", {}), updates["areas"])

        await store.async_save(current)
        connection.send_result(msg["id"], current)

    @websocket_api.websocket_command(
        {
            "type": f"{DOMAIN}/set_selected_area",
            "area_id": vol.Any(str, None),
        }
    )
    async def set_selected_area(
        hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict
    ) -> None:
        current = await store.async_load()
        current["selected_area_id"] = msg.get("area_id")
        await store.async_save(current)
        hass.bus.async_fire(
            f"{DOMAIN}_selected_area", {"area_id": current["selected_area_id"]}
        )
        connection.send_result(msg["id"], current)

    websocket_api.async_register_command(hass, get_config)
    websocket_api.async_register_command(hass, set_config)
    websocket_api.async_register_command(hass, set_selected_area)
