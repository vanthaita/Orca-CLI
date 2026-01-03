#!/bin/sh
set -e

# Define variables
REPO="vanthaita/orca-releases"
BINARY_NAME="orca"
INSTALL_DIR="/usr/local/bin"

# Detect OS and Architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
    Linux)
        case "$ARCH" in
            x86_64) TARGET="x86_64-unknown-linux-gnu" ;;
            *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
        esac
        ;;
    Darwin)
        case "$ARCH" in
            x86_64) TARGET="x86_64-apple-darwin" ;;
            arm64) 
                # Currently falling back to x86_64 for M1/M2 if native build isn't available
                # Or fail if you don't support Rosetta. Assuming x86_64 via Rosetta for now given the CI config.
                echo "Warning: Native arm64 build not found, attempting x86_64 (requires Rosetta)..."
                TARGET="x86_64-apple-darwin" 
                ;;
            *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
        esac
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

echo "Detected platform: $OS $ARCH ($TARGET)"

# Construct Download URL
# Using 'latest' release redirect
DOWNLOAD_URL="https://github.com/$REPO/releases/latest/download/orca-${TARGET}.tar.gz"

echo "Downloading Orca from $DOWNLOAD_URL..."

# Create a temporary directory
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Download and extract
curl -sL "$DOWNLOAD_URL" | tar xz -C "$TMP_DIR"

# Install
if [ -f "$TMP_DIR/$BINARY_NAME" ]; then
    echo "Installing to $INSTALL_DIR (requires sudo)..."
    sudo mv "$TMP_DIR/$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"
    sudo chmod +x "$INSTALL_DIR/$BINARY_NAME"
    echo "Successfully installed Orca to $INSTALL_DIR/$BINARY_NAME"
    echo "Run 'orca --help' to get started."
else
    echo "Error: Binary not found in downloaded archive."
    exit 1
fi
