"use client";

import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, CrownIcon } from "lucide-react";

const NavBarInner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const metadata = user?.publicMetadata ?? {};
  const isPremium = isLoaded && metadata.subscriptionPlan === "premium";

  const toggleMenu = () => setIsOpen(!isOpen);

  const linkClass = (path: string) =>
    pathname === path ? "font-bold text-primary" : "text-muted-foreground";

  return (
    <nav className="flex items-center justify-between border-b border-solid px-4 py-4 md:px-8">
      <div className="flex items-center gap-4">
        <Image src={"/logo.svg"} width={173} height={39} alt="Finance AI" />
      </div>

      {/* Desktop Links */}
      <div className="hidden items-center gap-10 md:flex">
        <Link href="/" className={linkClass("/")}>Dashboard</Link>
        <Link href="/transactions" className={linkClass("/transactions")}>Transações</Link>
        <Link href="/subscription" className={linkClass("/subscription")}>Assinatura</Link>
        {isPremium && (
          <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-xs font-bold text-black">
            <CrownIcon className="h-3 w-3" />
            PREMIUM
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <UserButton showName />
        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute left-0 top-16 z-50 flex w-full flex-col gap-4 border-b bg-background p-6 md:hidden">
          <Link href="/" className={linkClass("/")} onClick={toggleMenu}>Dashboard</Link>
          <Link href="/transactions" className={linkClass("/transactions")} onClick={toggleMenu}>Transações</Link>
          <Link href="/subscription" className={linkClass("/subscription")} onClick={toggleMenu}>Assinatura</Link>
          {isPremium && (
            <span className="flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-xs font-bold text-black">
              <CrownIcon className="h-3 w-3" />
              PREMIUM
            </span>
          )}
        </div>
      )}
    </nav>
  );
};

const NavBar = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <nav className="flex items-center justify-between border-b border-solid px-4 py-4 md:px-8">
        <div className="flex items-center gap-4">
          <Image src={"/logo.svg"} width={173} height={39} alt="Finance AI" />
        </div>
        <div className="h-8 w-8" />
      </nav>
    );
  }

  return <NavBarInner />;
};

export default NavBar;
