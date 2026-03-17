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

Examples:
    # Export single image for all models in a folder
    python batch_export.py ./my_models

    # Export all 4 rotations for all models
    python batch_export.py ./my_models --all
    
    # With custom delay between exports
    python batch_export.py ./my_models --all --delay 3
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
import time
import platform


def get_app_path():
    """Get the path to the 3D Model Viewer application based on the current platform."""
    system = platform.system()
    
    if system == "Windows":
        # Check common installation locations
        possible_paths = [
            Path("C:/Program Files/3D Model Viewer/3D Model Viewer.exe"),
            Path("C:/Program Files (x86)/3D Model Viewer/3D Model Viewer.exe"),
            Path("./3D Model Viewer.exe"),
            Path("./release/win-unpacked/3D Model Viewer.exe"),
        ]
        for path in possible_paths:
            if path.exists():
                return str(path)
        # Default - assume it's in PATH or current directory
        return "3D Model Viewer.exe"
    
    elif system == "Darwin":  # macOS
        # Check common locations
        possible_paths = [
            Path("/Applications/3D Model Viewer.app"),
            Path("./3D Model Viewer.app"),
            Path("./release/3D Model Viewer.app"),
        ]
        for path in possible_paths:
            if path.exists():
                return str(path)
        return "open '3D Model Viewer.app' --args"
    
    elif system == "Linux":
        possible_paths = [
            Path("./3D Model Viewer"),
            Path("./release/3D Model Viewer"),
            Path("/usr/bin/3D Model Viewer"),
        ]
        for path in possible_paths:
            if path.exists():
                return str(path)
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
    
    try:
        if system == "Windows":
            cmd = [app_path, flag, str(model_path)]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        elif system == "Darwin":
            # macOS uses open command
            cmd = ["open", app_path, "--args", flag, str(model_path)]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        else:  # Linux
            cmd = [app_path, flag, str(model_path)]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"    Error: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"    Error: Application not found at {app_path}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Batch export 3D models to images",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        "directory",
        help="Directory containing 3D model files"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Export all 4 rotations (default: single export)"
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
    
    print(f"Platform: {platform.system()}")
    print(f"Scanning: {directory}")
    models = find_model_files(directory)
    
    if not models:
        print("No 3D model files found.")
        sys.exit(0)
    
    print(f"Found {len(models)} model(s)")
    print(f"Mode: {'All rotations' if args.all else 'Single image'}")
    print()
    
    app_path = get_app_path()
    print(f"Using app: {app_path}")
    print()
    
    success = 0
    failed = 0
    
    for i, model in enumerate(models, 1):
        print(f"[{i}/{len(models)}] {model.parent.name}/{model.name}")
        
        if export_model(app_path, model, args.all):
            success += 1
            print(f"    Done")
        else:
            failed += 1
            print(f"    Failed")
        
        # Small delay between exports
        if i < len(models):
            time.sleep(args.delay)
    
    print()
    print(f"Complete: {success} succeeded, {failed} failed")
    
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
