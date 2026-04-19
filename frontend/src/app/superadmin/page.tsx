'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /superadmin is a legacy route — redirect to /admin which is the unified SuperAdmin Console.
 */
export default function SuperAdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return null;
}
