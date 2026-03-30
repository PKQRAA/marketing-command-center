Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param([int]$size, [string]$path)
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    
    # Background gradient effect (simplified)
    $brush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(99, 102, 241))
    $brush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(139, 92, 246))
    
    # Draw rounded rectangle background
    $path_obj = New-Object System.Drawing.Drawing2D.GraphicsPath
    $radius = [int]($size * 0.2)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $path_obj.AddArc($rect.X, $rect.Y, $radius * 2, $radius * 2, 180, 90)
    $path_obj.AddArc($rect.Right - $radius * 2, $rect.Y, $radius * 2, $radius * 2, 270, 90)
    $path_obj.AddArc($rect.Right - $radius * 2, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path_obj.AddArc($rect.X, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path_obj.CloseFigure()
    $g.FillPath($brush1, $path_obj)
    
    # Draw "M" letter
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $fontSize = [math]::Floor($size * 0.5)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString('M', $font, $whiteBrush, $textRect, $sf)
    
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created: $path"
}

Create-Icon -size 16 -path 'marketing-command-center/icons/icon16.png'
Create-Icon -size 48 -path 'marketing-command-center/icons/icon48.png'
Create-Icon -size 128 -path 'marketing-command-center/icons/icon128.png'
Write-Host 'All icons created!'
