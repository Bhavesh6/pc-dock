Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType=WindowsRuntime] | Out-Null

try {
    $manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    $session = $manager.GetCurrentSession()

    if ($null -eq $session) {
        Write-Output '{"playing":false}'
        exit
    }

    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType=WindowsRuntime] | Out-Null
    $props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    $timeline = $session.GetTimelineProperties()
    $playbackInfo = $session.GetPlaybackInfo()

    $result = [ordered]@{
        playing = ($playbackInfo.PlaybackStatus.value__ -eq 4)
        title = $props.Title
        artist = $props.Artist
        position = [Math]::Round($timeline.Position.TotalSeconds, 1)
        duration = [Math]::Round($timeline.EndTime.TotalSeconds, 1)
    }
    Write-Output ($result | ConvertTo-Json -Compress)
} catch {
    Write-Output ('{"playing":false,"error":"' + ($_.Exception.Message -replace '"','''') + '"}')
}
