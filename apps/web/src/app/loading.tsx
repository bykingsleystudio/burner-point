import Image from 'next/image';

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020806] px-6 text-white">
      <div className="text-center">
        <Image src="/assets/burner-point-icon-gradient.svg" alt="Burner Point" width={72} height={72} className="mx-auto h-16 w-16 animate-pulse" priority />
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00FF9D]">Loading Burner Point</p>
        <p className="mt-3 text-sm text-white/52">Private by Design. Stay Anonymous. Stay Connected.</p>
      </div>
    </main>
  );
}
