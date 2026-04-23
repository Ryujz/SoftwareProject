require("./src/config/db");
const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/socket");

const PORT = 5000;

const server = http.createServer(app);

// initialize socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});