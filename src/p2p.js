const WebSockets = require("ws"),
  Blockchain = require("./blockchain");
///socket 서버 사이의 커넥션 모두 다 서버니까 서버 간의 대화
// peer array => socket

const {} = Blockchain;

const sockets = [];

const getSockets = () => sockets;

///Express HTTP server (argument 에 들어갈 내용)
///WebSocket(p2p)는 같은 포트에 있을 수 있다 왜? 다른 프로토콜이니까
/// HTTP, HTTPS and Web socket, web socket secure

const startP2PServer = server => {
  ////웹소켓서버 만들기
  const wsServer = new WebSockets.Server({ server });
  ///누군가 나의 서버에 접속한다면, 내 서버에 접속된 웹소켓을
  wsServer.on("connection", ws => {
    ////여기서 p2p서버에게 무엇을 해야하는 지 알려주기
    initSocketConnection(ws);
  });
  console.log("Nomadcoin P2P Server running");
};

const initSocketConnection = socket => {
  sockets.push(socket);
  handleSocketError(socket);
  ///특정메세지를 보내면 반응하도록
  socket.on("message", data => {
    console.log(data);
  });
  setTimeout(() => socket.send("welcome"), 5000);
};

const handleSocketError = ws => {
  ///죽은 socket를 socket array에서 제거하는 함수
  const closeSocketConnection = ws => {
    ws.close();
    sockets.splice(socket.indexOf(ws), 1);
  };
  ws.on("close", () => closeSocketConnection(ws));
  ws.on("error", () => closeSocketConnection(ws));
};

////newPeer: URL 소켓연결을
const connectToPeers = newPeer => {
  const ws = new WebSockets(newPeer);
  ////web socket connection을 열면, initSocket 함수를 부른다.
  ws.on("open", () => {
    initSocketConnection(ws);
  });
};

module.exports = {
  startP2PServer,
  connectToPeers
};
