"""Storage helpers for Floorplan Manager."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DEFAULT_CONFIG, STORAGE_KEY, STORAGE_VERSION


class FloorplanStore:
    """Wrapper around Home Assistant storage."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] | None = None

    async def async_load(self) -> dict[str, Any]:
        if self._data is None:
            stored = await self._store.async_load()
            if stored is None:
                stored = deepcopy(DEFAULT_CONFIG)
            self._data = stored
        return deepcopy(self._data)

    async def async_save(self, data: dict[str, Any]) -> None:
        self._data = deepcopy(data)
        await self._store.async_save(self._data)

    async def async_update(self, updates: dict[str, Any]) -> dict[str, Any]:
        current = await self.async_load()
        current.update(updates)
        await self.async_save(current)
        return deepcopy(current)
