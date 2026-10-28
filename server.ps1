param(
    [int]$Port = 8080,
    [string]$RootPath = "$PSScriptRoot"
)

if (-not $RootPath -or -not (Test-Path $RootPath)) {
    $RootPath = (Get-Location).Path
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "HTTP Server listening on $($prefix) serving $RootPath"
} catch {
    Write-Error "Failed to start listener on $($prefix) - $_"
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain; charset=utf-8"
}

try {
    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $rawUrl = $request.RawUrl.Split('?')[0]
            if ($rawUrl -eq "/" -or [string]::IsNullOrWhiteSpace($rawUrl)) {
                $rawUrl = "/index.html"
            }

            $decodedUrl = [System.Uri]::UnescapeDataString($rawUrl)
            $relPath = $decodedUrl.TrimStart('/').Replace('/', '\')
            $localPath = [System.IO.Path]::Combine($RootPath, $relPath)

            if (Test-Path $localPath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $response.ContentType = $mime
                $response.StatusCode = 200
                $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.Headers.Add("Pragma", "no-cache")
                $response.Headers.Add("Expires", "0")
                
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $notFoundBytes.Length
                $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
            }

            $response.OutputStream.Close()
        } catch {
            Write-Warning "Request processing error: $_"
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
