import { LitElement, css, html } from "lit";
import { PropertyValues } from "lit";

interface FloorplanConfig {
  image_url?: string | null;
  entities?: Record<string, { include?: boolean; x?: number | null; y?: number | null }>;
  areas?: Record<string, { include?: boolean; x?: number | null; y?: number | null; r?: number | null }>;
}

class FloorplanManagerPanel extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _areas: { state: true },
    _search: { state: true },
    _placing: { state: true },
    _dragging: { state: false },
  };

  hass: any;
  _config?: FloorplanConfig | null;
  _areas: Array<{ id: string; name: string }> = [];
  _search = "";
  _placing?: { type: "entity" | "area"; id: string } | null;
  _dragging?: { type: "entity" | "area"; id: string } | null;
  _saveTimeout?: number;
  _initialized = false;

  static styles = css`
    :host {
      display: block;
      padding: 24px;
    }
    .layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    .section {
      background: var(--card-background-color);
      border-radius: 12px;
      padding: 16px;
      box-shadow: var(--ha-card-box-shadow);
    }
    .section h2 {
      margin-top: 0;
      font-size: 18px;
    }
    .image-wrapper {
      position: relative;
      width: 100%;
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
      cursor: grab;
    }
    .room {
      position: absolute;
      border-radius: 50%;
      border: 2px dashed var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      transform: translate(-50%, -50%);
      cursor: grab;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 8px 0;
    }
    .list {
      max-height: 360px;
      overflow: auto;
    }
    .small {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--divider-color);
      font-size: 11px;
    }
    button {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    button.secondary {
      background: var(--divider-color);
      color: var(--primary-text-color);
    }
    input[type="text"] {
      width: 100%;
      padding: 6px;
    }
    input[type="range"] {
      width: 100%;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._initialize();
  }

  protected updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);
    if (changedProps.has("hass")) {
      this._initialize();
    }
  }

  _initialize() {
    if (!this.hass || this._initialized) return;
    this._initialized = true;
    this._loadConfig();
    this._loadAreas();
  }

  async _loadConfig() {
    if (!this.hass) return;
    const data = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._config = data;
  }

  async _loadAreas() {
    if (!this.hass) return;
    this._areas = await this.hass.callWS({ type: "config/area_registry/list" });
  }

  _debouncedSave() {
    window.clearTimeout(this._saveTimeout);
    this._saveTimeout = window.setTimeout(() => this._saveConfig(), 500);
  }

  async _saveConfig() {
    if (!this.hass || !this._config) return;
    await this.hass.callWS({
      type: "floorplan_manager/set_config",
      config: this._config,
    });
  }

  _updateEntity(entityId: string, updates: Record<string, unknown>) {
    const entities = { ...(this._config?.entities || {}) };
    const current = entities[entityId] || {};
    entities[entityId] = { ...current, ...updates };
    this._config = { ...this._config, entities };
    this._debouncedSave();
  }

  _updateArea(areaId: string, updates: Record<string, unknown>) {
    const areas = { ...(this._config?.areas || {}) };
    const current = areas[areaId] || {};
    areas[areaId] = { ...current, ...updates };
    this._config = { ...this._config, areas };
    this._debouncedSave();
  }

  _setImageUrl(value: string) {
    this._config = { ...this._config, image_url: value };
    this._debouncedSave();
  }

  _handleSearch(ev: Event) {
    this._search = (ev.target as HTMLInputElement).value;
  }

  _filteredEntities() {
    const search = this._search.toLowerCase();
    const entities = Object.keys(this.hass.states);
    return entities.filter((entityId: string) => entityId.toLowerCase().includes(search));
  }

  _handleImageClick(ev: MouseEvent) {
    if (!this._placing || !this._config) return;
    const wrapper = this.shadowRoot?.querySelector(".image-wrapper") as HTMLElement | null;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;

    if (this._placing.type === "entity") {
      this._updateEntity(this._placing.id, { x, y });
    } else if (this._placing.type === "area") {
      this._updateArea(this._placing.id, { x, y });
    }
    this._placing = null;
  }

  _startDrag(ev: PointerEvent, type: "entity" | "area", id: string) {
    ev.preventDefault();
    this._dragging = { type, id };
    const move = (moveEv: PointerEvent) => this._onDrag(moveEv);
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      this._dragging = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  }

  _onDrag(ev: PointerEvent) {
    if (!this._dragging || !this._config) return;
    const wrapper = this.shadowRoot?.querySelector(".image-wrapper") as HTMLElement | null;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;
    if (this._dragging.type === "entity") {
      this._updateEntity(this._dragging.id, { x, y });
    } else {
      this._updateArea(this._dragging.id, { x, y });
    }
  }

  async _uploadFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const resp = await fetch("/api/floorplan_manager/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.hass.auth.data.access_token}`,
      },
      body: form,
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.image_url) {
      this._setImageUrl(data.image_url);
    }
  }

  _renderEntitiesList() {
    if (!this._config) return null;
    return this._filteredEntities().map((entityId: string) => {
      const entity = this.hass.states[entityId];
      const config = this._config?.entities?.[entityId] || {};
      return html`
        <div class="row">
          <div>
            <div>${entityId}</div>
            <div class="small">${entity?.attributes?.friendly_name || ""}</div>
            <div class="small">x: ${config.x ?? "-"} y: ${config.y ?? "-"}</div>
          </div>
          <div>
            <label class="small">
              <input
                type="checkbox"
                .checked=${config.include || false}
                @change=${(ev: Event) =>
                  this._updateEntity(entityId, {
                    include: (ev.target as HTMLInputElement).checked,
                  })}
              />
              include
            </label>
            <button class="secondary" @click=${() => (this._placing = { type: "entity", id: entityId })}>
              Place
            </button>
          </div>
        </div>
      `;
    });
  }

  _renderAreasList() {
    if (!this._config) return null;
    return this._areas.map((area) => {
      const config = this._config?.areas?.[area.id] || {};
      return html`
        <div class="row">
          <div>
            <div>${area.name}</div>
            <div class="small">x: ${config.x ?? "-"} y: ${config.y ?? "-"} r: ${config.r ?? "-"}</div>
          </div>
          <div>
            <label class="small">
              <input
                type="checkbox"
                .checked=${config.include || false}
                @change=${(ev: Event) =>
                  this._updateArea(area.id, {
                    include: (ev.target as HTMLInputElement).checked,
                  })}
              />
              include
            </label>
            <button class="secondary" @click=${() => (this._placing = { type: "area", id: area.id })}>
              Place center
            </button>
          </div>
        </div>
        <div>
          <label class="small">Radius (${config.r ?? 8}%)</label>
          <input
            type="range"
            min="1"
            max="50"
            .value=${config.r ?? 8}
            @input=${(ev: Event) =>
              this._updateArea(area.id, {
                r: Number((ev.target as HTMLInputElement).value),
              })}
          />
        </div>
      `;
    });
  }

  render() {
    if (!this.hass) return html``;
    const imageUrl = this._config?.image_url || "";
    const entities = this._config?.entities || {};
    const areas = this._config?.areas || {};

    return html`
      <div class="layout">
        <div class="section">
          <h2>Entities</h2>
          <input type="text" placeholder="Search entities" @input=${this._handleSearch} />
          <div class="list">${this._renderEntitiesList()}</div>
          <p class="small">Entities render only when include=true and x/y are set.</p>
        </div>
        <div class="section">
          <h2>Floorplan Image</h2>
          <div class="row">
            <input type="file" accept=".png,.jpg,.jpeg,.webp" @change=${this._uploadFile} />
            <span class="pill">Upload</span>
          </div>
          <div class="row">
            <input
              type="text"
              placeholder="/local/floorplan_manager/your.png"
              .value=${imageUrl}
              @input=${(ev: Event) => this._setImageUrl((ev.target as HTMLInputElement).value)}
            />
          </div>
          <div class="small">Click "Place" then click on the image to set coordinates.</div>
          <div class="image-wrapper" @click=${this._handleImageClick}>
            ${imageUrl
              ? html`<img src=${imageUrl} alt="Floorplan" />`
              : html`<div class="small">Upload or enter an image URL.</div>`}
            ${Object.entries(areas).map(([areaId, area]) =>
              area.include && typeof area.x === "number" && typeof area.y === "number" && typeof area.r === "number"
                ? html`<div
                    class="room"
                    style=${`left:${area.x}%; top:${area.y}%; width:${area.r * 2}%; height:${area.r * 2}%;`}
                    @pointerdown=${(ev: PointerEvent) => this._startDrag(ev, "area", areaId)}
                  ></div>`
                : ""
            )}
            ${Object.entries(entities).map(([entityId, entity]) =>
              entity.include && typeof entity.x === "number" && typeof entity.y === "number"
                ? html`<div
                    class="marker"
                    style=${`left:${entity.x}%; top:${entity.y}%;`}
                    title=${entityId}
                    @pointerdown=${(ev: PointerEvent) => this._startDrag(ev, "entity", entityId)}
                  ></div>`
                : ""
            )}
          </div>
        </div>
        <div class="section">
          <h2>Areas</h2>
          <div class="list">${this._renderAreasList()}</div>
          <p class="small">Areas render only when include=true and x/y/r are set.</p>
        </div>
      </div>
    `;
  }
}

customElements.define("ha-panel-floorplan_manager", FloorplanManagerPanel);
