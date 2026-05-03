import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DfaPage from './pages/DfaPage';
import PdaPage from './pages/PdaPage';
import TmPage from './pages/TmPage';
import { he } from './i18n/he';

export default function App() {
  return (
    <div className="h-full w-full flex flex-col">
      <header className="bg-white border-b border-purple-100 shadow-sm flex-shrink-0">
        <nav className="flex items-center gap-1 px-4 py-2">
          <NavLink
            to="/"
            className="text-lg font-bold bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent ml-4 hover:opacity-80 transition-opacity"
          >
            {he.app.title}
          </NavLink>
          <div className="flex gap-1 mr-auto">
            <NavTab to="/dfa" color="purple">{he.app.dfa}</NavTab>
            <NavTab to="/pda" color="indigo">{he.app.pda}</NavTab>
            <NavTab to="/tm"  color="teal"  >{he.app.tm}</NavTab>
          </div>
        </nav>
      </header>
      <main className="flex-1 min-h-0 overflow-hidden">
        <Routes>
          <Route path="/"    element={<HomePage />} />
          <Route path="/dfa" element={<DfaPage />}  />
          <Route path="/pda" element={<PdaPage />}  />
          <Route path="/tm"  element={<TmPage />}   />
          <Route path="*"    element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const tabStyles = {
  purple: { active: 'bg-purple-100 text-purple-800', hover: 'hover:bg-purple-50 hover:text-purple-700' },
  indigo: { active: 'bg-indigo-100 text-indigo-800', hover: 'hover:bg-indigo-50 hover:text-indigo-700' },
  teal:   { active: 'bg-teal-100   text-teal-800',   hover: 'hover:bg-teal-50   hover:text-teal-700'   },
};

function NavTab({
  to, color = 'purple', children,
}: { to: string; color?: keyof typeof tabStyles; children: React.ReactNode }) {
  const s = tabStyles[color];
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          isActive ? s.active : `text-gray-500 ${s.hover}`
        }`
      }
    >
      {children}
    </NavLink>
  );
}
