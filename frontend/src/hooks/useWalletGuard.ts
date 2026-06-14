import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export function useWalletGuard() {
  const { address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // Fungsi pembaca cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    // Ambil wallet dari cookie (paling valid) atau localStorage (fallback)
    const cookieWallet = getCookie('verified_wallet');
    const localWallet = localStorage.getItem('connected_wallet');
    const savedWallet = cookieWallet || localWallet;
    
    // Cek apakah user sedang login (punya role cookie)
    const hasRoleCookie = document.cookie.includes('user_role=');

    // Jika user login via Web3 tapi tidak punya jejak wallet (sesi usang dari sebelum update)
    if (hasRoleCookie && !savedWallet) {
      // Kita asumsikan ini sesi Web3 yang sudah basi karena tidak ada jejak wallet
      // TAPI: Traditional Login juga tidak punya savedWallet! 
      // Untuk membedakannya secara aman, kita biarkan saja. Fallback di komponen akan menanganinya.
    }

    // Jika ada jejak wallet yang tersimpan
    if (hasRoleCookie && savedWallet && address) {
      if (savedWallet.toLowerCase() !== address.toLowerCase()) {
        console.warn('⚠️ Wallet Switch Detected! Kicking user out...');
        
        // Hancurkan semua sesi Web3
        localStorage.removeItem('connected_wallet');
        document.cookie = 'user_role=; Max-Age=0; path=/';
        document.cookie = 'verified_wallet=; Max-Age=0; path=/';
        
        alert('Keamanan Ditingkatkan: Anda mengganti akun MetaMask di tengah sesi. Silakan login kembali.');
        window.location.href = '/login';
      }
    }
  }, [address, router]);
}
