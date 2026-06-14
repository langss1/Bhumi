export const cleanNIB = (nib: string | null | undefined) => {
  if (!nib) return '-';
  if (nib.startsWith('ENC:')) return '13010203040506'; // Fake NIB
  return nib;
};

export const cleanGPS = (gps: string | null | undefined) => {
  if (!gps) return '-';
  if (gps.startsWith('ENC:')) return '-6.20, 106.81'; // Fake GPS
  return gps;
};
