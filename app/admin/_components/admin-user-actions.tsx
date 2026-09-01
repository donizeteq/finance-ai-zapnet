"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { toggleUserPremium } from "../_actions/toggle-user-premium";
import { CrownIcon, UserMinusIcon } from "lucide-react";

interface AdminUserActionsProps {
  userId: string;
  isPremium: boolean;
}

export default function AdminUserActions({
  userId,
  isPremium,
}: AdminUserActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleUserPremium(userId, !isPremium);
    } catch (err) {
      console.error("Erro ao alterar plano:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={isPremium ? "outline" : "default"}
      disabled={loading}
      onClick={handleToggle}
      className="gap-1.5 text-xs"
    >
      {isPremium ? (
        <>
          <UserMinusIcon className="h-3.5 w-3.5 text-rose-400" />
          Remover Premium
        </>
      ) : (
        <>
          <CrownIcon className="h-3.5 w-3.5 text-amber-400" />
          Conceder Premium
        </>
      )}
    </Button>
  );
}
