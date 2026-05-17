export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal unggah ke IPFS');

    // Mengembalikan CID (Hash IPFS)
    return data.IpfsHash;
  } catch (error) {
    console.error('IPFS Upload Error:', error);
    throw error;
  }
};
