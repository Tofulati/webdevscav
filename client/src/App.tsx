import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import Instructions from './pages/Instructions';
import Leaderboards from './pages/Leaderboards';
import GamePage from './pages/GamePage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />

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
      <Analytics />
    </BrowserRouter>
  );
}