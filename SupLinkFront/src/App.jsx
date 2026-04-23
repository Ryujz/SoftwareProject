// import NavBar from "./Components/NavBar"
// import Hero from "./Components/Hero"
// import Stats from "./Components/Stats"
// import ProcureHome from "./ProcureHome"
// export default function App() {
//   return (
//     <>
//       <ProcureHome />
//     </>
//     // <>
//     // <NavBar />
//     // <div className="flex items-center justify-center">
//     //   <Hero />
//     // </div>
//     // <div>
//     //   <Stats />
//     // </div>  
//     // </>
//   )
// }

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
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProcureHome/>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/posted-projects" element={<PostedProject />} />
          <Route path="/Chat" element={<ChatList />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/Profile" element={<SupplierProfilePage />} /> 
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}