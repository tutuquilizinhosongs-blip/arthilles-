$ErrorActionPreference = "Stop"

if (!(Test-Path "backups")) {
  New-Item -ItemType Directory -Path "backups" | Out-Null
}

$envMap = @{}
Get-Content ".env" | ForEach-Object {
  if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
    $envMap[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$dbUser = $envMap["POSTGRES_USER"]
$dbName = $envMap["POSTGRES_DB"]
if (!$dbUser) { $dbUser = "arthilles" }
if (!$dbName) { $dbName = "arthillesbot" }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = "backups\arthillesbot-$timestamp.sql"

docker exec arthilles_postgres pg_dump -U $dbUser -d $dbName | Out-File -Encoding utf8 $file
if ($LASTEXITCODE -ne 0) {
  if (Test-Path $file) {
    Remove-Item -LiteralPath $file -Force
  }
  throw "Falha ao criar backup. Verifique se o Docker Desktop esta aberto e se o container arthilles_postgres esta rodando."
}

Write-Host "Backup criado em $file"
