# Test nhanh APS + ASS trên Windows.
# Usage:
#   cd services/ai-pronunciation-worker
#   powershell -ExecutionPolicy Bypass -File scripts/test_api.ps1 -Mode status
#   powershell -ExecutionPolicy Bypass -File scripts/test_api.ps1 -Mode ass -Clip 01_greeting

param(
    [ValidateSet("aps", "ass", "health", "status")]
    [string]$Mode = "ass",
    [string]$Clip = "01_greeting",
    [string]$BaseUrl = "http://127.0.0.1:8089"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Manifest = Join-Path $Root "tests/fixtures/manifest.json"
$AudioDir = Join-Path $Root "tests/fixtures/audio"

function Show-Json($obj) {
    $obj | ConvertTo-Json -Depth 8
}

switch ($Mode) {
    "health" {
        Invoke-RestMethod "$BaseUrl/health" | Show-Json
        exit 0
    }
    "status" {
        Invoke-RestMethod "$BaseUrl/config/pipeline-status" | Show-Json
        exit 0
    }
}

if (-not (Test-Path $Manifest)) {
    Write-Error "Thiếu manifest. Chạy: py scripts/generate_audio_fixtures.py"
}

$cases = Get-Content $Manifest -Raw | ConvertFrom-Json
$case = $cases | Where-Object { $_.id -eq $Clip } | Select-Object -First 1
if (-not $case) {
    Write-Error "Không tìm thấy clip '$Clip' trong manifest."
}

$wav = Join-Path $AudioDir $case.file
if (-not (Test-Path $wav)) {
    Write-Error "Thiếu file: $wav"
}

Write-Host "=== Mode: $Mode | Clip: $($case.id) ===" -ForegroundColor Cyan

if ($Mode -eq "aps") {
    $resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" `
        -X POST "$BaseUrl/api/v1/aps/score" `
        -F "audio=@$wav;type=audio/wav" `
        -F "reference_transcript=$($case.reference_transcript)" `
        -F "cefr_level=$($case.cefr_level)" `
        -F "target_accent=$($case.target_accent)" `
        -F "pronunciation_score_history_json=[]"
} else {
    $resp = curl.exe -s -w "`nHTTP_STATUS:%{http_code}" `
        -X POST "$BaseUrl/api/v1/ass/score" `
        -F "audio=@$wav;type=audio/wav" `
        -F "prompt_text=Please read the following sentence aloud clearly." `
        -F "reference_transcript=$($case.reference_transcript)" `
        -F "cefr_level=$($case.cefr_level)" `
        -F "target_accent=$($case.target_accent)" `
        -F "speaking_part=shadowing" `
        -F "speaking_score_history_json=[]"
}

$parts = $resp -split "HTTP_STATUS:"
$body = ($parts[0] -replace "`r", "").Trim()
$status = ($parts[-1] -replace "`r", "").Trim()
Write-Host "HTTP $status"
if ($status -ne "200") {
    Write-Host $body
    exit 1
}

$data = $body | ConvertFrom-Json
if ($Mode -eq "aps") {
    [PSCustomObject]@{
        band_overall       = $data.band_overall
        scoring_source     = $data.scoring_source
        wer_band           = $data.dimensions.wer.band
        fluency_band       = $data.dimensions.fluency.band
        prosody_band       = $data.dimensions.prosody.band
        hypothesis_preview = ($data.hypothesis_transcript).Substring(0, [Math]::Min(80, ($data.hypothesis_transcript).Length))
        feedback_vi        = if ($data.feedback_vi) { "yes" } else { "no" }
        fallback_reason    = $data.scoring_fallback_reason
    } | Format-List
} else {
    [PSCustomObject]@{
        band_overall       = $data.band_overall
        scoring_source     = $data.scoring_source
        FC                 = $data.speaking_rubric.fluency_and_coherence
        LR                 = $data.speaking_rubric.lexical_resource
        GRA                = $data.speaking_rubric.grammatical_range_and_accuracy
        P                  = $data.speaking_rubric.pronunciation
        hypothesis_preview = ($data.hypothesis_transcript).Substring(0, [Math]::Min(80, ($data.hypothesis_transcript).Length))
        suggestions        = $data.improvement_suggestions.Count
        feedback_vi        = if ($data.feedback_vi) { "yes" } else { "no" }
        fallback_reason    = $data.scoring_fallback_reason
    } | Format-List
}

Write-Host "`nFull JSON (truncated feedback):" -ForegroundColor DarkGray
$data | Select-Object band_overall, scoring_source, speaking_rubric, pronunciation_dimensions, hypothesis_transcript, scoring_fallback_reason, improvement_suggestions | Show-Json
