# ============================================================
# BHUMI NETWORK CONFIGURATION (FIXED IPs)
# Edit file ini sekali untuk semua laptop!
# ============================================================

# IP ZeroTier / Radmin VPN masing-masing laptop
$IP_LAPTOP1 = "10.223.153.80"   # Gilang (Pusat)
$IP_LAPTOP2 = "10.223.153.176"  # Arin (Wilayah A)
$IP_LAPTOP3 = "10.223.153.30"   # Ihab (Wilayah B)

# Public Key / Enode ID (Bisa didapat dari output besu saat start)
# Format: enode://PUBKEY@IP:PORT
$ENODE_1 = "aecca68df415b2ae78193329cfd5cccf0493f2252e633b2cc05965466442a75a2b657cf0c3785d321f14be999d9e0f7b0c1c2f501a8a855f5da1a331c8b77338"
$ENODE_2 = "6a03ce7f21fd3ddc2335fbde4fc75e12f5813607f0a7870ea6433cb70b6b8b5d3e29568e648eb7e4a189d807e42168326c4f846ed3b4edfe5002cbc64ca79655"
$ENODE_3 = "f6c74bd81d47e9ddd49ddc11329860be6bfb64cf4a43c9eae3d4b81c08e83154822d110586f08f61d9f26235d0983d9da3af7f0677acfd31467d056cad87e0d2"

# Gabungkan jadi daftar bootnodes
$ALL_BOOTNODES = "enode://$($ENODE_1)@$($IP_LAPTOP1):30303,enode://$($ENODE_2)@$($IP_LAPTOP2):30303,enode://$($ENODE_3)@$($IP_LAPTOP3):30303"

function Get-My-IP {
    # Fungsi pembantu untuk deteksi IP lokal
    $ip = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.InterfaceAlias -like '*ZeroTier*' }).IPAddress
    if (!$ip) { $ip = "127.0.0.1" }
    return $ip
}
