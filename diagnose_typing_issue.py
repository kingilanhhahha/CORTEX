#!/usr/bin/env python3
"""
Diagnostic script to find typing module issues
Run this on your Raspberry Pi to identify the problem
"""

import os
import sys

print("="*60)
print("TYPING MODULE DIAGNOSTIC TOOL")
print("="*60)
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Python prefix: {sys.prefix}")
print()

# Check for typing.py files
print("Checking for typing.py files that might shadow standard library...")
found_files = []
for root, dirs, files in os.walk('.'):
    # Skip common directories
    if any(skip in root for skip in ['.git', '__pycache__', 'node_modules', '.venv', 'venv']):
        continue
    
    if 'typing.py' in files:
        full_path = os.path.join(root, 'typing.py')
        found_files.append(full_path)
        print(f"  FOUND: {full_path}")

if not found_files:
    print("  ✓ No typing.py files found")
else:
    print(f"\n  ⚠ WARNING: Found {len(found_files)} typing.py file(s) that may shadow the standard library!")
    print("  Solution: Rename or delete these files")

print()

# Check for typing directories
print("Checking for typing/ directories...")
found_dirs = []
for root, dirs, files in os.walk('.'):
    if any(skip in root for skip in ['.git', '__pycache__', 'node_modules', '.venv', 'venv']):
        continue
    
    if 'typing' in dirs:
        full_path = os.path.join(root, 'typing')
        found_dirs.append(full_path)
        print(f"  FOUND: {full_path}")

if not found_dirs:
    print("  ✓ No typing/ directories found")
else:
    print(f"\n  ⚠ WARNING: Found {len(found_dirs)} typing/ directory(ies)!")
    print("  Solution: Rename or delete these directories")

print()

# Try to import typing
print("Testing typing module import...")
try:
    import typing
    typing_file = getattr(typing, '__file__', None)
    if typing_file:
        print(f"  ✓ typing module imported successfully")
        print(f"  Location: {typing_file}")
        
        # Check if it's from standard library or local
        if typing_file.startswith(sys.prefix):
            print("  ✓ This appears to be the standard library typing module")
        else:
            print(f"  ⚠ WARNING: This typing module is NOT from the standard library!")
            print(f"  It's located at: {typing_file}")
            print("  This may be causing the conflict!")
    else:
        print("  ✓ typing module imported (built-in)")
    
    # Check for typing.io (which shouldn't exist)
    if hasattr(typing, 'io'):
        print("  ⚠ WARNING: typing.io exists - this shouldn't be in standard library!")
    else:
        print("  ✓ typing.io does not exist (correct)")
        
except ImportError as e:
    print(f"  ✗ ERROR: Cannot import typing module: {e}")
    print("  This is the root cause of your problem!")
    print()
    print("  Possible causes:")
    print("  1. Python version is too old (needs Python 3.5+)")
    print("  2. Python installation is corrupted")
    print("  3. A file named typing.py is shadowing the standard library")
    print()
    print("  Try running: python3 -c 'import typing; print(typing.__file__)'")

print()

# Check Python path
print("Python path (sys.path):")
for i, path in enumerate(sys.path):
    print(f"  [{i}] {path}")

print()
print("="*60)
print("DIAGNOSTIC COMPLETE")
print("="*60)
print()
print("If you found typing.py files or typing/ directories, rename or delete them.")
print("Then try running the API again.")













