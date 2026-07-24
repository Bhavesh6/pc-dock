param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('playpause','next','prev','stop','volup','voldown','mute')]
    [string]$Key
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MediaKeySender {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@

$vkMap = @{
    playpause = 0xB3
    next      = 0xB0
    prev      = 0xB1
    stop      = 0xB2
    volup     = 0xAF
    voldown   = 0xAE
    mute      = 0xAD
}

$vk = $vkMap[$Key]
$KEYEVENTF_KEYUP = 0x2

[MediaKeySender]::keybd_event($vk, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[MediaKeySender]::keybd_event($vk, 0, $KEYEVENTF_KEYUP, [UIntPtr]::Zero)
