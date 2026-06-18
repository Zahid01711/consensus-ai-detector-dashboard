$ftpServer = "ftp://bst2.cloudswebserver.com"
$ftpUser = "cliqterc"
$ftpPass = "RHIA58rCSDxS-s"
$localFile = "f:\UNCP_Reaserch\dr. mohan honors ai detection\cpanel-standalone.zip"
$remotePath = "/home/cliqterc/ai.cliqter.com/cpanel-standalone.zip"

Write-Host "Uploading cpanel-standalone.zip via FTP..."
Write-Host "File size: $([math]::Round((Get-Item $localFile).Length / 1MB, 1)) MB"

$webclient = New-Object System.Net.WebClient
$creds = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
$webclient.Credentials = $creds

try {
    $webclient.UploadFile($ftpServer + $remotePath, $localFile)
    Write-Host "Upload complete!"
} catch {
    Write-Host "FTP Upload failed: $_"
}
