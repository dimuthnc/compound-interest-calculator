import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { BarChart3 } from "lucide-react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center">
            <a className="flex items-center space-x-2" href="/">
              <span className="font-bold text-sm sm:text-base">
                Effective Interest Rate Calculator
              </span>
            </a>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              to="/summary"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-5 sm:py-8">
        <div className="flex flex-col gap-4">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
