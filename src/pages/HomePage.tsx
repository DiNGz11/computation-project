import { Link } from 'react-router-dom';
import { he } from '../i18n/he';

export default function HomePage() {
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-purple-50/40 to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent mb-3">
          {he.app.title}
        </h1>
        <p className="text-lg text-gray-500 mb-12">{he.home.intro}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ModelCard
            to="/dfa"
            title={he.home.chooseDfa}
            desc={he.home.descDfa}
            gradient="from-purple-500 to-violet-600"
            bg="from-purple-50 to-violet-50"
            border="border-purple-200 hover:border-purple-400"
            icon="⚡"
          />
          <ModelCard
            to="/pda"
            title={he.home.choosePda}
            desc={he.home.descPda}
            gradient="from-indigo-500 to-blue-600"
            bg="from-indigo-50 to-blue-50"
            border="border-indigo-200 hover:border-indigo-400"
            icon="📚"
          />
          <ModelCard
            to="/tm"
            title={he.home.chooseTm}
            desc={he.home.descTm}
            gradient="from-teal-500 to-cyan-600"
            bg="from-teal-50 to-cyan-50"
            border="border-teal-200 hover:border-teal-400"
            icon="🖥️"
          />
        </div>
      </div>
    </div>
  );
}

function ModelCard({
  to, title, desc, gradient, bg, border, icon,
}: {
  to: string; title: string; desc: string;
  gradient: string; bg: string; border: string; icon: string;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border bg-gradient-to-br ${bg} ${border} shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className={`text-3xl mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
          <span className="text-xl">{icon}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
