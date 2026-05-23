$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$iss = Join-Path $PSScriptRoot "arthilles.iss"
$dist = Join-Path $root "dist"

if (!(Test-Path $dist)) {
  New-Item -ItemType Directory -Path $dist | Out-Null
}

$compilerCandidates = @(
  "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
  "$env:ProgramFiles\Inno Setup 6\ISCC.exe",
  "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
) | Where-Object { $_ -and (Test-Path $_) }

$compilerCandidates = @($compilerCandidates)

if (!$compilerCandidates.Count) {
  Write-Host "Inno Setup nao encontrado."
  Write-Host "Instale em: https://jrsoftware.org/isdl.php"
  throw "Instale o Inno Setup 6 e rode novamente."
}

$compiler = $compilerCandidates[0]
& $compiler $iss

$output = Join-Path $dist "ArthillesSetup.exe"
if (!(Test-Path $output)) {
  throw "Instalador nao gerado em $output"
}

Write-Host "Instalador gerado em: $output"
