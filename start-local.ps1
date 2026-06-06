$ErrorActionPreference = "Stop"

$base = Join-Path $env:LOCALAPPDATA "FluxoFinanceSaaS"
$mongoExe = Join-Path $base "mongodb-7.0.28\mongodb-win32-x86_64-windows-7.0.28\bin\mongod.exe"
$mongoData = Join-Path $base "mongodb-data"
$mongoLog = Join-Path $base "mongod.log"

if (-not (Test-Path -LiteralPath $mongoExe)) {
  throw "MongoDB portable not found at $mongoExe"
}

$mongoOnline = (Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded

if (-not $mongoOnline) {
  New-Item -ItemType Directory -Force -Path $mongoData | Out-Null
  $mongoArgs = "--dbpath `"$mongoData`" --bind_ip 127.0.0.1 --port 27017 --logpath `"$mongoLog`" --logappend"
  Start-Process -FilePath $mongoExe -ArgumentList $mongoArgs -WindowStyle Hidden

  for ($attempt = 1; $attempt -le 10; $attempt++) {
    Start-Sleep -Seconds 1
    $mongoOnline = (Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue).TcpTestSucceeded
    if ($mongoOnline) {
      break
    }
  }
}

if (-not $mongoOnline) {
  throw "MongoDB did not start on 127.0.0.1:27017. Check $mongoLog"
}

npm run dev:full
