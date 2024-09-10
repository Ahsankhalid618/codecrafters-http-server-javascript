const net = require("net");
const fs = require("fs");

console.log("Logs from your program will appear here!");
const flags = process.argv.slice(2);
const directory = flags.find((_, index) => flags[index - 1] == "--directory");

const handleConnection = (socket) => {
  socket.on("data", (data) => {
    const [requestLine, ...headers] = data.toString().split("\r\n");
    const [method, path, version] = requestLine.split(" ");

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
        const userAgent = headers.find((h) => h.startsWith("User-Agent: "));
        const userAgentValue = userAgent.split(":")[1].trim();
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgentValue.length}\r\n\r\n${userAgentValue}`
        );
      } else if (path.startsWith("/files/") && method === "POST") {
        const filePath = path.slice(7);
        const contentLengthHeader = headers.find((h) =>
          h.startsWith("Content-Length:")
        );
        const contentLength = parseInt(
          contentLengthHeader.split(":")[1].trim()
        );

        let body = "";
        socket.on("data", (chunk) => {
          body += chunk.toString();
          if (body.length >= contentLength) {
            fs.writeFileSync(
              directory + "/" + filePath,
              body.slice(0, contentLength)
            );
            socket.write("HTTP/1.1 201 Created\r\n\r\n");
            socket.end();
          }
        });
        return;
      }

      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.end();
    } else if (method === "POST") {
      if (path.startsWith("/files/")) {
        const filePath = path.slice(7);
        const contentLengthHeader = headers.find((h) =>
          h.startsWith("Content-Length:")
        );
        const contentLength = parseInt(
          contentLengthHeader.split(":")[1].trim()
        );

        let body = "";
        socket.on("data", (chunk) => {
          body += chunk.toString();
          if (body.length >= contentLength) {
            fs.writeFileSync(
              directory + "/" + filePath,
              body.slice(0, contentLength)
            );
            socket.write("HTTP/1.1 201 Created\r\n\r\n");
            socket.end();
          }
        });
        return;
      }
    }

    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.end();
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
