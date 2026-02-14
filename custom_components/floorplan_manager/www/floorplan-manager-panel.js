import { s as h, i as u, x as l } from "./lit-element-BcYsEg54.js";
const c = class c extends h {
  constructor() {
    super(...arguments), this._areas = [], this._search = "", this._initialized = !1;
  }
  connectedCallback() {
    super.connectedCallback(), this._initialize();
  }
  updated(i) {
    super.updated(i), i.has("hass") && this._initialize();
  }
  _initialize() {
    !this.hass || this._initialized || (this._initialized = !0, this._loadConfig(), this._loadAreas());
  }
  async _loadConfig() {
    if (!this.hass) return;
    const i = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._config = i;
  }
  async _loadAreas() {
    this.hass && (this._areas = await this.hass.callWS({ type: "config/area_registry/list" }));
  }
  _debouncedSave() {
    window.clearTimeout(this._saveTimeout), this._saveTimeout = window.setTimeout(() => this._saveConfig(), 500);
  }
  async _saveConfig() {
    !this.hass || !this._config || await this.hass.callWS({
      type: "floorplan_manager/set_config",
      config: this._config
    });
  }
  _updateEntity(i, e) {
    var s;
    const t = { ...((s = this._config) == null ? void 0 : s.entities) || {} }, a = t[i] || {};
    t[i] = { ...a, ...e }, this._config = { ...this._config, entities: t }, this._debouncedSave();
  }
  _updateArea(i, e) {
    var s;
    const t = { ...((s = this._config) == null ? void 0 : s.areas) || {} }, a = t[i] || {};
    t[i] = { ...a, ...e }, this._config = { ...this._config, areas: t }, this._debouncedSave();
  }
  _setImageUrl(i) {
    this._config = { ...this._config, image_url: i }, this._debouncedSave();
  }
  _handleSearch(i) {
    this._search = i.target.value;
  }
  _filteredEntities() {
    const i = this._search.toLowerCase();
    return Object.keys(this.hass.states).filter((t) => t.toLowerCase().includes(i));
  }
  _handleImageClick(i) {
    var r;
    if (!this._placing || !this._config) return;
    const e = (r = this.shadowRoot) == null ? void 0 : r.querySelector(".image-wrapper");
    if (!e) return;
    const t = e.getBoundingClientRect(), a = (i.clientX - t.left) / t.width * 100, s = (i.clientY - t.top) / t.height * 100;
    this._placing.type === "entity" ? this._updateEntity(this._placing.id, { x: a, y: s }) : this._placing.type === "area" && this._updateArea(this._placing.id, { x: a, y: s }), this._placing = null;
  }
  _startDrag(i, e, t) {
    i.preventDefault(), this._dragging = { type: e, id: t };
    const a = (r) => this._onDrag(r), s = () => {
      window.removeEventListener("pointermove", a), window.removeEventListener("pointerup", s), this._dragging = null;
    };
    window.addEventListener("pointermove", a), window.addEventListener("pointerup", s);
  }
  _onDrag(i) {
    var r;
    if (!this._dragging || !this._config) return;
    const e = (r = this.shadowRoot) == null ? void 0 : r.querySelector(".image-wrapper");
    if (!e) return;
    const t = e.getBoundingClientRect(), a = (i.clientX - t.left) / t.width * 100, s = (i.clientY - t.top) / t.height * 100;
    this._dragging.type === "entity" ? this._updateEntity(this._dragging.id, { x: a, y: s }) : this._updateArea(this._dragging.id, { x: a, y: s });
  }
  async _uploadFile(i) {
    var r;
    const e = (r = i.target.files) == null ? void 0 : r[0];
    if (!e) return;
    const t = new FormData();
    t.append("file", e);
    const a = await fetch("/api/floorplan_manager/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.hass.auth.data.access_token}`
      },
      body: t
    });
    if (!a.ok) return;
    const s = await a.json();
    s.image_url && this._setImageUrl(s.image_url);
  }
  _renderEntitiesList() {
    return this._config ? this._filteredEntities().map((i) => {
      var a, s, r;
      const e = this.hass.states[i], t = ((s = (a = this._config) == null ? void 0 : a.entities) == null ? void 0 : s[i]) || {};
      return l`
        <div class="row">
          <div>
            <div>${i}</div>
            <div class="small">${((r = e == null ? void 0 : e.attributes) == null ? void 0 : r.friendly_name) || ""}</div>
            <div class="small">x: ${t.x ?? "-"} y: ${t.y ?? "-"}</div>
          </div>
          <div>
            <label class="small">
              <input
                type="checkbox"
                .checked=${t.include || !1}
                @change=${(o) => this._updateEntity(i, {
        include: o.target.checked
      })}
              />
              include
            </label>
            <button class="secondary" @click=${() => this._placing = { type: "entity", id: i }}>
              Place
            </button>
          </div>
        </div>
      `;
    }) : null;
  }
  _renderAreasList() {
    return this._config ? this._areas.map((i) => {
      var t, a;
      const e = ((a = (t = this._config) == null ? void 0 : t.areas) == null ? void 0 : a[i.id]) || {};
      return l`
        <div class="row">
          <div>
            <div>${i.name}</div>
            <div class="small">x: ${e.x ?? "-"} y: ${e.y ?? "-"} r: ${e.r ?? "-"}</div>
          </div>
          <div>
            <label class="small">
              <input
                type="checkbox"
                .checked=${e.include || !1}
                @change=${(s) => this._updateArea(i.id, {
        include: s.target.checked
      })}
              />
              include
            </label>
            <button class="secondary" @click=${() => this._placing = { type: "area", id: i.id }}>
              Place center
            </button>
          </div>
        </div>
        <div>
          <label class="small">Radius (${e.r ?? 8}%)</label>
          <input
            type="range"
            min="1"
            max="50"
            .value=${e.r ?? 8}
            @input=${(s) => this._updateArea(i.id, {
        r: Number(s.target.value)
      })}
          />
        </div>
      `;
    }) : null;
  }
  render() {
    var a, s, r;
    if (!this.hass) return l``;
    const i = ((a = this._config) == null ? void 0 : a.image_url) || "", e = ((s = this._config) == null ? void 0 : s.entities) || {}, t = ((r = this._config) == null ? void 0 : r.areas) || {};
    return l`
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
              .value=${i}
              @input=${(o) => this._setImageUrl(o.target.value)}
            />
          </div>
          <div class="small">Click "Place" then click on the image to set coordinates.</div>
          <div class="image-wrapper" @click=${this._handleImageClick}>
            ${i ? l`<img src=${i} alt="Floorplan" />` : l`<div class="small">Upload or enter an image URL.</div>`}
            ${Object.entries(t).map(
      ([o, n]) => n.include && typeof n.x == "number" && typeof n.y == "number" && typeof n.r == "number" ? l`<div
                    class="room"
                    style=${`left:${n.x}%; top:${n.y}%; width:${n.r * 2}%; height:${n.r * 2}%;`}
                    @pointerdown=${(d) => this._startDrag(d, "area", o)}
                  ></div>` : ""
    )}
            ${Object.entries(e).map(
      ([o, n]) => n.include && typeof n.x == "number" && typeof n.y == "number" ? l`<div
                    class="marker"
                    style=${`left:${n.x}%; top:${n.y}%;`}
                    title=${o}
                    @pointerdown=${(d) => this._startDrag(d, "entity", o)}
                  ></div>` : ""
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
};
c.properties = {
  hass: {},
  _config: { state: !0 },
  _areas: { state: !0 },
  _search: { state: !0 },
  _placing: { state: !0 },
  _dragging: { state: !1 }
}, c.styles = u`
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
let p = c;
customElements.define("ha-panel-floorplan_manager", p);
