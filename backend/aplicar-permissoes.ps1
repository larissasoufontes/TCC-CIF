$ErrorActionPreference = 'Stop'

$migrationPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'database\migrations\003_permissoes_cifuser.sql'

& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
    -h 127.0.0.1 -p 5432 -U postgres -d cifdb `
    -v ON_ERROR_STOP=1 -f $migrationPath

if ($LASTEXITCODE -ne 0) {
    throw 'Falha ao aplicar permissoes de runtime para cifuser.'
}