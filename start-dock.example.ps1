# Run this at Windows logon (via Task Scheduler) to bring the whole dock online:
# 1. makes sure LibreHardwareMonitor is running (with its web server)
# 2. starts the pc-dock Node server
# 3. pings your phone's MacroDroid webhook so it wakes and opens the dashboard
#
# SETUP: copy this file to "start-dock.ps1" and fill in the three values below.
# (start-dock.ps1 is gitignored so your webhook token never gets committed.)

$ErrorActionPreference = 'SilentlyContinue'

# ---- EDIT THESE THREE VALUES ----
$LhmPath   = 'C:\Path\To\LibreHardwareMonitor.exe'                       # where you installed LibreHardwareMonitor
$DockDir   = 'D:\pc-dock'                                                # this project's folder
$WakeHook  = 'https://trigger.macrodroid.com/xxxxxxxx-xxxx/wakedock'     # your MacroDroid webhook URL
# ----------------------------------

if (-not (Get-Process -Name 'LibreHardwareMonitor' -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $LhmPath -WindowStyle Hidden
    Start-Sleep -Seconds 5
}

Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory $DockDir -WindowStyle Hidden

# Wait for network + give the node server a moment to bind before waking the phone
Start-Sleep -Seconds 8

if ($WakeHook -and $WakeHook -notlike '*xxxxxxxx*') {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        (New-Object System.Net.WebClient).DownloadString($WakeHook) | Out-Null
    } catch {}
}
