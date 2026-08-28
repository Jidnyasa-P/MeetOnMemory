# Issue #2443 Dashboard mount
# Run this script from the MeetOnMemory repository root after switching to main
# and creating your issue branch. It preserves the existing Dashboard.jsx and
# makes only the import + widget insertion required for this issue.

$ErrorActionPreference = "Stop"

$dashboard = "client/src/pages/Dashboard.jsx"
if (-not (Test-Path $dashboard)) {
  throw "Could not find $dashboard. Run this from the repository root."
}

$content = Get-Content -Raw -LiteralPath $dashboard

$import = 'import RecurringActionItems from "../components/dashboard/RecurringActionItems.jsx";'
if ($content -notmatch [regex]::Escape($import)) {
  $anchor = 'import StoryThumbnails from "../components/dashboard/StoryThumbnails.jsx";'
  if ($content -notmatch [regex]::Escape($anchor)) {
    throw "Dashboard import anchor was not found; inspect Dashboard.jsx before applying."
  }
  $content = $content.Replace(
    $anchor,
    $anchor + "`r`n" + $import
  )
}

$mount = @'
        {/* ── Recurring Action Items ── */}
        <section
          aria-label="Recurring Action Items"
          className="mt-6 sm:mt-8 fade-in-up stagger-3"
        >
          <RecurringActionItems />
        </section>
'@

if ($content -notmatch 'data-testid="recurring-action-items-widget"') {
  $anchor = '        {/* ── Additional Widgets (Gamification & Notes) ── */}'
  if ($content -notmatch [regex]::Escape($anchor)) {
    throw "Dashboard widget insertion anchor was not found; inspect Dashboard.jsx before applying."
  }
  $content = $content.Replace($anchor, $mount + "`r`n" + $anchor)
}

Set-Content -LiteralPath $dashboard -Value $content -Encoding utf8
Write-Host "Updated $dashboard"
