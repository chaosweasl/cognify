import { useEffect, useState } from "react";

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  // TODO: Replace with API-based or context-based user ID retrieval
  // For now, this hook should not use Supabase client directly on the client side.
  // You may want to pass userId from a higher-level context or fetch from an API route.

  return userId;
}
