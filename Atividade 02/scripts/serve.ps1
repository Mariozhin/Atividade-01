# ============================================================================
# serve.ps1
# Servidor HTTP local simples para visualizar o site sem Python ou Node.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\serve.ps1
#      powershell ... -File .\scripts\serve.ps1 -Port 5500
# ============================================================================

[CmdletBinding()]
param(
    [int]$Port = 8080,
    [string]$Root
)

$ErrorActionPreference = "Stop"

if (-not $Root) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $Root = (Resolve-Path (Join-Path $scriptDir "..")).Path
}

$Root = (Resolve-Path $Root).Path.TrimEnd("\")

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".csv"  = "text/csv; charset=utf-8"
    ".svg"  = "image/svg+xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".md"   = "text/markdown; charset=utf-8"
    ".txt"  = "text/plain; charset=utf-8"
    ".woff2" = "font/woff2"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
}
catch {
    Write-Host ("Não foi possível abrir a porta {0}. Tente outra porta com -Port." -f $Port) -ForegroundColor Red
    throw
}

Write-Host ""
Write-Host ("Servidor local em http://localhost:{0}/" -f $Port) -ForegroundColor Green
Write-Host ("Raiz: {0}" -f $Root)
Write-Host "Pressione Ctrl+C para encerrar."
Write-Host ""

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $body = $null
            $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") { $path = "/index.html" }
            $relative = $path.TrimStart("/").Replace("/", "\")
            $full = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))

            if (-not ($full -eq $Root -or $full.StartsWith($Root + "\", [System.StringComparison]::OrdinalIgnoreCase))) {
                $response.StatusCode = 403
                $body = [System.Text.Encoding]::UTF8.GetBytes("Acesso negado.")
            }
            elseif (Test-Path $full -PathType Container) {
                $index = Join-Path $full "index.html"
                if (Test-Path $index -PathType Leaf) {
                    $full = $index
                }
                else {
                    $response.StatusCode = 403
                    $body = [System.Text.Encoding]::UTF8.GetBytes("Diretório sem index.html.")
                }
            }

            if ($null -eq $body -and (Test-Path $full -PathType Leaf)) {
                $extension = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
                $contentType = $mime[$extension]
                if (-not $contentType) { $contentType = "application/octet-stream" }

                $bytes = [System.IO.File]::ReadAllBytes($full)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.Headers.Add("Cache-Control", "no-cache")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            elseif ($null -eq $body) {
                $response.StatusCode = 404
                $body = [System.Text.Encoding]::UTF8.GetBytes("Arquivo não encontrado: $path")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $body.Length
                $response.OutputStream.Write($body, 0, $body.Length)
            }
            else {
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $body.Length
                $response.OutputStream.Write($body, 0, $body.Length)
            }
        }
        catch {
            $response.StatusCode = 500
            $body = [System.Text.Encoding]::UTF8.GetBytes("Erro interno: " + $_.Exception.Message)
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $body.Length
            $response.OutputStream.Write($body, 0, $body.Length)
        }
        finally {
            $response.OutputStream.Close()
        }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
    Write-Host "Servidor encerrado."
}
