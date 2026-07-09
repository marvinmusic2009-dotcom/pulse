# PowerShell script to resize and generate Android launcher icons using native Windows .NET APIs
Param(
    [string]$srcPath = "C:\Users\ICT CLUB\.gemini\antigravity\brain\d62c04cb-7f2d-44e1-a698-470b7fc1928f\pulse_app_icon_1783588039426.jpg",
    [string]$resDir = "C:\Users\ICT CLUB\.gemini\antigravity\scratch\pulse\android\app\src\main\res"
)

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

# Verify source file
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    Exit 1
}

# Define density mappings and sizes
$sizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

# Function to resize and save image
function Resize-Image {
    param(
        [string]$sourceFile,
        [string]$targetFile,
        [int]$width,
        [int]$height
    )
    
    $srcImg = [System.Drawing.Image]::FromFile($sourceFile)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Set high quality settings
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw image resized
    $g.DrawImage($srcImg, 0, 0, $width, $height)
    
    # Save as PNG
    $bmp.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $srcImg.Dispose()
    $bmp.Dispose()
    $g.Dispose()
}

Write-Host "Starting app icon generation..."

# Resize and replace launcher icons for each density
foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $folderPath = Join-Path $resDir $folder
    
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Force -Path $folderPath | Out-Null
    }
    
    # Target files
    $launcherPath = Join-Path $folderPath "ic_launcher.png"
    $launcherRoundPath = Join-Path $folderPath "ic_launcher_round.png"
    $launcherForegroundPath = Join-Path $folderPath "ic_launcher_foreground.png"
    
    Write-Host "Generating icons for $folder ($($size)x$($size))..."
    Resize-Image $srcPath $launcherPath $size $size
    Resize-Image $srcPath $launcherRoundPath $size $size
    Resize-Image $srcPath $launcherForegroundPath $size $size
}

Write-Host "Icon generation completed successfully!"
