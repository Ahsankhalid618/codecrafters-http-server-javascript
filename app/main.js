const net = require("net");
const fs = require("fs");

console.log("Logs from your program will appear here!");
const flags = process.argv.slice(2);
const directory = flags.find((_, index) => flags[index - 1] == "--directory");

const handleConnection = (socket) => {
  socket.on("data", (data) => {
    const [request, host, agent] = data.toString().split("\r\n");
    const [method, path, version] = request.split(" ");
    if (method === "GET") {
      if (path === "/") {
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        return;
      } else if (path.startsWith("/echo/")) {
        const pathParameter = path.replace("/echo/", "");
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${pathParameter.length}\r\n\r\n${pathParameter}`
        );
      } else if (path.startsWith("/user-agent")) {
        const userAgent = agent.replace("User-Agent: ", "");
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
        );
      } else if (path.startsWith("/files/")) {
        const filePath = path.slice(7);
        if (!fs.existsSync(directory + filePath)) {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
          socket.end();
          return;
        }
        const file = fs.readFileSync(directory + filePath);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length}\r\n\r\n${file}`
        );
      }

      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.end();
    }
  });

  socket.on("end", () => {
    console.log("Client disconnected");
  });
};
const server = net.createServer((socket) => {
  handleConnection(socket);
});
server.listen(4221, "localhost");

process.on("SIGINT", () => {
  console.log("Server shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
