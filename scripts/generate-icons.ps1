# Script to generate PWA icons from SVG
# Requires: ImageMagick or Sharp CLI
# Run this script to generate all required icon sizes

Write-Host "Generating PWA Icons..." -ForegroundColor Cyan

$iconSizes = @(16, 32, 72, 96, 128, 144, 152, 192, 384, 512)
$sourceIcon = "public/icons/icon.svg"
$outputDir = "public/icons"

# Check if source icon exists
if (-not (Test-Path $sourceIcon)) {
    Write-Host "Error: Source icon not found at $sourceIcon" -ForegroundColor Red
    exit 1
}

Write-Host "Source icon: $sourceIcon" -ForegroundColor Green

# Try to use Sharp CLI if available (npm install -g sharp-cli)
$hasSharp = Get-Command sharp -ErrorAction SilentlyContinue

if ($hasSharp) {
    Write-Host "Using Sharp CLI to generate icons..." -ForegroundColor Green
    
    foreach ($size in $iconSizes) {
        $output = Join-Path $outputDir "icon-${size}x${size}.png"
        Write-Host "Generating ${size}x${size}..." -ForegroundColor Yellow
        
        sharp -i $sourceIcon -o $output resize $size $size --fit cover
    }
    
    Write-Host "Icons generated successfully!" -ForegroundColor Green
} else {
    Write-Host "Sharp CLI not found. Checking for ImageMagick..." -ForegroundColor Yellow
    
    $hasMagick = Get-Command magick -ErrorAction SilentlyContinue
    
    if ($hasMagick) {
        Write-Host "Using ImageMagick to generate icons..." -ForegroundColor Green
        
        foreach ($size in $iconSizes) {
            $output = Join-Path $outputDir "icon-${size}x${size}.png"
            Write-Host "Generating ${size}x${size}..." -ForegroundColor Yellow
            
            magick convert -background none $sourceIcon -resize "${size}x${size}" $output
        }
        
        Write-Host "Icons generated successfully!" -ForegroundColor Green
    } else {
        Write-Host @"
Neither Sharp CLI nor ImageMagick found. Please install one of them:

Option 1 - Sharp CLI (Recommended):
  npm install -g sharp-cli

Option 2 - ImageMagick:
  Download from: https://imagemagick.org/script/download.php

Alternative: Use an online tool to convert the SVG to PNG:
  1. Open public/icons/icon.svg in a browser
  2. Use a tool like https://svgtopng.com/ or https://convertio.co/svg-png/
  3. Generate PNG files for these sizes: 16, 32, 72, 96, 128, 144, 152, 192, 384, 512
  4. Save them as icon-[SIZE]x[SIZE].png in public/icons/

"@ -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan
