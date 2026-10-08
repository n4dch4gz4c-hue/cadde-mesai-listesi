# Kizilkayalar Sefim kurye havuzu
$ErrorActionPreference = "Stop"
$listen = "http://192.168.1.50:8787/"
$conn = "Data Source=(local);Initial Catalog=sefim;User ID=sa;Password=Vega1234;"
Add-Type -AssemblyName System.Web.Extensions
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = 20MB
$script:ordersJson = $null
$script:ordersAt = Get-Date
$script:linesTableFile = Join-Path $PSScriptRoot "lines-table.txt"

function GetOrdersCached {
  $now = Get-Date
  if ($script:ordersJson -and (($now - $script:ordersAt).TotalSeconds -lt 3)) {
    return $script:ordersJson
  }
  $script:ordersJson = GetOrders
  $script:ordersAt = $now
  return $script:ordersJson
}


function OpenDb {
  $cn = New-Object System.Data.SqlClient.SqlConnection($conn)
  $cn.Open()
  return $cn
}

function TeslimDosya { Join-Path $PSScriptRoot "teslim.json" }

function LoadTeslim {
  $p = TeslimDosya
  if (-not (Test-Path $p)) { return @() }
  try {
    $j = Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($null -eq $j) { return @() }
    return @($j)
  } catch { return @() }
}

function MarkTeslim([int]$id) {
  $set = New-Object System.Collections.ArrayList
  foreach ($x in LoadTeslim) {
    $s = [string]$x
    if ($s -ne "" -and $set -notcontains $s) { [void]$set.Add($s) }
  }
  $sid = [string]$id
  if ($set -notcontains $sid) { [void]$set.Add($sid) }
  $json = ConvertTo-Json @($set.ToArray())
  Set-Content -Path (TeslimDosya) -Value $json -Encoding UTF8
}

function GetOrders {
  $done = @{}
  foreach ($x in LoadTeslim) { $done[[string]$x] = $true }
  $cn = OpenDb
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = @"
SELECT poh.Id, poh.OrderNo, poh.CustomerName, poh.PhoneNumber, poh.Address, poh.Deliverer, poh.CreationTime,
  poh.PaymentNote,
  ISNULL(TRY_CONVERT(float, p.CashPayment),0) AS Nakit,
  ISNULL(TRY_CONVERT(float, p.CreditPayment),0)+ISNULL(TRY_CONVERT(float, p.KrediKarti),0) AS Kart,
  ISNULL(TRY_CONVERT(float, p.TicketPayment),0)+ISNULL(TRY_CONVERT(float, p.YemekKarti),0) AS Yemek,
  ISNULL(TRY_CONVERT(float, p.OnlinePayment),0)+ISNULL(TRY_CONVERT(float, p.OnlineOdeme),0) AS Online
FROM PhoneOrderHeader poh
LEFT JOIN Payment p ON p.HeaderId = poh.HeaderId
WHERE poh.CreationTime >= CASE
  WHEN CAST(GETDATE() AS time) >= '07:30:00'
    THEN DATEADD(minute,450, CAST(CAST(GETDATE() AS date) AS datetime))
  ELSE DATEADD(minute,450, CAST(DATEADD(day,-1,CAST(GETDATE() AS date)) AS datetime))
END
AND poh.CreationTime < CASE
  WHEN CAST(GETDATE() AS time) >= '07:30:00'
    THEN DATEADD(minute,1740, CAST(CAST(GETDATE() AS date) AS datetime))
  ELSE DATEADD(minute,1740, CAST(DATEADD(day,-1,CAST(GETDATE() AS date)) AS datetime))
END
ORDER BY poh.CreationTime ASC, poh.Id ASC
"@
  $rd = $cmd.ExecuteReader()
  $list = New-Object System.Collections.ArrayList
  while ($rd.Read()) {
    $kur = ""
    if (-not $rd.IsDBNull(5)) { $kur = ([string]$rd.GetValue(5)).Trim() }
    $oid = [string]$rd.GetValue(0)
    $teslimOk = $done.ContainsKey($oid)
    $st = if ($kur -eq "") { "havuz" } elseif ($teslimOk) { "teslim" } else { "uzerimde" }
    $nakit = 0; $kart = 0; $yemek = 0; $online = 0
    function D($ix) {
      if ($rd.IsDBNull($ix)) { return 0 }
      $v = $rd.GetValue($ix)
      try { return [double]$v } catch { return 0 }
    }
    $nakit = D 8; $kart = D 9; $yemek = D 10; $online = D 11
    $created = ""
    if (-not $rd.IsDBNull(6)) { $created = ([DateTime]$rd.GetDateTime(6)).ToString("o") }
    [void]$list.Add(@{
      id = $oid
      items = [string]$rd.GetValue(1)
      customer = $(if ($rd.IsDBNull(2)) { "" } else { [string]$rd.GetValue(2) })
      phone = $(if ($rd.IsDBNull(3)) { "" } else { [string]$rd.GetValue(3) })
      address = $(if ($rd.IsDBNull(4)) { "" } else { [string]$rd.GetValue(4) })
      status = $st
      delivered = $teslimOk
      created = $created
      courierName = $kur
      pay = $(if ($rd.IsDBNull(7)) { "" } else { [string]$rd.GetValue(7) })
      nakit = $nakit
      kart = $kart
      yemek = $yemek
      online = $online
      amount = $nakit + $kart + $yemek + $online
    })
  }
  $cn.Close()
  return $ser.Serialize(@{ orders = $list.ToArray() })
}


function GetLines([int]$id) {
  $debug = New-Object System.Collections.ArrayList
  try {
    if (Test-Path $script:linesTableFile) { $script:prefTable = (Get-Content $script:linesTableFile -Raw).Trim() } else { $script:prefTable = "" }

    if ($id -le 0) { return $ser.Serialize(@{ lines = @(); error = "id yok" }) }
    $cn = OpenDb
    $head = $cn.CreateCommand()
    $head.CommandText = "SELECT HeaderId, OrderNo FROM PhoneOrderHeader WHERE Id = @id"
    [void]$head.Parameters.AddWithValue("@id", $id)
    $hr = $head.ExecuteReader()
    $hid = $id
    $ono = ""
    if ($hr.Read()) {
      if (-not $hr.IsDBNull(0)) { $hid = $hr.GetValue(0) }
      if (-not $hr.IsDBNull(1)) { $ono = [string]$hr.GetValue(1) }
    }
    $hr.Close()
    $tab = $cn.CreateCommand()
    $tab.CommandText = "SELECT DISTINCT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME IN ('HeaderId','OrderNo')"
    $tr = $tab.ExecuteReader()
    $tables = New-Object System.Collections.ArrayList
    while ($tr.Read()) { [void]$tables.Add([string]$tr.GetValue(0)) }
    $tr.Close()
    if ($script:prefTable) {
      $ordered = New-Object System.Collections.ArrayList
      [void]$ordered.Add($script:prefTable)
      foreach ($t in $tables) { if ($t -ne $script:prefTable) { [void]$ordered.Add($t) } }
      $tables = $ordered
    }
    foreach ($tbl in $tables) {
      if ($tbl -eq "Payment" -or $tbl -eq "PhoneOrderHeader") { continue }
      $colCmd = $cn.CreateCommand()
      $colCmd.CommandText = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @t"
      [void]$colCmd.Parameters.AddWithValue("@t", $tbl)
      $cr = $colCmd.ExecuteReader()
      $hasH = $false; $hasO = $false
      while ($cr.Read()) {
        $c = [string]$cr.GetValue(0)
        if ($c -eq "HeaderId") { $hasH = $true }
        if ($c -eq "OrderNo") { $hasO = $true }
      }
      $cr.Close()
      $w = @()
      if ($hasH) { $w += "HeaderId IN (@v,@v2)" }
      if ($hasO -and $ono -ne "") { $w += "OrderNo = @ono" }
      if ($w.Count -eq 0) { continue }
      try {
        $cmd = $cn.CreateCommand()
        $cmd.CommandText = "SELECT TOP 40 * FROM dbo.[$tbl] WHERE " + ($w -join " OR ")
        [void]$cmd.Parameters.AddWithValue("@v", $hid)
        [void]$cmd.Parameters.AddWithValue("@v2", $id)
        if ($ono -ne "") { [void]$cmd.Parameters.AddWithValue("@ono", $ono) }
        $rd = $cmd.ExecuteReader()
        $tmp = New-Object System.Collections.ArrayList
        while ($rd.Read()) {
          $best = ""
          $adet = 1.0
          $tutar = 0.0
          $fiyat = 0.0
          for ($i=0; $i -lt $rd.FieldCount; $i++) {
            if ($rd.IsDBNull($i)) { continue }
            $n = $rd.GetName($i)
            $val = $rd.GetValue($i)
            if ($val -is [string]) {
              $t = $val.Trim()
              if ($t.Length -ge 3 -and $t.Length -gt $best.Length -and $t -notmatch "nakit|yemek kart|online|kredi|payment") {
                if ($n -notmatch "Phone|Tel|Address|Adres|Time|Date|Id$") { $best = $t }
              }
            } elseif ($val -is [byte] -or $val -is [int16] -or $val -is [int32] -or $val -is [int64] -or $val -is [decimal] -or $val -is [double] -or $val -is [float] -or $val -is [single]) {
              $num = 0.0
              try { $num = [double]$val } catch { continue }
              if ($n -match "Qty|Quantity|Adet|Count" -and $num -gt 0) { $adet = $num }
              elseif ($n -match "UnitPrice|^Price$|Fiyat") { $fiyat = $num }
              elseif ($n -match "LineTotal|^Total$|Tutar|^Amount$") { $tutar = $num }
            }
          }
          if ($best -eq "") { continue }
          if ($tutar -eq 0) { $tutar = $adet * $fiyat }
          [void]$tmp.Add(@{ name = $best; qty = $adet; price = $fiyat; total = $tutar })
        }
        $rd.Close()
        if ($tmp.Count -gt 0) {
          $cn.Close()
          try { Set-Content -Path $script:linesTableFile -Value $tbl -Encoding ASCII } catch {}
          return $ser.Serialize(@{ lines = $tmp.ToArray(); ok = $true; table = $tbl })
        }
      } catch {
        [void]$debug.Add($tbl + " " + $_.Exception.Message)
      }
    }
    $cn.Close()
    $pdbg = Join-Path $PSScriptRoot "lines-debug.txt"
    Set-Content -Path $pdbg -Value ($debug -join "`r`n") -Encoding UTF8
    return $ser.Serialize(@{ lines = @(); ok = $false; hints = $debug.ToArray() })
  } catch {
    return $ser.Serialize(@{ lines = @(); error = $_.Exception.Message })
  }
}

function GetCouriers {
  $cn = OpenDb
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = "SELECT Id, Name FROM Deliverer WHERE Name IS NOT NULL AND LTRIM(RTRIM(Name)) <> '' AND Name <> '...' ORDER BY Name"
  $rd = $cmd.ExecuteReader()
  $list = New-Object System.Collections.ArrayList
  while ($rd.Read()) {
    [void]$list.Add(@{ id = [string]$rd.GetValue(0); name = ([string]$rd.GetValue(1)).Trim() })
  }
  $cn.Close()
  return $ser.Serialize(@{ couriers = $list.ToArray() })
}

function Claim([int]$id, [int]$cid) {
  if ($id -le 0 -or $cid -le 0) { return 0 }
  $cn = OpenDb
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = @"
UPDATE PhoneOrderHeader
SET Deliverer = (SELECT Name FROM Deliverer WHERE Id = @cid),
    AssignDate = GETDATE(), IsUpdated = 1
WHERE Id = @id
AND (Deliverer IS NULL OR LTRIM(RTRIM(Deliverer)) = '')
AND EXISTS (SELECT 1 FROM Deliverer WHERE Id = @cid)
"@
  [void]$cmd.Parameters.AddWithValue("@cid", $cid)
  [void]$cmd.Parameters.AddWithValue("@id", $id)
  $n = $cmd.ExecuteNonQuery()
  $cn.Close()
  if ($n -ge 1) {
    try { TgoYolaCikti $id } catch { LogTgo ("TGO yola cikti HATA: " + $_.Exception.Message) }
  }
  return $n
}

function LogTgo($m) {
  $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " " + $m
  Add-Content -Path (Join-Path $PSScriptRoot "tgo-log.txt") -Value $line
  Write-Host $line
}

function LoadTgo {
  $p = Join-Path $PSScriptRoot "tgo.json"
  if (-not (Test-Path $p)) { return $null }
  return (Get-Content $p -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function FindPackageId([int]$id) {
  $cn = OpenDb
  $qT = $cn.CreateCommand()
  $qT.CommandText = "SELECT TrackingNumber FROM PhoneOrderHeader WHERE Id = @id"
  [void]$qT.Parameters.AddWithValue("@id", $id)
  $tr = $qT.ExecuteScalar()
  $val = ""
  if ($null -ne $tr -and ([string]$tr).Length -gt 20) {
    $val = [string]$tr
    if ($val.StartsWith("ty_")) { $val = $val.Substring(3) }
    LogTgo ("Paket no TrackingNumber = " + $val)
  }
  $cn.Close()
  return $val
}

function TgoYolaCikti([int]$id) {
  $cfg = LoadTgo
  if ($null -eq $cfg -or -not $cfg.enabled) {
    LogTgo "tgo.json yok veya enabled false - TGO atlandi"
    return
  }
  $pkg = FindPackageId $id
  if ([string]::IsNullOrWhiteSpace($pkg)) {
    LogTgo ("Sefim Id " + $id + " icin TGO paket no bulunamadi")
    return
  }
  [void](TgoPaket $pkg "manual-shipped" "yola cikti")
}

function TgoTeslim([int]$id) {
  $cfg = LoadTgo
  $pkg = FindPackageId $id
  if ([string]::IsNullOrWhiteSpace($pkg)) {
    MarkTeslim $id
    LogTgo ("Teslim yerel kaydedildi, TGO yok id=" + $id)
    return $true
  }
  if ($null -eq $cfg -or -not $cfg.enabled) {
    MarkTeslim $id
    LogTgo "tgo.json yok - teslim yerel"
    return $true
  }
  $ok = TgoPaket $pkg "manual-delivered" "teslim"
  if ($ok) { MarkTeslim $id; LogTgo ("Teslim kaydedildi id=" + $id) }
  return $ok
}

function TgoPaket($pkg, $aksiyon, $ad) {
  $cfg = LoadTgo
  $sid = [string]$cfg.supplierId
  $url = "https://api.tgoapis.com/integrator/order/meal/suppliers/$sid/packages/$pkg/$aksiyon"
  $pair = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($cfg.apiKey + ":" + $cfg.apiSecret)))
  $headers = @{
    Authorization = "Basic " + $pair
    "User-Agent" = $sid + " - SelfIntegration"
    "x-agentname" = [string]$cfg.agentName
    "x-executor-user" = [string]$cfg.executorUser
    "Content-Type" = "application/json"
  }
  $body = '{"actualDate":' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() + '}'
  LogTgo ("PUT " + $url)
  try {
    $r = Invoke-WebRequest -Uri $url -Method PUT -Headers $headers -Body $body -UseBasicParsing
    LogTgo ("TGO " + $ad + " OK " + $r.StatusCode + " paket=" + $pkg)
    return $true
  } catch {
    $resp = ""
    if ($_.Exception.Response) {
      $st = $_.Exception.Response.GetResponseStream()
      if ($st) { $resp = (New-Object IO.StreamReader($st)).ReadToEnd() }
    }
    LogTgo ("TGO " + $ad + " FAIL paket=" + $pkg + " " + $_.Exception.Message + " " + $resp)
    return $false
  }
}


$script:sessions = @{}
$script:monthRows = $null
$script:monthAt = (Get-Date).AddHours(-1)

function NormKur([string]$s) {
  if ([string]::IsNullOrWhiteSpace($s)) { return "" }
  $t = $s.ToLower([cultureinfo]::GetCultureInfo("tr-TR"))
  return ([regex]::Replace($t, "[.\s]+", " ")).Trim()
}
function IsAliName([string]$name) {
  $n = (NormKur $name).Replace("ş","s").Replace("ı","i")
  return ($n -eq "ali" -or $n -eq "ali a" -or $n -eq "sel ali" -or $n -eq "sef ali" -or $n.StartsWith("sel ali ") -or $n.StartsWith("sef ali ") -or $n.StartsWith("ali a "))
}
function TokenKey([string]$s) {
  $parts = @((NormKur $s).Split(" ") | Where-Object { $_ -ne "" } | Sort-Object)
  return ($parts -join " ")
}
function OneOff([string]$a, [string]$b) {
  if ($a -eq $b) { return $true }
  $la = $a.Length
  $lb = $b.Length
  if ([math]::Abs($la - $lb) -gt 1) { return $false }
  if ($la -eq $lb) {
    $d = 0
    for ($i = 0; $i -lt $la; $i++) { if ($a[$i] -ne $b[$i]) { $d++ } }
    return ($d -eq 1)
  }
  $short = $a
  $long = $b
  if ($lb -lt $la) { $short = $b; $long = $a }
  $i = 0
  $j = 0
  $skip = 0
  while ($i -lt $short.Length -and $j -lt $long.Length) {
    if ($short[$i] -eq $long[$j]) { $i++; $j++ }
    else { $skip++; $j++; if ($skip -gt 1) { return $false } }
  }
  return ($skip -le 1)
}
function NearPerson([string]$a, [string]$b) {
  $xa = @((NormKur $a).Split(" ") | Where-Object { $_ -ne "" } | Sort-Object)
  $xb = @((NormKur $b).Split(" ") | Where-Object { $_ -ne "" } | Sort-Object)
  if ($xa.Count -lt 2 -or $xa.Count -ne $xb.Count) { return $false }
  $diff = 0
  for ($i = 0; $i -lt $xa.Count; $i++) {
    if ($xa[$i] -eq $xb[$i]) { continue }
    $diff++
    if ($diff -gt 1) { return $false }
    if (-not (OneOff $xa[$i] $xb[$i])) { return $false }
  }
  return ($diff -eq 1)
}
function SameKur([string]$a, [string]$b) {
  $x = NormKur $a
  $y = NormKur $b
  if (-not $x -or -not $y) { return $false }
  if ($x -eq $y -or $x.Contains($y) -or $y.Contains($x)) { return $true }
  if ((TokenKey $a) -eq (TokenKey $b)) { return $true }
  return (NearPerson $a $b)
}
function PwPath { Join-Path $PSScriptRoot "sifre.json" }
function LoadPw {
  $h = @{}
  $p = PwPath
  if (-not (Test-Path $p)) { return ,$h }
  try {
    $obj = $ser.DeserializeObject((Get-Content $p -Raw -Encoding UTF8))
    if ($obj) {
      foreach ($k in @($obj.Keys)) { $h[[string]$k] = [string]$obj[$k] }
    }
  } catch {}
  return ,$h
}
function SavePw($h) {
  $parts = New-Object System.Collections.ArrayList
  foreach ($k in @($h.Keys)) {
    $id = ([string]$k) -replace '[^0-9]',''
    $rec = [string]$h[$k]
    if ($id -and $rec -match '^[0-9a-f]+\$[0-9a-f]+$') {
      [void]$parts.Add(('"' + $id + '":"' + $rec + '"'))
    }
  }
  Set-Content -Path (PwPath) -Value ("{" + ($parts -join ",") + "}") -Encoding UTF8
}
function NewSalt {
  $b = New-Object byte[] 8
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($b)
  return ([BitConverter]::ToString($b)).Replace("-","").ToLower()
}
function HashPw([string]$pw, [string]$salt) {
  $sha = [Security.Cryptography.SHA256]::Create()
  $bytes = [Text.Encoding]::UTF8.GetBytes($salt + ":" + $pw)
  $hash = $sha.ComputeHash($bytes)
  return ([BitConverter]::ToString($hash)).Replace("-","").ToLower()
}
function HasPw([string]$id) {
  $h = LoadPw
  return [bool]($h.ContainsKey([string]$id) -and $h[[string]$id])
}
function SetPw([string]$id, [string]$pw) {
  $salt = NewSalt
  $h = LoadPw
  $h[[string]$id] = $salt + '$' + (HashPw $pw $salt)
  SavePw $h
}
function CheckPw([string]$id, [string]$pw) {
  $h = LoadPw
  if (-not $h.ContainsKey([string]$id)) { return $false }
  $rec = [string]$h[[string]$id]
  $i = $rec.IndexOf('$')
  if ($i -lt 1) { return $false }
  $salt = $rec.Substring(0, $i)
  $want = $rec.Substring($i + 1)
  return ((HashPw $pw $salt) -eq $want)
}
function CourierById([string]$id) {
  $nid = 0
  if (-not [int]::TryParse($id, [ref]$nid)) { return $null }
  $cn = OpenDb
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = "SELECT Id, Name FROM Deliverer WHERE Id = @id"
  [void]$cmd.Parameters.AddWithValue("@id", $nid)
  $rd = $cmd.ExecuteReader()
  $row = $null
  if ($rd.Read()) {
    $nm = ""
    if (-not $rd.IsDBNull(1)) { $nm = ([string]$rd.GetValue(1)).Trim() }
    $row = @{ id = [string]$rd.GetValue(0); name = $nm }
  }
  $rd.Close()
  $cn.Close()
  return ,$row
}
function IssueToken($c, [bool]$full) {
  $t = [guid]::NewGuid().ToString("N")
  $script:sessions[$t] = @{ id = [string]$c.id; name = [string]$c.name; full = [bool]$full }
  return $t
}
function CurrentSession($req) {
  $h = $req.Headers["Authorization"]
  if (-not $h) { return $null }
  if (-not $h.StartsWith("Bearer ")) { return $null }
  $t = $h.Substring(7).Trim()
  if ($script:sessions.ContainsKey($t)) { return ,$script:sessions[$t] }
  return $false
}
function ReadBody($req) {
  try {
    if ($req.ContentLength64 -le 0) { return ,@{} }
    $sr = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
    $t = $sr.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($t)) { return ,@{} }
    $o = $ser.DeserializeObject($t)
    if ($null -eq $o) { return ,@{} }
    return ,$o
  } catch { return ,@{} }
}
function BodyVal($body, [string]$key) {
  if ($null -eq $body) { return "" }
  if ($body -is [System.Collections.IDictionary] -and $body.Contains($key) -and $null -ne $body[$key]) {
    return [string]$body[$key]
  }
  return ""
}
function JsonOf($obj) { return $ser.Serialize($obj) }
function FilterOrders([string]$json, [string]$name) {
  $obj = $ser.DeserializeObject($json)
  $mine = New-Object System.Collections.ArrayList
  $arr = @()
  if ($obj -and $obj.Contains("orders") -and $null -ne $obj["orders"]) { $arr = @($obj["orders"]) }
  foreach ($o in $arr) {
    $cn = ""
    if ($o -is [System.Collections.IDictionary] -and $o.Contains("courierName") -and $null -ne $o["courierName"]) {
      $cn = [string]$o["courierName"]
    }
    if (SameKur $cn $name) { [void]$mine.Add($o) }
  }
  return $ser.Serialize(@{ orders = $mine.ToArray() })
}
function GetMonthRows {
  $now = Get-Date
  if ($script:monthRows -and (($now - $script:monthAt).TotalSeconds -lt 60)) { return ,$script:monthRows }
  $cn = OpenDb
  $cmd = $cn.CreateCommand()
  $cmd.CommandText = @"
SELECT LTRIM(RTRIM(Deliverer)) AS Name, COUNT(*) AS Cnt
FROM PhoneOrderHeader
WHERE CreationTime >= DATEADD(day, -30, GETDATE())
AND Deliverer IS NOT NULL AND LTRIM(RTRIM(Deliverer)) <> ''
GROUP BY LTRIM(RTRIM(Deliverer))
"@
  $rd = $cmd.ExecuteReader()
  $list = New-Object System.Collections.ArrayList
  while ($rd.Read()) {
    [void]$list.Add(@{ name = [string]$rd.GetValue(0); count = [int]$rd.GetValue(1) })
  }
  $rd.Close()
  $cn.Close()
  $script:monthRows = $list
  $script:monthAt = $now
  return ,$list
}

$script:caddePeople = $null
$script:caddeAt = (Get-Date).AddHours(-1)
function DictStr($o, [string]$k) {
  if (-not ($o -is [System.Collections.IDictionary])) { return "" }
  if (-not $o.Contains($k) -or $null -eq $o[$k]) { return "" }
  return [string]$o[$k]
}
function DictNum($o, [string]$k) {
  $s = DictStr $o $k
  if (-not $s) { return 0.0 }
  $n = 0.0
  if ([double]::TryParse($s, [Globalization.NumberStyles]::Any, [Globalization.CultureInfo]::InvariantCulture, [ref]$n)) { return $n }
  return 0.0
}
function DictBool($o, [string]$k) {
  if (-not ($o -is [System.Collections.IDictionary])) { return $false }
  if (-not $o.Contains($k) -or $null -eq $o[$k]) { return $false }
  $v = $o[$k]
  if ($v -is [bool]) { return [bool]$v }
  return ([string]$v).ToLower() -eq "true"
}
function GetCaddePeople {
  try {
    $now = Get-Date
    if ($script:caddePeople -and (($now - $script:caddeAt).TotalSeconds -lt 120)) { return ,$script:caddePeople }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $rq = [Net.HttpWebRequest]::Create("https://api.github.com/repos/n4dch4gz4c-hue/cadde-mesai-listesi/contents/cadde-data.json")
    $rq.Method = "GET"
    $rq.UserAgent = "KuryeHavuz"
    $rq.Accept = "application/vnd.github+json"
    $rq.Timeout = 4000
    $rq.ReadWriteTimeout = 4000
    $resp = $rq.GetResponse()
    $sr = New-Object IO.StreamReader($resp.GetResponseStream())
    $metaRaw = $sr.ReadToEnd()
    $sr.Close()
    $resp.Close()
    $meta = $ser.DeserializeObject($metaRaw)
    $b64 = ([string]$meta["content"]) -replace "\s",""
    $raw = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
    $obj = $ser.DeserializeObject($raw)
    $list = New-Object System.Collections.ArrayList
    if ($obj -and ($obj -is [System.Collections.IDictionary]) -and $obj.Contains("people") -and $null -ne $obj["people"]) {
      foreach ($person in @($obj["people"])) { [void]$list.Add($person) }
    }
    $script:caddePeople = $list
    $script:caddeAt = $now
    return ,$list
  } catch {
    $empty = New-Object System.Collections.ArrayList
    $script:caddePeople = $empty
    $script:caddeAt = Get-Date
    return ,$empty
  }
}
function FindCaddePerson($people, [string]$name) {
  foreach ($person in @($people)) {
    if (SameKur (DictStr $person "name") $name) { return ,$person }
  }
  return $null
}
function UcretHash([string]$name, [int]$paket, $person, [int]$maas) {
  $saat = 0.0
  $birim = 0.0
  $hs = 0.0
  if ($person) {
    $saat = DictNum $person "mesaiSaat"
    $birim = DictNum $person "mesaiBirim"
    $hs = DictNum $person "hsSaat"
  }
  $paketTl = $paket * 7
  $mesaiTl = [int][math]::Round($saat * $birim)
  $hsTl = [int][math]::Round($hs * 2500)
  $h = @{
    name = $name
    paket = $paket
    paketTl = $paketTl
    mesaiSaat = $saat
    mesaiBirim = [int][math]::Round($birim)
    mesaiTl = $mesaiTl
    hsSaat = $hs
    hsTl = $hsTl
    maas = $maas
    eline = ($paketTl + $mesaiTl + $hsTl + $maas)
  }
  return ,$h
}
function MaasPath { Join-Path $PSScriptRoot "maas.json" }
function LoadMaas {
  $h = @{}
  $p = MaasPath
  if (-not (Test-Path $p)) { return ,$h }
  try {
    $obj = $ser.DeserializeObject((Get-Content $p -Raw -Encoding UTF8))
    if ($obj) {
      foreach ($k in @($obj.Keys)) {
        $rec = $obj[$k]
        $nm = ""
        $maas = 0
        if ($rec -is [System.Collections.IDictionary]) {
          $nm = DictStr $rec "name"
          $maas = [int][math]::Round((DictNum $rec "maas"))
        }
        $h[[string]$k] = @{ name = $nm; maas = $maas }
      }
    }
  } catch {}
  return ,$h
}
function SaveMaas($h) {
  $parts = New-Object System.Collections.ArrayList
  foreach ($k in @($h.Keys)) {
    $id = ([string]$k) -replace '[^0-9]',''
    $rec = $h[$k]
    $nm = (([string]$rec.name) -replace '[^0-9A-Za-zÇĞİÖŞÜçğıöşü .\-]','').Trim()
    $maas = 0
    [int]::TryParse([string]$rec.maas, [ref]$maas) | Out-Null
    if ($maas -lt 0) { $maas = 0 }
    if ($id) { [void]$parts.Add(('"' + $id + '":{"name":"' + $nm + '","maas":' + $maas + '}')) }
  }
  Set-Content -Path (MaasPath) -Value ("{" + ($parts -join ",") + "}") -Encoding UTF8
}
function MaasOf($book, [string]$name, [string]$id) {
  if ($id -and $book.ContainsKey([string]$id)) { return [int]$book[[string]$id].maas }
  foreach ($k in @($book.Keys)) {
    if (SameKur ([string]$book[$k].name) $name) { return [int]$book[$k].maas }
  }
  return 0
}
function BuildUcretJson($sess) {
  $months = @(GetMonthRows)
  $people = @(GetCaddePeople)
  $book = LoadMaas
  if ($sess.full) {
    $out = New-Object System.Collections.ArrayList
    foreach ($row in $months) {
      $nm = [string]$row.name
      if (-not $nm) { continue }
      $person = FindCaddePerson $people $nm
      [void]$out.Add((UcretHash $nm ([int]$row.count) $person (MaasOf $book $nm "")))
    }
    foreach ($person in $people) {
      if (-not (DictBool $person "kurye")) { continue }
      $nm = DictStr $person "name"
      $already = $false
      foreach ($row in $months) { if (SameKur ([string]$row.name) $nm) { $already = $true } }
      if ($already) { continue }
      [void]$out.Add((UcretHash $nm 0 $person (MaasOf $book $nm "")))
    }
    return JsonOf @{ ok = $true; people = $out.ToArray() }
  }
  $n = 0
  foreach ($row in $months) { if (SameKur ([string]$row.name) $sess.name) { $n += [int]$row.count } }
  $person = FindCaddePerson $people $sess.name
  $one = UcretHash $sess.name $n $person (MaasOf $book $sess.name ([string]$sess.id))
  $one.ok = $true
  return JsonOf $one
}

