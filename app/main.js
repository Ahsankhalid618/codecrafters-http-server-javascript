const net = require("net");


console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
//   socket.write("HTTP/1.1 200 OK\r\n\r\n");
  socket.on("data", (data) => {
    const request = data.toString();

    if (request.startsWith("GET / ")) {
      console.log(socket.write("HTTP/1.1 200 OK\r\n\r\n"));
    } else {
      console.log(socket.write("HTTP/1.1 404 Not Found\r\n\r\n"));
    }
    socket.end();
  });
});

server.listen(4221, "localhost");
