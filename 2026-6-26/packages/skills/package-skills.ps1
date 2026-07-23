param(
    [string]$SkillsRoot = (Resolve-Path "$PSScriptRoot\..\..\skills").Path,
    [string]$OutputRoot = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SkillsRoot -PathType Container)) {
    throw "Skills root not found: $SkillsRoot"
}

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
Get-ChildItem -LiteralPath $OutputRoot -Filter "*.zip" -File | Remove-Item -Force

$skills = Get-ChildItem -LiteralPath $SkillsRoot -Directory | Sort-Object Name
if ($skills.Count -eq 0) {
    throw "No skill directories found under $SkillsRoot"
}

foreach ($skill in $skills) {
    $skillFile = Join-Path $skill.FullName "SKILL.md"
    if (-not (Test-Path -LiteralPath $skillFile -PathType Leaf)) {
        throw "Missing SKILL.md for skill: $($skill.Name)"
    }

    $zipPath = Join-Path $OutputRoot "$($skill.Name).zip"
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("skillpkg_" + [System.Guid]::NewGuid().ToString("N"))
    $tempSkill = Join-Path $tempRoot $skill.Name
    New-Item -ItemType Directory -Force -Path $tempSkill | Out-Null

    try {
        Get-ChildItem -LiteralPath $skill.FullName -Force | Where-Object { $_.Name -ne "__pycache__" } | ForEach-Object {
            $destination = Join-Path $tempSkill $_.Name
            if ($_.PSIsContainer) {
                Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse -Force
            } else {
                Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
            }
        }

        Get-ChildItem -LiteralPath $tempSkill -Recurse -Force -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
        Get-ChildItem -LiteralPath $tempSkill -Recurse -Force -File -Include "*.pyc", "*.pyo" | Remove-Item -Force

        $items = Get-ChildItem -LiteralPath $tempSkill -Force
        Compress-Archive -LiteralPath $items.FullName -DestinationPath $zipPath -Force
        Write-Host "Created $zipPath"
    }
    finally {
        if (Test-Path -LiteralPath $tempRoot) {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force
        }
    }
}
