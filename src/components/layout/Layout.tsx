import type { PropsWithChildren } from "react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="hidden font-bold sm:inline-block">
                Effective Interest Rate Calculator
              </span>
            </a>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-5 sm:py-8">
        <div className="flex flex-col gap-4">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
