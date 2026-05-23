$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms

$InstallDir = "C:\Arthilles"
Set-Location $InstallDir

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
  Start-Process "https://www.docker.com/products/docker-desktop/"
  [System.Windows.Forms.MessageBox]::Show("Docker Desktop nao foi encontrado. Instale o Docker Desktop, reinicie o computador se necessario e rode Iniciar Arthilles novamente.", "Arthilles")
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
  [System.Windows.Forms.MessageBox]::Show("Docker Desktop esta instalado, mas nao ficou pronto. Abra o Docker Desktop, aguarde iniciar e rode Iniciar Arthilles novamente.", "Arthilles")
  exit 1
}

if (!(Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
}

if (!(Test-Path "data")) {
  New-Item -ItemType Directory -Path "data" | Out-Null
}

docker compose up -d --build
Start-Process "http://localhost:3000"
