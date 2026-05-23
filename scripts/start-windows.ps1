$ErrorActionPreference = "Stop"

if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Arquivo .env criado a partir do .env.example. Revise as senhas quando desejar."
}

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "Docker Desktop nao encontrado. Instale em: https://www.docker.com/products/docker-desktop/"
  Start-Process "https://www.docker.com/products/docker-desktop/"
  exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  $dockerDesktopPaths = @(
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
  )
  $dockerDesktop = $dockerDesktopPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($dockerDesktop) {
    Start-Process $dockerDesktop
    Write-Host "Aguardando Docker Desktop iniciar..."
    for ($i = 0; $i -lt 60; $i++) {
      Start-Sleep -Seconds 2
      docker info *> $null
      if ($LASTEXITCODE -eq 0) { break }
    }
  }
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Desktop esta instalado, mas nao esta pronto. Abra o Docker Desktop e rode novamente."
}

docker compose up -d --build

$localIps = @()
try {
  $localIps = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress
} catch {
  $localIps = @()
}

Write-Host ""
Write-Host "ArthillesBot iniciado."
Write-Host "Dashboard:     http://localhost:3000"
Write-Host "Backend:       http://localhost:3001"
Write-Host "Evolution API: http://localhost:8080"
Write-Host "n8n opcional:  docker compose --profile optional up -d n8n"
Write-Host "Ollama:        http://localhost:11434"
Write-Host ""
Write-Host "Acesso pelo Android na mesma rede:"
if ($localIps.Count -gt 0) {
  foreach ($ip in $localIps) {
    Write-Host "Dashboard:     http://${ip}:3000"
  }
} else {
  Write-Host "Rode ipconfig e abra http://IP-DO-COMPUTADOR:3000 no celular."
}
