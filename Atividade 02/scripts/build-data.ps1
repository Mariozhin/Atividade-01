# ============================================================================
# build-data.ps1
# Coleta, normaliza, calcula e valida os dados oficiais do IBGE usados no site
# "Crescimento Populacional e Oportunidades de Mercado no Brasil".
#
# Requisitos: Windows PowerShell 5.1 ou superior.
# Uso:        powershell -ExecutionPolicy Bypass -File .\scripts\build-data.ps1
# Saída:      data\municipios.json, data\municipios.js, data\meta.json,
#             data\municipios.csv
# ============================================================================

[CmdletBinding()]
param(
    [string]$OutputDir
)

if (-not $OutputDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $OutputDir = Join-Path $scriptDir "..\data"
}

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$baseAgregados = "https://servicodados.ibge.gov.br/api/v3/agregados"
$urlLocalidades = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"

$queries = [ordered]@{
    localidades = $urlLocalidades
    nucleo      = "$baseAgregados/4709/periodos/2022/variaveis/93|5936|10605?localidades=N6[all]"
    pop2010     = "$baseAgregados/1378/periodos/2010/variaveis/93?localidades=N6[all]&classificacao=1[0]"
    area        = "$baseAgregados/4714/periodos/2022/variaveis/6318|614?localidades=N6[all]"
}

