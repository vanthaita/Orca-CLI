# Orca CLI Homebrew Formula
# This file will be automatically updated by the release workflow

class Orca < Formula
  desc "AI-native Git workflow automation for modern developers"
  homepage "https://orcacli.codes"
  version "0.1.14"
  license "MIT"

  on_macos do
    if Hardware::CPU.intel?
      url "https://github.com/vanthaita/orca-releases/releases/download/v0.1.14/orca-x86_64-apple-darwin.tar.gz"
      sha256 "REPLACE_WITH_ACTUAL_SHA256_INTEL"
    else
      # Apple Silicon - fallback to Intel with Rosetta
      url "https://github.com/vanthaita/orca-releases/releases/download/v0.1.14/orca-x86_64-apple-darwin.tar.gz"
      sha256 "REPLACE_WITH_ACTUAL_SHA256_ARM"
    end
  end

  on_linux do
    if Hardware::CPU.intel?
      url "https://github.com/vanthaita/orca-releases/releases/download/v0.1.14/orca-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "REPLACE_WITH_ACTUAL_SHA256_LINUX"
    end
  end

  def install
    bin.install "orca"
  end

  test do
    system "#{bin}/orca", "--version"
  end
end
