"use client";

import { useEffect } from "react";

export default function ClientInit() {
  useEffect(() => {
    import("@/lib/amplify");
  }, []);

  return null;
}