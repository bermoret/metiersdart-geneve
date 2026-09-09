export default function Loading() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-mag-cream border-t-mag-red rounded-full animate-spin" />
        <p className="text-sm text-mag-gray">Chargement…</p>
      </div>
    </div>
  );
}
