param(
    [Parameter(Mandatory=$true)]
    [string]$Combo
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class KeySender {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@

$KEYEVENTF_KEYUP = 0x2

$vkMap = @{
    'ctrl'=0x11; 'control'=0x11; 'alt'=0x12; 'shift'=0x10; 'win'=0x5B
    'tab'=0x09; 'enter'=0x0D; 'esc'=0x1B; 'escape'=0x1B; 'space'=0x20
    'up'=0x26; 'down'=0x28; 'left'=0x25; 'right'=0x27
    'delete'=0x2E; 'home'=0x24; 'end'=0x23; 'pageup'=0x21; 'pagedown'=0x22
    'f1'=0x70; 'f2'=0x71; 'f3'=0x72; 'f4'=0x73; 'f5'=0x74; 'f6'=0x75
    'f7'=0x76; 'f8'=0x77; 'f9'=0x78; 'f10'=0x79; 'f11'=0x7A; 'f12'=0x7B
}

function Get-VkCode([string]$token) {
    $t = $token.ToLower()
    if ($vkMap.ContainsKey($t)) { return $vkMap[$t] }
    if ($t.Length -eq 1) {
        $c = $t.ToUpper()[0]
        if (($c -ge '0' -and $c -le '9') -or ($c -ge 'A' -and $c -le 'Z')) {
            return [byte][char]$c
        }
    }
    return $null
}

$parts = $Combo -split '\+' | Where-Object { $_ -ne '' }
$vks = @()
foreach ($p in $parts) {
    $vk = Get-VkCode $p
    if ($null -ne $vk) { $vks += $vk }
}

foreach ($vk in $vks) {
    [KeySender]::keybd_event($vk, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 15
}
for ($i = $vks.Count - 1; $i -ge 0; $i--) {
    [KeySender]::keybd_event($vks[$i], 0, $KEYEVENTF_KEYUP, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 15
}
