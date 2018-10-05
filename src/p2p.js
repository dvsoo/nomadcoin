const WebSockets = require("ws");
///socket 서버 사이의 커넥션 모두 다 서버니까 서버 간의 대화
// peer array => socket

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
    console.log(`Hello Socket`);
  });
  console.log("Nomadcoin P2P Server running");
};

const initSocketConnection = socket => {
  sockets.push(socket);
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
