export default function Controls() {
  const rows = [
    ['W A S D', 'Move'], ['Shift', 'Run'], ['Space', 'Jump / catch a wave'], ['E', 'Interact (hold to repair)'],
    ['Mouse drag', 'Rotate camera'], ['Mouse wheel', 'Zoom'], ['Esc', 'Close windows'],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h4 className="mb-1 font-display text-lg font-bold">🖥️ Desktop</h4>
        <ul className="space-y-1 text-sm">
          {rows.map(([k, v]) => (
            <li key={k} className="flex gap-2">
              <kbd className="min-w-[96px] rounded bg-navy px-2 py-0.5 text-center font-bold text-white">{k}</kbd> {v}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className="mb-1 font-display text-lg font-bold">📱 Mobile</h4>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>Left joystick — move (and paddle while surfing)</li>
          <li>Drag the screen — rotate camera</li>
          <li>⤒ — jump · E — interact · RUN — toggle running</li>
          <li>While surfing: CATCH to take off, joystick to steer</li>
        </ul>
      </div>
    </div>
  );
}
