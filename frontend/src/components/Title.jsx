export default function Title({ small = false }) {
  return (
    <div className="select-none text-center">
      <div className={`font-display font-extrabold leading-[0.85] text-white title-stroke ${small ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-7xl'}`}>
        SIARGAO
      </div>
      <div className={`font-display font-extrabold leading-[0.9] title-stroke ${small ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl'}`} style={{ color: '#ffd166' }}>
        PIXEL LIFE
      </div>
      <div className="mx-auto mt-2 inline-block rounded-xl border-4 border-[#5b3a1e] bg-[#8a5a32] px-4 py-0.5 font-display text-lg font-extrabold tracking-wide text-white shadow-lg sm:text-2xl">
        ISLAND OF HOPE
      </div>
      {!small && <p className="mt-3 font-display text-lg font-bold italic text-white drop-shadow-[0_2px_2px_rgba(16,42,67,0.9)] sm:text-2xl">“Play, Protect, and Rebuild Our Island.”</p>}
    </div>
  );
}
