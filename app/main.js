const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();

    if (request.startsWith("GET / ")) {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (request.startsWith("GET /echo/")) {
      const content = request.split("GET /echo/")[1];
      const contentLength = Buffer.byteLength(content, "utf8"); // Accurate byte length of content
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${contentLength}\r\n\r\n${content}`
      );
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
  });

  socket.on("error", (e) => {
    console.error("ERROR: " + e);
    socket.end();
  });

  socket.on("close", () => {
    console.log("Socket closed");
  });
});


server.on("close", () => {
  console.log("Server closed");
});

server.listen(4221, "localhost", () => {
  console.log("Server listening on port 4221");
});