function Get-IbgeJson {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$MaxAttempts = 4
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            Write-Host ("  GET {0} (tentativa {1}/{2})" -f $Url, $attempt, $MaxAttempts)
            return Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 180 `
                -Headers @{ Accept = "application/json" }
        }
        catch {
            if ($attempt -eq $MaxAttempts) { throw }
            $wait = 2 * $attempt
            Write-Warning ("Falha: {0}. Nova tentativa em {1}s." -f $_.Exception.Message, $wait)
            Start-Sleep -Seconds $wait
        }
    }
}

function Get-SeriesMap {
    param(
        [Parameter(Mandatory = $true)]$Variable,
        [Parameter(Mandatory = $true)][string]$Periodo
    )

    $map = @{}
    foreach ($item in $Variable.resultados[0].series) {
        $id = [string]$item.localidade.id
        $prop = $item.serie.PSObject.Properties[$Periodo]
        if ($null -ne $prop) {
            $value = $prop.Value
            if ($null -ne $value -and "$value" -ne "" -and "$value" -ne "..." -and "$value" -ne "-") {
                $map[$id] = [double]$value
            }
        }
    }
    return $map
}

Write-Host ""
Write-Host "=== Coleta de dados oficiais do IBGE ===" -ForegroundColor Cyan
$localidadesRaw = Get-IbgeJson $queries.localidades
$nucleoRaw      = Get-IbgeJson $queries.nucleo
$pop2010Raw     = Get-IbgeJson $queries.pop2010
$areaRaw        = Get-IbgeJson $queries.area

Write-Host ""
Write-Host "=== Processamento ===" -ForegroundColor Cyan

$nucleoVars = @($nucleoRaw)
$pop2022Var = $nucleoVars | Where-Object { [string]$_.id -eq "93" }   | Select-Object -First 1
$varAbsVar  = $nucleoVars | Where-Object { [string]$_.id -eq "5936" } | Select-Object -First 1
$taxaVar    = $nucleoVars | Where-Object { [string]$_.id -eq "10605" }| Select-Object -First 1
if (-not $pop2022Var -or -not $varAbsVar -or -not $taxaVar) {
    throw "Não foi possível localizar as variáveis 93, 5936 e 10605 no agregado 4709."
}

$pop2010Vars = @($pop2010Raw)
$pop2010Var  = $pop2010Vars | Where-Object { [string]$_.id -eq "93" } | Select-Object -First 1
if (-not $pop2010Var) { throw "Não foi possível localizar a variável 93 no agregado 1378." }

$areaVars = @($areaRaw)
$areaVar  = $areaVars | Where-Object { [string]$_.id -eq "6318" } | Select-Object -First 1
$densVar  = $areaVars | Where-Object { [string]$_.id -eq "614" }  | Select-Object -First 1
if (-not $areaVar) { throw "Não foi possível localizar a variável 6318 no agregado 4714." }

$pop2022 = Get-SeriesMap -Variable $pop2022Var -Periodo "2022"
$varAbs  = Get-SeriesMap -Variable $varAbsVar  -Periodo "2022"
$taxa    = Get-SeriesMap -Variable $taxaVar    -Periodo "2022"
$pop2010 = Get-SeriesMap -Variable $pop2010Var -Periodo "2010"
$area    = Get-SeriesMap -Variable $areaVar    -Periodo "2022"

$locMap = @{}
foreach ($m in @($localidadesRaw)) {
    $locMap[[string]$m.id] = $m
}

$rows = New-Object System.Collections.Generic.List[object]
$sem2010 = New-Object System.Collections.Generic.List[string]
$comAjuste = 0
$formulaBad = 0

foreach ($id in $pop2022.Keys) {
    $m = $locMap[$id]
    if (-not $m) { throw "Município $id sem metadados na API de Localidades." }

    $p22 = [int][math]::Round($pop2022[$id])
    $va  = [int][math]::Round($varAbs[$id])
    $p10c = $p22 - $va
    if ($p10c -le 0) { throw "Base 2010 compatibilizada inválida para $id ($p10c)." }

    $tx = [math]::Round($taxa[$id], 2)
    $ar = [math]::Round($area[$id], 2)
    if ($ar -le 0) { throw "Área inválida para $id ($ar)." }

    $p10 = $null
    if ($pop2010.ContainsKey($id)) {
        $p10 = [int][math]::Round($pop2010[$id])
        if ($p10 -ne $p10c) { $comAjuste++ }
    }
    else {
        $sem2010.Add([string]$m.nome)
    }

    $calc = ([math]::Pow($p22 / $p10c, 1.0 / 12.0) - 1.0) * 100.0
    if ([math]::Abs($calc - $tx) -gt 0.02) { $formulaBad++ }

    $ufObj = $m.microrregiao.mesorregiao.UF
    $ri = ""
    if ($null -ne $m.'regiao-imediata') { $ri = [string]$m.'regiao-imediata'.nome }

    $rows.Add([pscustomobject][ordered]@{
        id              = [int]$id
        nome            = [string]$m.nome
        uf              = [string]$ufObj.sigla
        ufId            = [int]$ufObj.id
        regiao          = [string]$ufObj.regiao.nome
        regiaoImediata  = $ri
        pop2010Censo    = $p10
        pop2010Compat   = $p10c
        pop2022         = $p22
        varAbs          = $va
        varRel          = [math]::Round((($p22 / $p10c) - 1.0) * 100.0, 2)
        taxaAnual       = $tx
        areaKm2         = $ar
        densidade2010   = [math]::Round($p10c / $ar, 2)
        densidade2022   = [math]::Round($p22 / $ar, 2)
    })
}

$rows = @($rows | Sort-Object { $_.uf }, { $_.nome })

Write-Host ("  Registros processados: {0}" -f $rows.Count)

# ---------------------------------------------------------------------------
# Validação
# ---------------------------------------------------------------------------
$count   = $rows.Count
$sum22   = ($rows | Measure-Object -Property pop2022 -Sum).Sum
$sum10c  = ($rows | Measure-Object -Property pop2010Compat -Sum).Sum
$sum10   = ($rows | Where-Object { $null -ne $_.pop2010Censo } | Measure-Object -Property pop2010Censo -Sum).Sum
$ufCount = ($rows | Select-Object -ExpandProperty uf -Unique).Count
$regCount = ($rows | Select-Object -ExpandProperty regiao -Unique).Count
$nulls   = ($rows | Where-Object {
        $null -eq $_.pop2022 -or $null -eq $_.varAbs -or
        $null -eq $_.taxaAnual -or $null -eq $_.areaKm2
    }).Count

$checks = @(
    [ordered]@{ nome = "Registros";                    ok = ($count -eq 5570);        valor = $count;   esperado = 5570 },
    [ordered]@{ nome = "Soma pop. 2022";               ok = ($sum22 -eq 203080756);   valor = $sum22;   esperado = 203080756 },
    [ordered]@{ nome = "Soma pop. 2010 compatibilizada"; ok = ($sum10c -eq 190755799); valor = $sum10c;  esperado = 190755799 },
    [ordered]@{ nome = "Soma pop. 2010 censo";          ok = ($sum10 -eq 190755799);   valor = $sum10;   esperado = 190755799 },
    [ordered]@{ nome = "UFs";                           ok = ($ufCount -eq 27);        valor = $ufCount; esperado = 27 },
    [ordered]@{ nome = "Regiões";                       ok = ($regCount -eq 5);        valor = $regCount; esperado = 5 },
    [ordered]@{ nome = "Nulos em campos centrais";      ok = ($nulls -eq 0);           valor = $nulls;   esperado = 0 },
    [ordered]@{ nome = "Divergências na fórmula da taxa"; ok = ($formulaBad -eq 0);    valor = $formulaBad; esperado = 0 }
)

$failed = @($checks | Where-Object { -not $_.ok })
if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "FALHA NA VALIDAÇÃO:" -ForegroundColor Red
    $failed | ForEach-Object {
        Write-Host ("  - {0}: obtido {1}, esperado {2}" -f $_.nome, $_.valor, $_.esperado) -ForegroundColor Red
    }
    throw "A base não passou na validação. Nenhum arquivo foi gravado."
}

Write-Host ""
Write-Host "=== Validação concluída ===" -ForegroundColor Green
$checks | ForEach-Object {
    Write-Host ("  OK  {0}: {1}" -f $_.nome, $_.valor) -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Metadados e gravação
# ---------------------------------------------------------------------------
$rowsJson = $rows | ConvertTo-Json -Depth 6 -Compress
$sha = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($rowsJson))
$hash = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""
$sha.Dispose()

$meta = [ordered]@{
    projeto     = "Crescimento Populacional e Oportunidades de Mercado no Brasil"
    descricao   = "Comparação da população residente dos municípios brasileiros entre os Censos de 2010 e 2022, com dados oficiais do IBGE."
    geradoEm    = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
    fonte       = "IBGE — API de Agregados v3 e API de Localidades v1"
    consultas   = @(
        [ordered]@{ nome = "Localidades — municípios"; url = $queries.localidades; registros = @($localidadesRaw).Count },
        [ordered]@{ nome = "Agregado 4709 — população 2022, variação absoluta e taxa"; url = $queries.nucleo; registros = $count },
        [ordered]@{ nome = "Agregado 1378 — população 2010"; url = $queries.pop2010; registros = @($pop2010Var.resultados[0].series).Count },
        [ordered]@{ nome = "Agregado 4714 — área e densidade 2022"; url = $queries.area; registros = $count }
    )
    variaveis   = @(
        [ordered]@{ agregado = 4709; variavel = 93;    nome = "População residente"; unidade = "Pessoas" },
        [ordered]@{ agregado = 4709; variavel = 5936;  nome = "Variação absoluta da população residente 2010 compatibilizada"; unidade = "Pessoas" },
        [ordered]@{ agregado = 4709; variavel = 10605; nome = "Taxa de crescimento geométrico"; unidade = "% ao ano" },
        [ordered]@{ agregado = 1378; variavel = 93;    nome = "População residente (2010)"; unidade = "Pessoas" },
        [ordered]@{ agregado = 4714; variavel = 6318;  nome = "Área da unidade territorial"; unidade = "km²" },
        [ordered]@{ agregado = 4714; variavel = 614;   nome = "Densidade demográfica"; unidade = "hab/km²" }
    )
    universo    = $count
    totais      = [ordered]@{
        pop2022       = [long]$sum22
        pop2010Compat = [long]$sum10c
        pop2010Censo  = [long]$sum10
        varAbs        = [long]($sum22 - $sum10c)
    }
    validacao   = [ordered]@{
        registros                  = $count
        ufs                        = $ufCount
        regioes                    = $regCount
        nulosCamposCentrais        = $nulls
        formulaTaxaDivergencias    = $formulaBad
        municipiosSem2010          = $sem2010.Count
        municipiosComAjusteLimites = $comAjuste
        somaPop2022                = [long]$sum22
        somaPop2010Compat          = [long]$sum10c
        somaPop2010Censo           = [long]$sum10
    }
    observacoes = @(
        "A API de Localidades retorna 5.571 municípios; o agregado 4709 retorna 5.570. Boa Esperança do Norte/MT não possui dado no agregado e foi excluída da análise.",
        "Cinco municípios criados após 2010 não têm população bruta de 2010; a base compatibilizada do IBGE cobre esses casos.",
        "A população de 2010 compatibilizada é calculada como pop2022 menos a variação absoluta (variável 5936).",
        "A densidade usa a área territorial de 2022 para os dois anos, evitando viés por atualizações de limites.",
        "A taxa de crescimento geométrico foi conferida pela fórmula [(pop2022/pop2010Compat)^(1/12)-1]*100."
    )
    checksumMunicipiosSha256 = $hash
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$utf8 = New-Object System.Text.UTF8Encoding($false)
$payload = [ordered]@{ meta = $meta; municipios = $rows }
$json = $payload | ConvertTo-Json -Depth 8 -Compress

$jsonPath = Join-Path $OutputDir "municipios.json"
$jsPath   = Join-Path $OutputDir "municipios.js"
$metaPath = Join-Path $OutputDir "meta.json"
$csvPath  = Join-Path $OutputDir "municipios.csv"

[System.IO.File]::WriteAllText($jsonPath, $json, $utf8)
[System.IO.File]::WriteAllText($jsPath, "window.CENSO_DATA = $json;`n", $utf8)
[System.IO.File]::WriteAllText($metaPath, ($meta | ConvertTo-Json -Depth 8), $utf8)

$rows |
    Select-Object id, nome, uf, ufId, regiao, regiaoImediata, pop2010Censo,
        pop2010Compat, pop2022, varAbs, varRel, taxaAnual, areaKm2,
        densidade2010, densidade2022 |
    Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8 -Delimiter ';'

Write-Host ""
Write-Host "=== Arquivos gerados ===" -ForegroundColor Cyan
Write-Host ("  {0} ({1:N1} KB)" -f $jsonPath, ((Get-Item $jsonPath).Length / 1KB))
Write-Host ("  {0} ({1:N1} KB)" -f $jsPath, ((Get-Item $jsPath).Length / 1KB))
Write-Host ("  {0} ({1:N1} KB)" -f $metaPath, ((Get-Item $metaPath).Length / 1KB))
Write-Host ("  {0} ({1:N1} KB)" -f $csvPath, ((Get-Item $csvPath).Length / 1KB))
Write-Host ""
Write-Host "Concluído." -ForegroundColor Green
