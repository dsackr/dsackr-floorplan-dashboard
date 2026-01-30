# Floorplan Manager

Home Assistant custom integration + Lovelace card for managing a floorplan image with tappable room areas and entity markers.

## Features
- Upload or set a floorplan image URL.
- Place entity markers using percent-based coordinates.
- Place room centers and tap hit targets (circle radius in percent).
- Lovelace card renders the floorplan and shows room devices below.

## Installation (HACS)
1. Add this repository to HACS as a custom repository.
2. Install **Floorplan Manager** from HACS.
3. Restart Home Assistant.
4. Go to **Settings > Devices & Services** and add **Floorplan Manager**.
5. Open the sidebar **Floorplan Setup** panel to configure the image, entities, and areas.

## Lovelace Card
Add the card as a resource (HACS typically handles this), then use:

```yaml
type: custom:floorplan-manager
# Optional override:
# image_url: /local/floorplan_manager/my_floorplan.jpg
```

## Usage
- **Entities** appear only when `include=true` and `x/y` are set.
- **Areas** appear only when `include=true` and `x/y/r` are set.
- Tap a room circle to show the device list for that area below the image.

## Screenshots
- Floorplan Setup Panel (placeholder)
- Floorplan Lovelace Card (placeholder)

## Development
Frontend source lives in `frontend/` and builds into `custom_components/floorplan_manager/www/`.

```bash
cd frontend
npm install
npm run build
```
