import type { PropsWithChildren } from "react";

export function ScreenContainer({ children }: PropsWithChildren) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col overflow-hidden bg-white/85 shadow-soft backdrop-blur">
      <div className="pointer-events-none absolute -left-24 top-12 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-64 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="relative z-10 flex h-full flex-1 flex-col">{children}</div>
    </div>
  );
}
