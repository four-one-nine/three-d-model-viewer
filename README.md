# 3D Model Viewer

A cross-platform desktop application for viewing 3D models and exporting them as images with automatic shadows and lighting.

![3D Model Viewer

## Features

- **3D Model Support**: Load and view .3mf, .stl, and .obj files
- **Real-time Rendering**: High-quality shadows with AccumulativeShadows
- **Flexible Camera**: Automatic camera positioning based on model dimensions
- **Model Transformations**: Flip models in 90° increments
- **Customizable Appearance**: Adjust model color, roughness, and metalness
- **Background Control**: Choose custom background colors
- **Export Options**: Multiple resolution and aspect ratio options
- **Command Line Interface**: Automate exports with CLI flags

## Backend

- **Electron**: Cross-platform desktop framework
- **React**: UI framework
- **Three.js**: 3D rendering engine
- **React Three Fiber**: React renderer for Three.js
- **Drei**: Useful helpers for React Three Fiber
- **Tailwind CSS**: Styling

## Getting Started

### Installation

> **For most users**: Download pre-built releases from the [GitHub Releases](https://github.com/anomalyco/three-d-model-pics/releases) page. Building from source is only recommended for developers or those who need custom modifications.

Download the appropriate release for your operating system from the Releases page:

- **Windows**: `3D Model Viewer Setup.exe` (installer) or `win-unpacked/` (portable)
- **macOS**: `3D Model Viewer.dmg`
- **Linux**: `3D Model Viewer.AppImage`

### Running the Application

1. Launch the application
2. Drag and drop a 3D model file (.3mf, .stl, or .obj) onto the window
3. Or click to browse and select a file

### Controls

- **Rotate**: Click and drag on the model to rotate
- **Flip**: Click the flip button to rotate 90° clockwise
- **Export**: Click export to save the current view as a PNG image

### Settings

- **Model Color**: Adjust the base color of the model
- **Roughness**: Control surface roughness (0 = glossy, 1 = matte)
- **Metalness**: Control metallic appearance (0 = non-metal, 1 = metal)
- **Background**: Choose a background color
- **Export Resolution**: Select from various resolutions (1080p, 4K, etc.)
- **Aspect Ratio**: Choose between 16:9, 4:3, 1:1, or 9:16

## Command Line Usage

The application supports command line arguments for automated batch processing.

### Syntax

```bash
# Windows
"3D Model Viewer.exe" [flags] [model_file]

# macOS
open "3D Model Viewer.app" --args [flags] [model_file]

# Linux
./3D\ Model\ Viewer [flags] [model_file]
```

### Flags

| Flag | Description |
|------|-------------|
| `-e`, `--export` | Export a single image (1920x1440, 4:3) |
| `-a`, `--all` | Export 4 images with rotations (0°, 90°, 180°, 270°) |

### Examples

#### Windows

```cmd
# Export single image
"C:\Program Files\3D Model Viewer\3D Model Viewer.exe" -e "C:\models\part.stl"

# Export all 4 rotations
"C:\Program Files\3D Model Viewer\3D Model Viewer.exe" -a "C:\models\part.stl"

# With full path to portable version
"C:\tools\3D Model Viewer\3D Model Viewer.exe" -a "C:\models\part.stl"
```

#### macOS

```bash
# Export single image
open "3D Model Viewer.app" --args -e ~/models/part.stl

# Export all 4 rotations
open "3D Model Viewer.app" --args -a ~/models/part.stl
```

#### Linux

```bash
# Export single image
./3D\ Model\ Viewer -e ~/models/part.stl

# Export all 4 rotations
./3D\ Model\ Viewer -a ~/models/part.stl
```

### Output Files

When using export flags, images are saved to the same directory as the source model:

- Single export: `modelname_1920x1440.png`
- All exports: 
  - `modelname_1920x1440_rot0.png`
  - `modelname_1920x1440_rot1.png`
  - `modelname_1920x1440_rot2.png`
  - `modelname_1920x1440_rot3.png`

## Batch Processing Example

Here's a Python script that finds all 3D model files in a folder and exports images for each:

```python
#!/usr/bin/env python3
"""
Batch export 3D models using 3D Model Viewer CLI.

This script finds all .3mf, .stl, and .obj files in a directory
and exports images for each using the 3D Model Viewer application.

Usage:
    python batch_export.py <models_directory> [--all]
    
Arguments:
    models_directory    Path to directory containing 3D model files
    --all              Export all 4 rotations (default: single export)
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
import time
import platform


def get_app_path():
    """Get the path to the 3D Model Viewer application."""
    system = platform.system()
    
    if system == "Windows":
        # Check common installation locations
        possible_paths = [
            Path("C:/Program Files/3D Model Viewer/3D Model Viewer.exe"),
            Path("C:/Program Files (x86)/3D Model Viewer/3D Model Viewer.exe"),
            Path("./3D Model Viewer.exe"),
        ]
        for path in possible_paths:
            if path.exists():
                return str(path)
        return "3D Model Viewer.exe"
    
    elif system == "Darwin":  # macOS
        return "open '3D Model Viewer.app' --args"
    
    elif system == "Linux":
        return "./3D Model Viewer"
    
    return "3D Model Viewer"


def find_model_files(directory):
    """Find all supported 3D model files in directory."""
    extensions = {'.3mf', '.stl', '.obj'}
    models = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            if Path(file).suffix.lower() in extensions:
                models.append(Path(root) / file)
    
    return models


def export_model(app_path, model_path, export_all=False):
    """Export model using CLI."""
    flag = "-a" if export_all else "-e"
    
    system = platform.system()
    
    if system == "Windows":
        cmd = [app_path, flag, str(model_path)]
    elif system == "Darwin":
        cmd = f"{app_path} {flag} '{model_path}'"
        cmd = cmd.split()
    else:  # Linux
        cmd = [app_path, flag, str(model_path)]
    
    try:
        print(f"  Exporting: {model_path.name}")
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  Error: {e.stderr}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch export 3D models to images"
    )
    parser.add_argument(
        "directory",
        help="Directory containing 3D model files"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Export all 4 rotations"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.0,
        help="Delay between exports in seconds (default: 2)"
    )
    
    args = parser.parse_args()
    
    directory = Path(args.directory)
    if not directory.exists():
        print(f"Error: Directory not found: {directory}")
        sys.exit(1)
    
    print(f"Scanning: {directory}")
    models = find_model_files(directory)
    
    if not models:
        print("No 3D model files found.")
        sys.exit(0)
    
    print(f"Found {len(models)} model(s)")
    print(f"Mode: {'All rotations' if args.all else 'Single image'}")
    print()
    
    app_path = get_app_path()
    success = 0
    failed = 0
    
    for i, model in enumerate(models, 1):
        print(f"[{i}/{len(models)}] {model.parent.name}/")
        
        if export_model(app_path, model, args.all):
            success += 1
        else:
            failed += 1
        
        # Small delay between exports
        if i < len(models):
            time.sleep(args.delay)
    
    print()
    print(f"Complete: {success} succeeded, {failed} failed")
    
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
```

### Using the Python Script

```bash
# Export single image for all models in a folder
python batch_export.py ./my_models

# Export all 4 rotations for all models
python batch_export.py ./my_models --all

# With custom delay between exports
python batch_export.py ./my_models --all --delay 3
```

## Building from Source

### Prerequisites

- Node.js 18+
- npm 9+

### Build Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for current platform
npm run electron:build

# Build for all platforms (requires platform-specific tools)
npm run electron:build -- -m
```

### Build Output

After building, executables are located in:
- Windows: `release/win-unpacked/` (or use the installer from GitHub Releases)

> **Note**: Building for macOS requires running on macOS, and building for Linux requires running on Linux. Use GitHub Actions or a CI/CD pipeline for cross-platform builds.

## License

MIT License

## Acknowledgments

Built with:
- [Electron](https://electronjs.org/)
- [Three.js](https://threejs.org/)
- [React](https://react.dev/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
