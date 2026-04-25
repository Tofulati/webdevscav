import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { SmallScreenWarning } from './components/layout/SmallScreenWarning';
import { Footer } from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import Instructions from './pages/Instructions';
import Leaderboards from './pages/Leaderboards';
import GamePage from './pages/GamePage';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <div className="app-layout">
        <Navbar />
        <SmallScreenWarning />

        <main className="app-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/instructions" element={<Instructions />} />
            <Route path="/leaderboard" element={<Leaderboards />} />
            <Route path="/play" element={<GamePage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}