$ErrorActionPreference = 'Stop'

$databasePath = Join-Path (Split-Path -Parent $PSScriptRoot) 'database'
$migrationPaths = @(
    (Join-Path $databasePath 'migrations\003_permissoes_cifuser.sql'),
    (Join-Path $databasePath 'migrations\004_recuperacao_senha_email.sql'),
    (Join-Path $databasePath 'migrations\005_dados_demograficos_paciente.sql')
)

$previousClientEncoding = $env:PGCLIENTENCODING
$env:PGCLIENTENCODING = 'UTF8'
try {
    foreach ($migrationPath in $migrationPaths) {
        & 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
            -h 127.0.0.1 -p 5432 -U postgres -d cifdb `
            -v ON_ERROR_STOP=1 -f $migrationPath

        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao aplicar a migration $migrationPath."
        }
    }
}
finally {
    if ($null -eq $previousClientEncoding) {
        Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue
    }
    else {
        $env:PGCLIENTENCODING = $previousClientEncoding
    }
}