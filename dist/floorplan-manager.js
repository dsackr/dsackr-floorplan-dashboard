class FloorplanManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, Helvetica, sans-serif;
          padding: 12px;
        }
        .message {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 12px;
          background: #f7f7f7;
        }
      </style>
      <div class="message">Floorplan Manager: smoke test OK</div>
    `;
  }
}

customElements.define("floorplan-manager", FloorplanManager);
