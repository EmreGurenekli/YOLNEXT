$ErrorActionPreference = 'SilentlyContinue'

$os = Get-CimInstance Win32_OperatingSystem
$totalGb = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
$freeGb  = [math]::Round($os.FreePhysicalMemory / 1MB, 2)

Write-Output ("RAM Total(GB): {0}" -f $totalGb)
Write-Output ("RAM Free(GB):  {0}" -f $freeGb)
Write-Output ""

Write-Output "Top by Working Set:"
Get-Process |
  Sort-Object WS -Descending |
  Select-Object -First 15 Name, Id, @{ n = 'WS(MB)'; e = { [math]::Round($_.WS / 1MB, 0) } }, CPU |
  Format-Table -AutoSize

Write-Output ""
Write-Output "Node processes:"
Get-Process node |
  Sort-Object WS -Descending |
  Select-Object Name, Id, @{ n = 'WS(MB)'; e = { [math]::Round($_.WS / 1MB, 0) } }, CPU, Path |
  Format-Table -AutoSize

Write-Output ""
Write-Output "Node command lines:"
Get-CimInstance Win32_Process -Filter "name='node.exe'" |
  Select-Object ProcessId, CommandLine |
  Sort-Object ProcessId |
  Format-List

Write-Output ""
Write-Output "Docker/WSL related:"
Get-Process docker*, vmmem*, wsl* |
  Sort-Object WS -Descending |
  Select-Object Name, Id, @{ n = 'WS(MB)'; e = { [math]::Round($_.WS / 1MB, 0) } }, CPU, Path |
  Format-Table -AutoSize

