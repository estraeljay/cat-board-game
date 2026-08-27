# Serve the whole repo (parent of prototype/) so the prototype at /prototype/ can also
# reach sibling folders like /assets/ for drop-in art.
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8791/")
$listener.Start()
Write-Output "Serving $root on http://localhost:8791/  ->  open http://localhost:8791/prototype/"

$mime = @{
    ".html" = "text/html"; ".js" = "text/javascript"; ".css" = "text/css"
    ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"; ".svg" = "image/svg+xml"; ".gif" = "image/gif"
    ".json" = "application/json"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        continue
    }
    $req = $context.Request
    $res = $context.Response
    try {
        $res.KeepAlive = $false
        $path = $req.Url.LocalPath
        # Bounce the bare root / /prototype to the real page (200 + meta-refresh, so a
        # readiness probe that wants 200 is happy and relative imports still resolve).
        if ($path -eq "/" -or $path -eq "/prototype" -or $path -eq "/prototype/") {
            $html = '<!doctype html><meta http-equiv="refresh" content="0; url=/prototype/index.html"><a href="/prototype/index.html">Cat Board Game</a>'
            $b = [System.Text.Encoding]::UTF8.GetBytes($html)
            $res.ContentType = "text/html"
            $res.ContentLength64 = $b.Length
            if ($req.HttpMethod -ne "HEAD") { $res.OutputStream.Write($b, 0, $b.Length) }
            $res.OutputStream.Close()
            continue
        }
        $filePath = Join-Path $root $path.TrimStart("/")
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $ct = $mime[$ext]
            if (-not $ct) { $ct = "application/octet-stream" }
            $res.ContentType = $ct
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentLength64 = $bytes.Length
            # HEAD requests (Firefox sends these for prefetch/speculative loads) must not
            # get a body — writing one anyway trips .NET's Content-Length validator.
            if ($req.HttpMethod -ne "HEAD") {
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $res.StatusCode = 404
        }
    } catch {
        try { $res.StatusCode = 500 } catch {}
    } finally {
        try { $res.OutputStream.Close() } catch {}
    }
}
