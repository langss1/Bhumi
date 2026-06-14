import { useWriteContract, usePublicClient, useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Swal from 'sweetalert2';

export function useSafeWriteContract() {
  const { writeContractAsync, writeContract, ...rest } = useWriteContract();
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const checkSLA = async (): Promise<boolean> => {
    try {
      if (!publicClient) return true; // Fallback jika client belum siap

      // Panggil RPC net_peerCount ke Blockchain lokal
      const peerCountHex = await publicClient.request({ method: 'net_peerCount' });
      const peerCount = parseInt(peerCountHex as string, 16);

      // net_peerCount = 0 artinya hanya ada 1 Node yang aktif (Node lokal)
      // Sesuai SLA, kita butuh minimal 2 Node (yang berarti peerCount >= 1)
      if (peerCount < 1) {
        Swal.fire({
          icon: 'error',
          title: 'SLA Terlanggar!',
          text: 'Transaksi dibatalkan. Sistem mendeteksi hanya ada 1 Node yang aktif di jaringan saat ini. Sesuai aturan SLA, minimal harus ada 2 Node yang beroperasi untuk menjaga keamanan data.',
          confirmButtonText: 'Mengerti',
          confirmButtonColor: '#1A3626', // Warna Hijau Moss-800
          background: '#FAFAFA',
          customClass: {
            title: 'text-2xl font-bold text-gray-800',
            htmlContainer: 'text-gray-600',
          }
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Gagal memeriksa SLA:", error);
      // Jika terjadi error saat mengecek (misal node lokalnya malah yang mati), 
      // kembalikan true agar wagmi/metamask yang menampilkan error aslinya
      return true; 
    }
  };

  const safeWriteContractAsync = async (args: any, options?: any) => {
    if (!isConnected) {
      try {
        await connectAsync({ connector: connectors[0] });
      } catch (err) {
        Swal.fire({
          icon: 'warning',
          title: 'Dompet Belum Terhubung',
          text: 'Harap hubungkan dompet MetaMask Anda untuk melakukan transaksi di Blockchain.',
        });
        throw new Error("WALLET_NOT_CONNECTED");
      }
    }

    const isSafe = await checkSLA();
    if (!isSafe) {
      // Lempar error diam-diam agar proses isPending di UI berhenti tanpa crash
      throw new Error("SLA_VIOLATION");
    }
    try {
      return await writeContractAsync(args, options);
    } catch (err: any) {
      if (err?.message?.includes('Connector not connected')) {
        throw new Error("Dompet MetaMask terputus. Pastikan MetaMask aktif dan muat ulang halaman jika perlu.");
      }
      throw err;
    }
  };

  const safeWriteContract = async (args: any, options?: any) => {
    if (!isConnected) {
      try {
        await connectAsync({ connector: connectors[0] });
      } catch (err) {
        Swal.fire({
          icon: 'warning',
          title: 'Dompet Belum Terhubung',
          text: 'Harap hubungkan dompet MetaMask Anda untuk melakukan transaksi di Blockchain.',
        });
        if (options?.onError) options.onError(new Error("WALLET_NOT_CONNECTED"));
        return;
      }
    }

    checkSLA().then(isSafe => {
      if (isSafe) {
        writeContract(args, {
          ...options,
          onError: (err: any) => {
            if (err?.message?.includes('Connector not connected')) {
              const customErr = new Error("Dompet MetaMask terputus. Pastikan MetaMask aktif dan muat ulang halaman jika perlu.");
              if (options?.onError) options.onError(customErr);
            } else {
              if (options?.onError) options.onError(err);
            }
          }
        });
      } else if (options?.onError) {
         options.onError(new Error("SLA_VIOLATION"));
      }
    });
  };

  return { 
    writeContractAsync: safeWriteContractAsync, 
    writeContract: safeWriteContract, 
    ...rest 
  };
}
