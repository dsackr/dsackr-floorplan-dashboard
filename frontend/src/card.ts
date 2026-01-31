import { LitElement, css, html } from "lit";

interface FloorplanConfig {
  image_url?: string | null;
}

class FloorplanManagerCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _data: { state: true },
  };

  hass: any;
  config: any;
  _data?: FloorplanConfig;

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
  }

  async _ensureData() {
    if (!this.hass) return;
    const data = await this.hass.callWS({ type: "floorplan_manager/get_config" });
    this._data = data;
  }

  _getImageUrl() {
    if (this.config && this.config.image_url) {
      return this.config.image_url;
    }
    return this._data?.image_url || "";
  }

  render() {
    const imageUrl = this._getImageUrl();

    return html`
      <ha-card>
        <div class="card">
          <div class="image-wrapper">
            ${imageUrl
              ? html`<img src=${imageUrl} alt="Floorplan" />`
              : html`<div class="empty">Missing image_url.</div>`}
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
