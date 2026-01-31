import { s as h, i as g, x as c } from "./lit-element-BcYsEg54.js";
const l = class l extends h {
  constructor() {
    super(...arguments), this._areas = [], this._search = "";
  }
  connectedCallback() {
    super.connectedCallback(), this._loadConfig(), this._loadAreas();
  }
  async _loadConfig() {
    if (!this.hass) return;
    const t = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._config = t;
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
  _updateEntity(t, i) {
    var s;
    const e = { ...((s = this._config) == null ? void 0 : s.entities) || {} }, a = e[t] || {};
    e[t] = { ...a, ...i }, this._config = { ...this._config, entities: e }, this._debouncedSave();
  }
  _updateArea(t, i) {
    var s;
    const e = { ...((s = this._config) == null ? void 0 : s.areas) || {} }, a = e[t] || {};
    e[t] = { ...a, ...i }, this._config = { ...this._config, areas: e }, this._debouncedSave();
  }
  _setImageUrl(t) {
    this._config = { ...this._config, image_url: t }, this._debouncedSave();
  }
  _handleSearch(t) {
    this._search = t.target.value;
  }
  _filteredEntities() {
    const t = this._search.toLowerCase();
    return Object.keys(this.hass.states).filter((e) => e.toLowerCase().includes(t));
  }
  _handleImageClick(t) {
    var r;
    if (!this._placing || !this._config) return;
    const i = (r = this.shadowRoot) == null ? void 0 : r.querySelector(".image-wrapper");
    if (!i) return;
    const e = i.getBoundingClientRect(), a = (t.clientX - e.left) / e.width * 100, s = (t.clientY - e.top) / e.height * 100;
    this._placing.type === "entity" ? this._updateEntity(this._placing.id, { x: a, y: s }) : this._placing.type === "area" && this._updateArea(this._placing.id, { x: a, y: s }), this._placing = null;
  }
  _startDrag(t, i, e) {
    t.preventDefault(), this._dragging = { type: i, id: e };
    const a = (r) => this._onDrag(r), s = () => {
      window.removeEventListener("pointermove", a), window.removeEventListener("pointerup", s), this._dragging = null;
    };
    window.addEventListener("pointermove", a), window.addEventListener("pointerup", s);
  }
  _onDrag(t) {
    var r;
    if (!this._dragging || !this._config) return;
    const i = (r = this.shadowRoot) == null ? void 0 : r.querySelector(".image-wrapper");
    if (!i) return;
    const e = i.getBoundingClientRect(), a = (t.clientX - e.left) / e.width * 100, s = (t.clientY - e.top) / e.height * 100;
    this._dragging.type === "entity" ? this._updateEntity(this._dragging.id, { x: a, y: s }) : this._updateArea(this._dragging.id, { x: a, y: s });
  }
  async _uploadFile(t) {
    var r;
    const i = (r = t.target.files) == null ? void 0 : r[0];
    if (!i) return;
    const e = new FormData();
    e.append("file", i);
    const a = await fetch("/api/floorplan_manager/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.hass.auth.data.access_token}`
      },
      body: e
    });
    if (!a.ok) return;
    const s = await a.json();
    s.image_url && this._setImageUrl(s.image_url);
  }
  _renderEntitiesList() {
    return this._config ? this._filteredEntities().map((t) => {
      var a, s, r;
      const i = this.hass.states[t], e = ((s = (a = this._config) == null ? void 0 : a.entities) == null ? void 0 : s[t]) || {};
      return c`
        <div class="row">
          <div>
            <div>${t}</div>
            <div class="small">${((r = i == null ? void 0 : i.attributes) == null ? void 0 : r.friendly_name) || ""}</div>
            <div class="small">x: ${e.x ?? "-"} y: ${e.y ?? "-"}</div>
          </div>
          <div>
            <label class="small">
              <input
                type="checkbox"
                .checked=${e.include || !1}
                @change=${(o) => this._updateEntity(t, {
        include: o.target.checked
      })}
              />
              include
            </label>
            <button class="secondary" @click=${() => this._placing = { type: "entity", id: t }}>
              Place
            </button>
          </div>
        </div>
      `;
    }) : null;
  }
  _renderAreasList() {
    return this._config ? this._areas.map((t) => {
      var e, a;
      const i = ((a = (e = this._config) == null ? void 0 : e.areas) == null ? void 0 : a[t.id]) || {};
      return c`
        <div class="row">
          <div>
            <div>${t.name}</div>
            <div class="small">x: ${i.x ?? "-"} y: ${i.y ?? "-"} r: ${i.r ?? "-"}</div>
          </div>
          <div>
            <label class="small">
              <input
                type="checkbox"
                .checked=${i.include || !1}
                @change=${(s) => this._updateArea(t.id, {
        include: s.target.checked
      })}
              />
              include
            </label>
            <button class="secondary" @click=${() => this._placing = { type: "area", id: t.id }}>
              Place center
            </button>
          </div>
        </div>
        <div>
          <label class="small">Radius (${i.r ?? 8}%)</label>
          <input
            type="range"
            min="1"
            max="50"
            .value=${i.r ?? 8}
            @input=${(s) => this._updateArea(t.id, {
        r: Number(s.target.value)
      })}
          />
        </div>
      `;
    }) : null;
  }
  render() {
    var a, s, r;
    if (!this.hass) return c``;
    const t = ((a = this._config) == null ? void 0 : a.image_url) || "", i = ((s = this._config) == null ? void 0 : s.entities) || {}, e = ((r = this._config) == null ? void 0 : r.areas) || {};
    return c`
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
              .value=${t}
              @input=${(o) => this._setImageUrl(o.target.value)}
            />
          </div>
          <div class="small">Click "Place" then click on the image to set coordinates.</div>
          <div class="image-wrapper" @click=${this._handleImageClick}>
            ${t ? c`<img src=${t} alt="Floorplan" />` : c`<div class="small">Upload or enter an image URL.</div>`}
            ${Object.entries(e).map(
      ([o, n]) => n.include && typeof n.x == "number" && typeof n.y == "number" && typeof n.r == "number" ? c`<div
                    class="room"
                    style=${`left:${n.x}%; top:${n.y}%; width:${n.r * 2}%; height:${n.r * 2}%;`}
                    @pointerdown=${(d) => this._startDrag(d, "area", o)}
                  ></div>` : ""
    )}
            ${Object.entries(i).map(
      ([o, n]) => n.include && typeof n.x == "number" && typeof n.y == "number" ? c`<div
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
l.properties = {
  hass: {},
  _config: { state: !0 },
  _areas: { state: !0 },
  _search: { state: !0 },
  _placing: { state: !0 },
  _dragging: { state: !1 }
}, l.styles = g`
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
let p = l;
customElements.define("ha-panel-floorplan_manager", p);