$htmlFile = Join-Path $PSScriptRoot "kurye-ui.html"
if (-not (Test-Path $htmlFile)) { Write-Host "kurye-ui.html yok. Masaustune koy."; throw "kurye-ui.html eksik" }
$html = Get-Content -Path $htmlFile -Raw -Encoding UTF8

$http = New-Object System.Net.HttpListener
$http.Prefixes.Add($listen)
$http.Start()
Write-Host "ACIK http://192.168.1.50:8787/"
Write-Host "Bu pencereyi kapatma."
if (Test-Path (Join-Path $PSScriptRoot "tgo.json")) { Write-Host "TGO dosyasi bulundu. Uzerime al = yola cikti." } else { Write-Host "tgo.json YOK - TGO atlanacak." }
while ($http.IsListening) {
  try {
    $ctx = $http.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $buf = [Text.Encoding]::UTF8.GetBytes("{}")
    try {
      $path = $req.Url.AbsolutePath
      if ($path -eq "/api/orders") {
        $raw = GetOrdersCached
        $sess = CurrentSession $req
        if ($sess -eq $false) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Giris suresi doldu"}')
          $res.StatusCode = 401
        } else {
          if ($sess -and -not $sess.full) {
            try { $raw = FilterOrders $raw $sess.name } catch { }
          }
          $buf = [Text.Encoding]::UTF8.GetBytes($raw)
        }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/password-status") {
        $cid = [string]$req.QueryString["id"]
        $c = CourierById $cid
        $has = $false
        if ($c -and -not (IsAliName $c.name)) { $has = HasPw $cid }
        $buf = [Text.Encoding]::UTF8.GetBytes((JsonOf @{ ok = $true; hasPassword = [bool]$has }))
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/set-password") {
        $body = ReadBody $req
        $cid = BodyVal $body "id"
        $pw = BodyVal $body "password"
        $c = CourierById $cid
        if (-not $c) { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Kurye yok"}') }
        elseif (IsAliName $c.name) { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Ali sifresiz girer"}') }
        elseif ($pw.Length -lt 4) { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Parola en az 4 karakter"}') }
        else { SetPw $cid $pw; $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":true}') }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/login") {
        $body = ReadBody $req
        $cid = BodyVal $body "id"
        $pw = BodyVal $body "password"
        $c = CourierById $cid
        if (-not $c) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Kurye yok"}')
        } elseif (IsAliName $c.name) {
          $tok = IssueToken $c $false
          $buf = [Text.Encoding]::UTF8.GetBytes((JsonOf @{ ok = $true; token = $tok; name = $c.name }))
        } elseif (-not (HasPw $cid)) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"needSetup":true,"error":"Ilk giris"}')
        } elseif (-not (CheckPw $cid $pw)) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Parola hatali"}')
        } else {
          $tok = IssueToken $c $false
          $buf = [Text.Encoding]::UTF8.GetBytes((JsonOf @{ ok = $true; token = $tok; name = $c.name }))
        }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/reset-password") {
        $sess = CurrentSession $req
        $body = ReadBody $req
        $cid = BodyVal $body "id"
        $pw = BodyVal $body "password"
        $c = CourierById $cid
        if (-not $sess -or $sess -eq $false -or -not (IsAliName ([string]$sess.name))) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Sifre sifirlama sadece Ali"}')
          $res.StatusCode = 403
        } elseif (-not $c) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Kurye yok"}')
        } elseif (IsAliName $c.name) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Ali sifresiz girer"}')
        } elseif ($pw.Length -lt 4) {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Parola en az 4 karakter"}')
        } else {
          SetPw $cid $pw
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/month") {
        try {
          $sess = CurrentSession $req
          if (-not $sess -or $sess -eq $false) {
            $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false}')
          } else {
            $rows = @(GetMonthRows)
            if ($sess.full) {
              $buf = [Text.Encoding]::UTF8.GetBytes((JsonOf @{ ok = $true; couriers = $rows }))
            } else {
              $n = 0
              foreach ($row in $rows) {
                if (SameKur $row.name $sess.name) { $n += [int]$row.count }
              }
              $buf = [Text.Encoding]::UTF8.GetBytes((JsonOf @{ ok = $true; count = $n }))
            }
          }
        } catch {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false}')
        }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/ucret") {
        try {
          $sess = CurrentSession $req
          if (-not $sess -or $sess -eq $false) {
            $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false}')
          } else {
            $buf = [Text.Encoding]::UTF8.GetBytes((BuildUcretJson $sess))
          }
        } catch {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false}')
        }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/maas") {
        try {
          $sess = CurrentSession $req
          if (-not $sess -or $sess -eq $false) {
            $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false}')
            $res.StatusCode = 401
          } else {
            $body = ReadBody $req
            $raw = (BodyVal $body "maas") -replace '[^0-9]',''
            $n = 0
            [int]::TryParse($raw, [ref]$n) | Out-Null
            if ($n -lt 0) { $n = 0 }
            $book = LoadMaas
            $book[[string]$sess.id] = @{ name = [string]$sess.name; maas = $n }
            SaveMaas $book
            $buf = [Text.Encoding]::UTF8.GetBytes((JsonOf @{ ok = $true; maas = $n }))
          }
        } catch {
          $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false}')
        }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/couriers") {
        $buf = [Text.Encoding]::UTF8.GetBytes((GetCouriers))
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/teslim") {
        $id = 0
        [int]::TryParse($req.QueryString["id"], [ref]$id) | Out-Null
        $ok = TgoTeslim $id
        if ($ok) { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":true}') }
        else { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"TGO teslim hata"}'); $res.StatusCode = 500 }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/tgo-retry") {
        $id = 0
        [int]::TryParse($req.QueryString["id"], [ref]$id) | Out-Null
        TgoYolaCikti $id
        $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":true}')
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/lines") {
        $id = 0
        [int]::TryParse($req.QueryString["id"], [ref]$id) | Out-Null
        $buf = [Text.Encoding]::UTF8.GetBytes((GetLines $id))
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/api/claim") {
        $id = 0; $cidn = 0
        [int]::TryParse($req.QueryString["id"], [ref]$id) | Out-Null
        [int]::TryParse($req.QueryString["cid"], [ref]$cidn) | Out-Null
        $n = Claim $id $cidn
        if ($n -ge 1) { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":true}') }
        else { $buf = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Bu siparis alinmis"}'); $res.StatusCode = 409 }
        $res.ContentType = "application/json; charset=utf-8"
      } elseif ($path -eq "/manifest.json") {
        $man = '{"name":"Kizilkayalar Kurye","short_name":"Kurye","start_url":"/","scope":"/","display":"standalone","background_color":"#0b1220","theme_color":"#0b1220","icons":[{"src":"/kk-logo.png","sizes":"192x192","type":"image/png","purpose":"any"}]}'
        $buf = [Text.Encoding]::UTF8.GetBytes($man)
        $res.ContentType = "application/manifest+json; charset=utf-8"
      } elseif ($path -eq "/kk-logo.png") {
        $lp = Join-Path $PSScriptRoot "kk-logo.png"
        if (Test-Path $lp) { $buf = [IO.File]::ReadAllBytes($lp); $res.ContentType = "image/png" }
        else { $buf = [Text.Encoding]::UTF8.GetBytes(""); $res.StatusCode = 404 }
      } else {
        $buf = [Text.Encoding]::UTF8.GetBytes($html)
        $res.ContentType = "text/html; charset=utf-8"
      }
    } catch {
      $msg = $_.Exception.Message.Replace('"',' ')
      $buf = [Text.Encoding]::UTF8.GetBytes(('{"ok":false,"error":"' + $msg + '"}'))
      try { $res.StatusCode = 500 } catch {}
      $res.ContentType = "application/json; charset=utf-8"
    }
    try {
      $res.ContentLength64 = $buf.Length
      $res.OutputStream.Write($buf, 0, $buf.Length)
    } catch {}
    try { $res.Close() } catch {}
  } catch {
    Write-Host ("Istek atlandi: " + $_.Exception.Message)
  }
}
