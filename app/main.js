const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const lines = request.split("\r\n");
    const requestLine = lines[0]; // e.g., GET /echo/abc HTTP/1.1

    if (requestLine.startsWith("GET /echo/")) {
      // Extract the string from the URL
      const content = requestLine.split("GET /echo/")[1].split(" ")[0];
      const contentLength = Buffer.byteLength(content, 'utf8');

      // Construct the HTTP response
      const response = 
        `HTTP/1.1 200 OK\r\n` +
        `Content-Type: text/plain\r\n` +
        `Content-Length: ${contentLength}\r\n` +
        `\r\n` +  // End of headers
        `${content}`;  // Response body

      socket.write(response);
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

server.listen(4221, "localhost", () => {
  console.log("Server listening on port 4221");
});
