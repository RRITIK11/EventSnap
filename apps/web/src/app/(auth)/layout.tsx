export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">EventSnap</h1>
      <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-lg">
        {children}
      </div>
    </main>
  );
}
