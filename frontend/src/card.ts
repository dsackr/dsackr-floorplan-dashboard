import { LitElement, css, html } from "lit";

interface FloorplanConfig {
  image_url?: string | null;
  selected_area_id?: string | null;
  entities?: Record<string, { include?: boolean; x?: number | null; y?: number | null }>;
  areas?: Record<string, { include?: boolean; x?: number | null; y?: number | null; r?: number | null }>;
}

class FloorplanManagerCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _data: { state: true },
    _selectedAreaId: { state: true },
    _areas: { state: true },
    _devices: { state: true },
    _entities: { state: true },
    _entityCard: { state: true },
  };

  hass: any;
  config: any;
  _data?: FloorplanConfig;
  _selectedAreaId?: string | null;
  _areas?: Array<{ id: string; name: string }>;
  _devices?: Array<{ id: string; area_id: string | null }>;
  _entities?: Array<{ entity_id: string; device_id: string | null; area_id?: string | null }>;
  _entityCard?: HTMLElement | null;

  static styles = css`
    .card {
      padding: 16px;
    }
    .image-wrapper {
      position: relative;
      width: 100%;
      max-width: 100%;
    }
    .image-wrapper img {
      width: 100%;
      display: block;
      object-fit: contain;
    }
    .marker {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent-color);
      border: 2px solid var(--primary-background-color);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
    }
    .room {
      position: absolute;
      border-radius: 50%;
      border: 2px dashed var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 15%, transparent);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .room.selected {
      border-style: solid;
      background: color-mix(in srgb, var(--primary-color) 30%, transparent);
    }
    .room-list {
      margin-top: 16px;
    }
    .room-title {
      font-weight: 600;
      margin: 16px 0 8px;
    }
    .empty {
      color: var(--secondary-text-color);
      font-style: italic;
    }
  `;

  setConfig(config: Record<string, unknown>) {
    this.config = config;
  }

  getCardSize() {
    return 4;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._ensureData();
    this._loadRegistries();
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has("_selectedAreaId")) {
      this._updateEntityCard();
    }
  }

  async _ensureData() {
    if (!this.hass) return;
    const data = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._data = data;
    this._selectedAreaId = data.selected_area_id;
  }

  async _loadRegistries() {
    if (!this.hass) return;
    const [areas, devices, entities] = await Promise.all([
      this.hass.callWS({ type: "config/area_registry/list" }),
      this.hass.callWS({ type: "config/device_registry/list" }),
      this.hass.callWS({ type: "config/entity_registry/list" }),
    ]);
    this._areas = areas;
    this._devices = devices;
    this._entities = entities;
    this._updateEntityCard();
  }

  _getImageUrl() {
    if (this.config && this.config.image_url) {
      return this.config.image_url;
    }
    return this._data?.image_url || "";
  }

  _entitiesForArea() {
    if (!this._selectedAreaId || !this._entities || !this._devices) return [];
    const deviceArea = new Map();
    for (const device of this._devices) {
      deviceArea.set(device.id, device.area_id);
    }
    const entityIds: string[] = [];
    for (const entry of this._entities) {
      if (entry.device_id && deviceArea.get(entry.device_id) === this._selectedAreaId) {
        entityIds.push(entry.entity_id);
        continue;
      }
      if (!entry.device_id && entry.area_id === this._selectedAreaId) {
        entityIds.push(entry.entity_id);
      }
    }
    return entityIds;
  }

  async _updateEntityCard() {
    if (!this.hass || !this._selectedAreaId) {
      this._entityCard = null;
      return;
    }
    const helpers = await (window as any).loadCardHelpers();
    const entityIds = this._entitiesForArea();
    if (!entityIds.length) {
      this._entityCard = null;
      return;
    }
    const card = await helpers.createCardElement({ type: "entities", entities: entityIds });
    card.hass = this.hass;
    this._entityCard = card;
  }

  _areasMap() {
    const map = new Map();
    (this._areas || []).forEach((area) => map.set(area.id, area));
    return map;
  }

  _handleImageTap(ev: MouseEvent) {
    if (!this._data?.areas) return;
    const wrapper = this.shadowRoot?.querySelector(".image-wrapper") as HTMLElement | null;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;

    const hit = Object.entries(this._data.areas)
      .map(([areaId, areaData]) => ({ areaId, areaData }))
      .filter(
        (entry) =>
          entry.areaData.include &&
          this._isNumber(entry.areaData.x) &&
          this._isNumber(entry.areaData.y) &&
          this._isNumber(entry.areaData.r)
      )
      .find((entry) => {
        const dx = x - (entry.areaData.x as number);
        const dy = y - (entry.areaData.y as number);
        return Math.sqrt(dx * dx + dy * dy) <= (entry.areaData.r as number);
      });

    if (hit) {
      this._selectedAreaId = hit.areaId;
      this.hass.callWS({ type: "floorplan_manager/set_selected_area", area_id: hit.areaId });
    }
  }

  _isNumber(value?: number | null) {
    return typeof value === "number" && !Number.isNaN(value);
  }

  render() {
    const imageUrl = this._getImageUrl();
    const entities = this._data?.entities || {};
    const areas = this._data?.areas || {};
    const areaMap = this._areasMap();
    const selectedArea = this._selectedAreaId ? areaMap.get(this._selectedAreaId) : null;
    const entityIds = this._entitiesForArea();

    return html`
      <ha-card>
        <div class="card">
          <div class="image-wrapper" @click=${this._handleImageTap}>
            ${imageUrl
              ? html`<img src=${imageUrl} alt="Floorplan" />`
              : html`<div class="empty">No image configured.</div>`}
            ${Object.entries(areas).map(([areaId, area]) =>
              area.include && this._isNumber(area.x) && this._isNumber(area.y) && this._isNumber(area.r)
                ? html`<div
                    class="room ${this._selectedAreaId === areaId ? "selected" : ""}"
                    style=${`left:${area.x}%; top:${area.y}%; width:${(area.r as number) * 2}%; height:${
                      (area.r as number) * 2
                    }%;`}
                  ></div>`
                : ""
            )}
            ${Object.entries(entities).map(([entityId, entity]) =>
              entity.include && this._isNumber(entity.x) && this._isNumber(entity.y)
                ? html`<div
                    class="marker"
                    style=${`left:${entity.x}%; top:${entity.y}%;`}
                    title=${entityId}
                  ></div>`
                : ""
            )}
          </div>
          <div class="room-list">
            <div class="room-title">${selectedArea ? selectedArea.name : "Select a room"}</div>
            ${selectedArea
              ? entityIds.length
                ? this._entityCard
                : html`<div class="empty">No devices in this room.</div>`
              : html`<div class="empty">Tap a room circle to view devices.</div>`}
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("floorplan-manager", FloorplanManagerCard);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "floorplan-manager",
  name: "Floorplan Manager",
  description: "Display a floorplan with tappable rooms and device list.",
});
