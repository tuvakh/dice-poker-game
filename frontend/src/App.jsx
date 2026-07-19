import { lazy, Suspense } from "react";

import Layout from "./components/Layout.jsx";
import BanModal from "./components/BanModal.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Spinner from "./components/Spinner.jsx";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";

const Register = lazy(() => import("./pages/Register.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Game = lazy(() => import("./pages/Game.jsx"));
const Lobby = lazy(() => import("./pages/Lobby.jsx"));
const Tournament = lazy(() => import("./pages/Tournament.jsx"));
const TournamentPage = lazy(() => import("./pages/TournamentPage.jsx"));
const User = lazy(() => import("./pages/User.jsx"));
const CreateGame = lazy(() => import("./pages/CreateGame.jsx"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const AboutGame = lazy(() => import("./pages/AboutGame.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const NotFound = lazy(() => import("./pages/Error404.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.jsx"));
const AdminComments = lazy(() => import("./pages/admin/Comments.jsx"));
const AdminTournamentCreate = lazy(() => import("./pages/admin/TournamentCreate.jsx"));
const AdminTournamentEdit = lazy(() => import("./pages/admin/TournamentEdit.jsx"));

// Main application component with routing configuration
function AppContent() {
  const { bannedMessage } = useAuth();

  return (
    <>
      {bannedMessage && (
        <BanModal message={bannedMessage} />
      )}
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* All routes wrapped in Layout component for consistent header/footer */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/game/:id" element={<Game />} />
              <Route path="/createGame" element={<CreateGame />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/tournament" element={<Tournament />} />
              <Route path="/tournament/:id" element={<TournamentPage />} />
              <Route path="/user/:id" element={<User />} />
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
                <Route path="tournaments/:id/edit" element={<AdminTournamentEdit />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
