"use client";

import { useEffect } from "react";
import { getClientAnalytics } from "@/firebase/client";

export default function FirebaseAnalytics() {
  useEffect(() => {
    void getClientAnalytics();
  }, []);

  return null;
}
