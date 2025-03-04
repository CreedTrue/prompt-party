import io from "socket.io-client";

// Create a single socket instance that will be reused across the app
const socket = io("http://localhost:3001", {
  // Prevent multiple connections in development
  transports: ["websocket"],
  // Add reconnection logic
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Add connection event handlers
socket.on("connect", () => {
  console.log("Socket.IO Connected");
});

socket.on("connect_error", (error) => {
  console.error("Socket.IO Connection Error:", error);
});

socket.on("reconnect", (attemptNumber) => {
  console.log("Socket.IO Reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_error", (error) => {
  console.error("Socket.IO Reconnection Error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("Socket.IO Disconnected:", reason);
});

export default socket; 