export default function Loading({ label = 'Loading…', tip, photo, caption }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky via-ocean to-navy text-center">
      {photo && (
        <>
          <img src={photo} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/20 to-navy/80" />
        </>
      )}
      <div className="relative flex flex-col items-center">
        <div className="animate-bob text-6xl">🌴</div>
        <div className="mt-4 font-display text-3xl font-extrabold title-stroke">{label}</div>
        <div className="mt-4 h-2 w-56 overflow-hidden rounded-full bg-white/30">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-sunset" />
        </div>
        {tip && <p className="mt-6 max-w-md px-6 text-sm font-semibold text-white/90 drop-shadow">💡 {tip}</p>}
        {caption && <p className="mt-2 text-xs font-semibold text-white/70">📷 {caption}</p>}
      </div>
    </div>
  );
}
