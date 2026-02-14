import { s as e, i as r, x as a } from "./lit-element-BcYsEg54.js";
const t = class t extends e {
  constructor() {
    super(...arguments), this._initialized = !1;
  }
  setConfig(i) {
    this.config = i;
  }
  getCardSize() {
    return 4;
  }
  connectedCallback() {
    super.connectedCallback(), this._initialize();
  }
  updated(i) {
    super.updated(i), i.has("hass") && this._initialize();
  }
  _initialize() {
    !this.hass || this._initialized || (this._initialized = !0, this._ensureData());
  }
  async _ensureData() {
    if (!this.hass) return;
    const i = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._data = i;
  }
  _getImageUrl() {
    var i;
    return this.config && this.config.image_url ? this.config.image_url : ((i = this._data) == null ? void 0 : i.image_url) || "";
  }
  render() {
    const i = this._getImageUrl();
    return a`
      <ha-card>
        <div class="card">
          <div class="image-wrapper">
            ${i ? a`<img src=${i} alt="Floorplan" />` : a`<div class="empty">Missing image_url.</div>`}
          </div>
        </div>
      </ha-card>
    `;
  }
};
t.properties = {
  hass: {},
  config: {},
  _data: { state: !0 }
}, t.styles = r`
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
    .empty {
      color: var(--secondary-text-color);
      font-style: italic;
    }
  `;
let s = t;
customElements.define("floorplan-manager", s);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "floorplan-manager",
  name: "Floorplan Manager",
  description: "Display a floorplan with tappable rooms and device list."
});
