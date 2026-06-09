import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import CreateBracket from './pages/CreateBracket.jsx';
import ViewBracket from './pages/ViewBracket.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<CreateBracket />} />
          <Route path="/:slug" element={<ViewBracket />} />
        </Routes>
      </main>
      <footer className="border-t border-emerald-900/30 py-6 text-center text-xs text-emerald-800">
        BracketWebb · 2026 FIFA World Cup · Free bracket predictions
      </footer>
    </div>
  );
}
