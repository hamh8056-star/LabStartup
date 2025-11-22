"use client"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-slate-50/60 px-4 py-12 dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_45%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.2),_transparent_46%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,_rgba(255,255,255,0.2),_rgba(255,255,255,0)),_linear-gradient(to_bottom,_rgba(15,23,42,0.15),_rgba(15,23,42,0))] dark:bg-[linear-gradient(to_right,_rgba(9,9,11,0.6),_rgba(9,9,11,0.2)),_linear-gradient(to_bottom,_rgba(15,23,42,0.6),_rgba(15,23,42,0.1))]" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}






