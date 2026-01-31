# Floorplan Manager v0 Schema

This document defines the **coordinate system** and **v0 data schema** used by Floorplan Manager for the floorplan image, room areas, and entity markers.

## Coordinate System

- **Units:** Percent-based coordinates (`0`–`100`).
- **Origin:** Top-left corner of the floorplan image.
- **Axes:**
  - **X** increases to the right.
  - **Y** increases downward.
- **Normalization:**
  - `x = 0` means the left edge, `x = 100` means the right edge.
  - `y = 0` means the top edge, `y = 100` means the bottom edge.
- **Area radius (`r`)** is also percentage-based and represents a circle radius in the same coordinate space (so `r = 10` is 10% of the image width/height scale, consistent with the percent grid).

## v0 Data Schema

### Top-level

```json
{
  "version": "v0",
  "floorplan": {
    "image_url": "string"
  },
  "areas": [
    {
      "id": "string",
      "name": "string",
      "include": true,
      "x": 0,
      "y": 0,
      "r": 0
    }
  ],
  "entities": [
    {
      "entity_id": "string",
      "name": "string",
      "include": true,
      "x": 0,
      "y": 0
    }
  ]
}
```

### Field Details

#### `version`
- **Type:** string
- **Value:** Must be `"v0"`.

#### `floorplan`
- **Type:** object
- **Required fields:**
  - `image_url` (string): URL or path to the floorplan image.

#### `areas[]`
Each area represents a tappable circular target and a room center.
- `id` (string): Unique identifier for the area.
- `name` (string): Display name for the area.
- `include` (boolean): Whether to show the area on the floorplan.
- `x` (number): X coordinate (percent).
- `y` (number): Y coordinate (percent).
- `r` (number): Radius (percent).

#### `entities[]`
Each entity represents a marker on the floorplan.
- `entity_id` (string): Home Assistant entity ID.
- `name` (string): Display name for the marker.
- `include` (boolean): Whether to show the entity on the floorplan.
- `x` (number): X coordinate (percent).
- `y` (number): Y coordinate (percent).

## Examples

### Example 1: Living Room + Light Marker

```json
{
  "version": "v0",
  "floorplan": {
    "image_url": "/local/floorplan_manager/house.png"
  },
  "areas": [
    {
      "id": "living_room",
      "name": "Living Room",
      "include": true,
      "x": 42.5,
      "y": 58.0,
      "r": 12.0
    }
  ],
  "entities": [
    {
      "entity_id": "light.living_room_lamp",
      "name": "Lamp",
      "include": true,
      "x": 47.0,
      "y": 52.0
    }
  ]
}
```

### Example 2: Kitchen + Temperature Sensor

```json
{
  "version": "v0",
  "floorplan": {
    "image_url": "https://example.com/floorplans/main_level.jpg"
  },
  "areas": [
    {
      "id": "kitchen",
      "name": "Kitchen",
      "include": true,
      "x": 18.0,
      "y": 30.0,
      "r": 9.5
    }
  ],
  "entities": [
    {
      "entity_id": "sensor.kitchen_temperature",
      "name": "Kitchen Temp",
      "include": true,
      "x": 21.0,
      "y": 28.5
    }
  ]
}
```

## Acceptance Criteria

- The document defines the **coordinate system** (origin, axes, percent units, and radius interpretation).
- The v0 schema lists **floorplan**, **areas (circle x/y/r)**, and **entities (x/y)** fields with types and usage.
- Two **concrete numeric examples** are provided and use valid percent-based coordinates.
