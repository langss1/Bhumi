import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export function useWalletGuard() {
  const { address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // Ambil wallet yang digunakan saat login
    const savedWallet = localStorage.getItem('connected_wallet');
    
    // Hanya memantau jika sebelumnya ada wallet yang tersimpan (berarti login via Web3)
    if (savedWallet && address) {
      if (savedWallet.toLowerCase() !== address.toLowerCase()) {
        console.warn('⚠️ Wallet Switch Detected! Kicking user out...');
        
        // Hapus jejak login
        localStorage.removeItem('connected_wallet');
        document.cookie = 'user_role=; Max-Age=0; path=/';
        
        // Kembalikan ke halaman login
        alert('Keamanan Ditingkatkan: Anda mengganti akun MetaMask di tengah sesi. Silakan login kembali.');
        window.location.href = '/login';
      }
    }
  }, [address, router]);
}
