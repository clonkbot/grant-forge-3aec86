import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { AuthScreen } from "./components/AuthScreen";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      {isAuthenticated ? <Dashboard /> : <AuthScreen />}
      <Footer />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-amber-400/20 rounded-full animate-spin"
             style={{ borderTopColor: '#f59e0b' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-3 px-4 text-center bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none">
      <p className="text-[10px] sm:text-xs text-zinc-600 tracking-wide">
        Requested by <span className="text-zinc-500">@web-user</span> · Built by <span className="text-zinc-500">@clonkbot</span>
      </p>
    </footer>
  );
}
