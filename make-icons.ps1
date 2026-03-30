Add-Type -AssemblyName System.Drawing

$bmp16 = New-Object System.Drawing.Bitmap(16, 16)
$g16 = [System.Drawing.Graphics]::FromImage($bmp16)
$g16.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Arial', 8, [System.Drawing.FontStyle]::Bold)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g16.DrawString('M', $font, $brush, (New-Object System.Drawing.RectangleF(0, 0, 16, 16)), $sf)
$bmp16.Save("icons\icon16.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g16.Dispose()
$bmp16.Dispose()

$bmp48 = New-Object System.Drawing.Bitmap(48, 48)
$g48 = [System.Drawing.Graphics]::FromImage($bmp48)
$g48.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))
$font48 = New-Object System.Drawing.Font('Arial', 24, [System.Drawing.FontStyle]::Bold)
$g48.DrawString('M', $font48, $brush, (New-Object System.Drawing.RectangleF(0, 0, 48, 48)), $sf)
$bmp48.Save("icons\icon48.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g48.Dispose()
$bmp48.Dispose()

$bmp128 = New-Object System.Drawing.Bitmap(128, 128)
$g128 = [System.Drawing.Graphics]::FromImage($bmp128)
$g128.Clear([System.Drawing.Color]::FromArgb(99, 102, 241))
$font128 = New-Object System.Drawing.Font('Arial', 64, [System.Drawing.FontStyle]::Bold)
$g128.DrawString('M', $font128, $brush, (New-Object System.Drawing.RectangleF(0, 0, 128, 128)), $sf)
$bmp128.Save("icons\icon128.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g128.Dispose()
$bmp128.Dispose()

Write-Host "All icons created!"
