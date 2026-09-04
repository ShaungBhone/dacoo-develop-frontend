import { BrandLogo } from "@/components/auth/auth-split-shell"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main
      data-auth-theme="light"
      className="flex min-h-svh flex-col bg-background px-6 py-8 scheme-light sm:px-10"
    >
      <header className="flex justify-center">
        <BrandLogo />
      </header>

      <div className="flex flex-1 items-center justify-center py-10 lg:py-12">
        <div className="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Dacoo. All rights reserved.</span>
        <span aria-hidden="true">·</span>
        <a
          href="https://dacoo.co/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Privacy
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://dacoo.co/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Terms
        </a>
      </footer>
    </main>
  )
}
