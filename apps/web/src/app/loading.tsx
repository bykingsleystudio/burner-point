export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <div className="mx-auto h-14 w-14 rounded-full border-2 border-white/12 border-t-[#00FF9D] animate-spin" />
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">Loading Burner Point</p>
        <p className="mt-3 text-sm text-white/52">Private by Design. Stay Anonymous. Stay Connected.</p>
      </div>
    </main>
  );
}
