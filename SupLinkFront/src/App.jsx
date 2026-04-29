import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProcureHome from "./ProcureHome";
import Marketplace from "./pages/Marketplace";
import PostedProject from "./pages/Posted_Project";
import Chat from "./pages/Chat";
import ChatList from "./pages/ChatList";
import ProfilePage from "./pages/Profile";
import SupplierProfilePage from "./pages/ProfileSupplier";
import VendorProfilePage from "./pages/Profile";
import ProjectList from "./pages/ProjectList";
import PostedPortfolio from "./pages/PostedPortfolio";
import SupplyChainManagement from "./pages/SupplyChainManagement";
import MyTasks from "./pages/MyTasks";
import GroupChat from "./pages/GroupChat";
import { SocketProvider } from "./context/socketContext";
export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<ProcureHome/>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/browse-projects" element={<ProjectList />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/group-chat/:id" element={<GroupChat />} />
                <Route path="/Chat" element={<ChatList />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/posted-projects" element={<PostedProject />} />
                <Route path="/posted-portfolio" element={<PostedPortfolio />} />
                <Route path="/SupplierProfile" element={<SupplierProfilePage />} />
                <Route path="/VendorProfile" element={<VendorProfilePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Supply Chain Routes */}
                <Route path="/supply-chain/:projectId" element={<SupplyChainManagement />} />
                <Route path="/my-tasks" element={<MyTasks />} />
              </Route>
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    
  );
}