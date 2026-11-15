import AuthCard from '../components/AuthCard.jsx';
import Controls from '../components/Controls.jsx';

export default function AboutPage() {
  return (
    <AuthCard title="📖 About the Game" wide>
      <div className="space-y-4 text-navy">
        <p className="text-lg font-semibold">
          <b>Siargao Pixel Life: Island of Hope</b> is a 3D educational adventure inspired by the real island of Siargao, Surigao del Norte, Philippines.
        </p>
        <p>
          Explore nine destinations — Cloud 9, Magpupungko Rock Pools, Sugba Lagoon, Naked Island, Guyam Island, Daku Island, Pacifico Beach, Sohoton Cove and Taktak Falls.
          Surf the famous Cloud 9 wave, paddle a kayak through Sugba Lagoon, talk to locals, take conservation quizzes and join cleanups that
          visibly improve each destination. Every cleanup is recorded on the server and adds to the shared community progress of the whole island.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['🧹', 'Clean', 'Collect litter and maintain public areas. Cleanliness meters respond to real mission records.'],
            ['🐢', 'Protect', 'Learn how waste harms marine life and how to be a responsible visitor.'],
            ['🏄', 'Play', 'Surf, kayak, explore and earn badges, boards and style items.'],
          ].map(([i, t, d]) => (
            <div key={t} className="rounded-2xl bg-sand/40 p-3">
              <div className="text-3xl">{i}</div>
              <div className="font-display text-lg font-bold">{t}</div>
              <p className="text-sm">{d}</p>
            </div>
          ))}
        </div>
        <h3 className="font-display text-xl font-bold">Controls</h3>
        <Controls />
        <blockquote className="rounded-2xl bg-tropical p-4 font-semibold text-white">
          “Whether you are a local resident or a tourist, Siargao is everyone's responsibility. Do not litter anywhere. Keep our tourist destinations
          clean, protect marine life, respect our communities, and help maintain the beauty of our island for future generations.”
        </blockquote>
      </div>
    </AuthCard>
  );
}
