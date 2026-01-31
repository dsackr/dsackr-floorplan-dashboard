import { s, i as r, x as i } from "./lit-element-BcYsEg54.js";
const a = class a extends s {
  setConfig(t) {
    this.config = t;
  }
  getCardSize() {
    return 4;
  }
  connectedCallback() {
    super.connectedCallback(), this._ensureData();
  }
  async _ensureData() {
    if (!this.hass) return;
    const t = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._data = t;
  }
  _getImageUrl() {
    var t;
    return this.config && this.config.image_url ? this.config.image_url : ((t = this._data) == null ? void 0 : t.image_url) || "";
  }
  render() {
    const t = this._getImageUrl();
    return i`
      <ha-card>
        <div class="card">
          <div class="image-wrapper">
            ${t ? i`<img src=${t} alt="Floorplan" />` : i`<div class="empty">Missing image_url.</div>`}
          </div>
        </div>
      </ha-card>
    `;
  }
};
a.properties = {
  hass: {},
  config: {},
  _data: { state: !0 }
}, a.styles = r`
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
let e = a;
customElements.define("floorplan-manager", e);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "floorplan-manager",
  name: "Floorplan Manager",
  description: "Display a floorplan with tappable rooms and device list."
});
