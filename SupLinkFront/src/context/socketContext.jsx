import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log("SocketProvider mounted, user:", user);
    if (!user) return;

    const token = localStorage.getItem("token");
    console.log("Token:", token);

    const newSocket = io("http://localhost:5000", { auth: { token } });

    newSocket.on("connect", () => {
      console.log("Socket connected! ID:", newSocket.id);
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connect_error:", err.message);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    return () => newSocket.disconnect();
  }, [user]); // ← useEffect closes here

  // ↓ this was missing!
  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
} // ← SocketProvider closes here

export const useSocket = () => useContext(SocketContext);