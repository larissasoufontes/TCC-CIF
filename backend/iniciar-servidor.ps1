$ErrorActionPreference = 'Stop'

$backendPath = $PSScriptRoot
$repositoryPath = Split-Path -Parent $backendPath
$workspacePath = Split-Path -Parent $repositoryPath
$envPath = Join-Path $backendPath '.env'
$frontendIndex = Join-Path $repositoryPath 'frontend\dist\index.html'
$pythonPath = Join-Path $workspacePath '.venv\Scripts\python.exe'

if (-not (Test-Path $frontendIndex)) {
    throw 'Build do frontend ausente. Execute npm run build na pasta frontend.'
}

if (-not (Test-Path $envPath)) {
    $securePassword = Read-Host 'Senha PostgreSQL do usuario cifuser (entrada oculta)' -AsSecureString
    $plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
    $encodedPassword = [System.Uri]::EscapeDataString($plainPassword)
    $databaseUrl = "postgresql://cifuser:$encodedPassword@127.0.0.1:5432/cifdb"

    $secretBytes = New-Object byte[] 48
    $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    $randomGenerator.GetBytes($secretBytes)
    $authSecret = [Convert]::ToBase64String($secretBytes)
    $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines(
        $envPath,
        @("DATABASE_URL=$databaseUrl", "AUTH_SECRET=$authSecret"),
        $utf8WithoutBom
    )

    try {
        $env:PGPASSWORD = $plainPassword
        & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
            -h 127.0.0.1 -p 5432 -U cifuser -d cifdb `
            -v ON_ERROR_STOP=1 -c 'SELECT 1'
        if ($LASTEXITCODE -ne 0) {
            Remove-Item $envPath -Force
            throw 'Nao foi possivel conectar ao cifdb com cifuser. .env foi removido.'
        }
    }
    finally {
        Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
        $plainPassword = $null
        $securePassword.Dispose()
        $randomGenerator.Dispose()
    }
}

$environment = Get-Content $envPath -Raw
if ($environment -match 'SENHA_DO_BANCO|SUBSTITUA_POR_UM_SEGREDO' -or
    $environment -notmatch '(?m)^DATABASE_URL=postgresql://\S+' -or
    $environment -notmatch '(?m)^AUTH_SECRET=\S{32,}') {
    throw 'DATABASE_URL ou AUTH_SECRET invalido em backend/.env.'
}

if (-not (Test-Path $pythonPath)) {
    $pythonPath = (Get-Command python -ErrorAction Stop).Source
}

Push-Location $backendPath
try {
    $env:CADASTRO_PERSISTENCIA_ATIVA = 'true'
    & $pythonPath -m uvicorn app.main:app --env-file $envPath --host 127.0.0.1 --port 8000
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}