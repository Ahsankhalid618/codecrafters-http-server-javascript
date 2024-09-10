const net = require("net");
const fs = require("fs");

console.log("Logs from your program will appear here!");
const flags = process.argv.slice(2);
const directory = flags.find((_, index) => flags[index - 1] == "--directory");

const parseRequest = (requestData) => {
  const [requestLine, ...headers] = requestData.toString().split("\r\n");
  const [method, path, version] = requestLine.split(" ");
  return { method, path, version, headers };
};

const handleConnection = (socket) => {
  socket.on("data", (data) => {
    const { method, path, version, headers } = parseRequest(data);

    if (method === "GET") {
      if (path === "/") {
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
      } else if (path.startsWith("/echo/")) {
        const pathParameter = path.replace("/echo/", "");
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${pathParameter.length}\r\n\r\n${pathParameter}`
        );
      } else if (path.startsWith("/user-agent")) {
        const userAgent = headers.find((h) => h.startsWith("User-Agent: ")).split(": ")[1];
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
        );
      } else if (path.startsWith("/files/")) {
        const filePath = `${directory}/${path.slice(7)}`;
        
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n`
          );
          socket.write(content);
        } else {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      } else {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      }
    } else if (method === "POST" && path.startsWith("/files/")) {
      const filePath = `${directory}/${path.slice(7)}`;
      const contentLength = parseInt(headers.find(h => h.startsWith("Content-Length:")).split(":")[1].trim());

      let body = "";
      socket.on("data", (chunk) => {
        body += chunk.toString();
        if (body.length >= contentLength) {
          fs.writeFileSync(filePath, body.slice(0, contentLength));
          socket.write("HTTP/1.1 201 Created\r\n\r\n");
          socket.end();
        }
      });
      return;
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    
    socket.end();
  });
};

const server = net.createServer(handleConnection);
server.listen(4221, "localhost");

process.on("SIGINT", () => {
  console.log("Server shutting down...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
