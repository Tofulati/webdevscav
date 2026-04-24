import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import Instructions from './pages/Instructions';
import Leaderboards from './pages/Leaderboards';
import GamePage from './pages/GamePage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/leaderboard" element={<Leaderboards />} />
        <Route path="/play" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}
