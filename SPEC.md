# 3D Model Viewer & Image Generator - Specification

## Project Overview
- **Name**: 3D Model Viewer
- **Type**: Electron Desktop Application (also runs as web app)
- **Core Functionality**: Upload 3D model files (3MF, STL, OBJ), preview with rotation, export as images with customizable settings
- **Target Users**: 3D artists, designers, engineers who need quick renders of 3D models

## Tech Stack
- **Framework**: Electron + React 18
- **UI Library**: Radix UI + Tailwind CSS
- **3D Rendering**: Three.js with React Three Fiber
- **Build Tool**: Vite
- **Electron Builder**: electron-builder

## UI/UX Specification

### Layout Structure
- **Main Window**: Single window application (1200x800 default, min 900x600)
- **Left Panel** (320px): Controls and settings
- **Right Area**: 3D Preview canvas (fills remaining space)
- **View Cube**: Fixed position top-right of preview canvas (80x80px)

### Visual Design

#### Color Palette
- **Primary**: #EAB308 (bright yellow - default background)
- **Secondary**: #18181B (dark zinc - panel backgrounds)
- **Accent**: #3B82F6 (blue - buttons, active states)
- **Surface**: #27272A (zinc-800 - input backgrounds)
- **Text Primary**: #FAFAFA (zinc-50)
- **Text Secondary**: #A1A1AA (zinc-400)
- **Border**: #3F3F46 (zinc-700)

#### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 18px semibold
- **Body**: 14px regular
- **Labels**: 12px medium

#### Spacing
- **Panel Padding**: 24px
- **Section Gap**: 20px
- **Input Gap**: 12px

### Components

#### File Upload Zone
- Dashed border area in center when no model loaded
- Drag-and-drop support with visual feedback (border color change)
- Click to open file dialog
- Accepts: .3mf, .stl, .obj files
- States: default, hover (blue border), active (file dragging), error (invalid file)

#### 3D Preview Canvas
- Fills right side of window
- OrbitControls for rotation (mouse drag)
- Auto-centers and scales model to fit with 20% padding
- Cyclorama background (seamless sphere/curved backdrop)

#### View Cube
- 80x80px cube in top-right corner
- Shows current camera orientation
- Interactive (click face to snap to view)
- Semi-transparent background

#### Control Panel
- **Background Color Picker**: Hex input + color swatch
- **Model Color Picker**: Hex input + color swatch
- **Model Roughness Slider**: 0-1 range, default 0.7
- **Model Metalness Slider**: 0-1 range, default 0.1
- **Shadow Intensity Slider**: 0-1 range, default 0.5

#### Export Settings
- **Aspect Ratio**: Radio buttons (16:9, 2:3, 4:3)
- **Resolution**: Dropdown (1280x720, 1920x1080, 2560x1440, 3840x2160)
- **Export Button**: Primary blue, full width

#### Export Resolution Options
| Aspect | 720p | 1080p | 1440p | 2160p |
|--------|------|-------|-------|-------|
| 16:9   | 1280x720 | 1920x1080 | 2560x1440 | 3840x2160 |
| 2:3    | 1080x1620 | 1080x1920* | 1440x2160 | - |
| 4:3    | 1280x960 | 1600x1200 | - | - |

*Note: Resolution values stored as widthxheight, calculated from aspect ratio

## 3D Scene Specification

### Camera
- Perspective camera, FOV 45°
- Initial position: calculated to fit model with padding
- OrbitControls: rotate only (no pan, no zoom limits)
- Damping enabled for smooth movement

### Lighting
- **Directional Light**:
  - Position: (5, 10, 7.5)
  - Intensity: 1.5
  - Cast shadows: true
  - Shadow map size: 2048x2048
  - Shadow bias: -0.0001
- **Ambient Light**:
  - Intensity: 0.3
  - Color: #ffffff

### Materials

#### Model Material (MeshStandardMaterial)
- Default color: #1C1C1C (dark grey)
- Roughness: 0.7 (rough, not shiny)
- Metalness: 0.1 (mostly dielectric)
- Environment map for reflections (subtle)

#### Background/Cyclorama Material
- Color: #EAB308 (bright yellow default)
- Roughness: 1.0 (completely matte)
- Metalness: 0
- No reflections

### Cyclorama Setup
- Large inverted sphere or curved plane
- Radius: 1000 units (very large)
- Position: center at origin, floor at y=0
- Seamless join at floor level (no visible seam)
- Optional: fog to blend distant areas
  - Color matches background
  - Near: 500, Far: 1500

### Model Loading
- File formats: .3mf, .stl, .obj
- Center geometry to bounding box center
- Scale to fit viewport:
  - Calculate bounding box
  - Find max dimension (x, y, or z)
  - Scale so max dimension = viewport height * 0.6 (80% of viewport = 20% padding)
- Position: sit on floor (y = 0 at lowest point of model)
- Never extend beyond viewport bounds

### Shadow Plane
- Shadow only plane (ShadowMaterial with opacity)
- Position: y = 0.001 (slightly above floor to prevent z-fighting)
- Receives shadows from model
- Transparent, not visible except for shadow

## Functionality Specification

### Core Features

1. **File Upload**
   - Drag and drop onto upload zone or canvas
   - Click to open file dialog
   - Validate file extension (.3mf, .stl, .obj)
   - Show loading spinner during parse
   - Display error for invalid files

2. **Model Preview**
   - Real-time 3D rendering
   - Orbit rotation with mouse drag
   - Touch support for mobile
   - Auto-fit model on load

3. **View Cube**
   - Visual indicator of camera orientation
   - 6 face labels (F, B, L, R, U, D)
   - Click to snap to preset views
   - Updates in real-time with camera

4. **Color Controls**
   - Background color picker
   - Model color picker
   - Live preview of changes

5. **Material Controls**
   - Roughness slider
   - Metalness slider
   - Shadow intensity slider

6. **Export**
   - Render at selected resolution
   - Save to same directory as source file, OR
   - Prompt user for save location
   - Output format: PNG

### User Interactions

1. **Initial State**
   - Upload zone visible in center
   - No model loaded

2. **After File Load**
   - Upload zone hidden
   - Model displayed in preview
   - Controls enabled

3. **Export Flow**
   - Click Export button
   - Show loading indicator
   - Render at selected resolution
   - Save file automatically or show save dialog
   - Show success/error notification

### Edge Cases
- Invalid file format: show error toast
- File too large: show error (max 100MB)
- Export while model loading: disable export button
- Window resize: recalculate camera and model scale
- Model with no faces: show error

## Acceptance Criteria

1. ✓ Application launches without errors
2. ✓ Can drag and drop 3MF, STL, OBJ files
3. ✓ Model displays correctly in preview
4. ✓ Can rotate model with mouse
5. ✓ View Cube shows camera orientation
6. ✓ Cyclorama background renders seamlessly
7. ✓ Default colors: yellow background, dark grey model
8. ✓ Material controls affect model appearance
9. ✓ Can change background and model colors
10. ✓ Export produces correct resolution images
11. ✓ Files save to disk successfully
12. ✓ Works offline (Electron)
13. ✓ Can be built as standalone .exe

## File Structure
```
three-d-model-pics/
├── package.json
├── vite.config.ts
├── electron/
│   ├── main.ts
│   └── preload.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── FileUpload.tsx
│   │   ├── PreviewCanvas.tsx
│   │   ├── ViewCube.tsx
│   │   ├── ControlPanel.tsx
│   │   └── ExportSettings.tsx
│   ├── hooks/
│   │   └── useModelLoader.ts
│   └── utils/
│       └── fileUtils.ts
└── index.html
```