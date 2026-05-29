import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Game from "./pages/Game.jsx";
import Lobby from "./pages/Lobby.jsx";
import Tournament from "./pages/Tournament.jsx";
import LeaderBoard from "./pages/LeaderBoard.jsx";
import User from "./pages/User.jsx";
import UserGames from "./pages/UserGames.jsx";
import CreateGame from "./pages/CreateGame.jsx";
import AboutUs from './pages/AboutUs';
import AboutGame from "./pages/AboutGame.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import NotFound from "./pages/404.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import Layout from "./components/Layout.jsx";
import BanModal from "./components/BanModal.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminComments from "./pages/admin/Comments.jsx";
import AdminTournamentCreate from "./pages/admin/TournamentCreate.jsx";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";

// Main application component with routing configuration
function AppContent() {
  const { bannedMessage } = useAuth();

  return (
    <>
      {bannedMessage && (
        <BanModal message={bannedMessage} />
      )}
      <BrowserRouter>
        <Routes>
          {/* All routes wrapped in Layout component for consistent header/footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/createGame" element={<CreateGame />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/leaderboard" element={<LeaderBoard />} />
            <Route path="/tournament" element={<Tournament />} />
            <Route path="/tournament/:id" element={<Tournament />} />
            <Route path="/user/:id" element={<User />} />
            <Route path="/user/:id/games" element={<UserGames />} />
            <Route path="/aboutUs" element={<AboutUs />} />
            <Route path="/aboutGame" element={<AboutGame />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="comments" element={<AdminComments />} />
              <Route path="tournaments/create" element={<AdminTournamentCreate />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
