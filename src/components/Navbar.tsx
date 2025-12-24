"use client";

import { useUser, SignOutButton, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HomeIcon, Calendar, Mic, Crown, MessageSquare } from "lucide-react";

function Navbar() {
  const { user } = useUser();
  const pathname = usePathname();

  // Show Contact menu if user is on admin pages or if pathname starts with /admin
  const isAdmin = pathname.startsWith("/admin");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-2 border-b border-border/50 bg-background/80 backdrop-blur-md h-16">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
        {/* LOGO */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="DentWise Logo"
              width={32}
              height={32}
              className="w-11"
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 transition-colors ${
                pathname === "/dashboard"
                  ? "text-foreground hover:text-orange-500 font-medium"
                  : "text-muted-foreground hover:text-orange-500"
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
            <Link
              href="/appointments"
              className={`flex items-center gap-2 transition-colors hover:text-orange-500 ${
                pathname === "/appointments"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden md:inline">Appointments</span>
            </Link>
            <Link
              href="/voice"
              className={`flex items-center gap-2 transition-colors hover:text-orange-500 ${
                pathname === "/voice"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden md:inline">Voice</span>
            </Link>
            <Link
              href="/pro"
              className={`flex items-center gap-2 transition-colors hover:text-orange-500 ${
                pathname === "/pro"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Crown className="w-4 h-4" />
              <span className="hidden md:inline">Pro</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin/contact"
                className={`flex items-center gap-2 transition-colors hover:text-orange-500 ${
                  pathname === "/admin/contact"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline">Contact</span>
              </Link>
            )}
          </div>
        </div>
        {/* RIGHT SECTION - USER INFO */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-lg",
                  userButtonPopoverFooter: "border-t border-border",
                },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
