const WebSockets = require("ws"),
  Blockchain = require("./blockchain");
///socket 서버 사이의 커넥션 모두 다 서버니까 서버 간의 대화
// peer array => socket

const { getNewestBlock, isBlockStructureValid, replaceChain } = Blockchain;
//// 1. 가장 최근 블록을 요청하고
//// 2. 모든 블록체인을 요청.(뒤쳐지면 블록체인을 교체하는 상황이 있을 수도 있기 때문에)
//// 3. 블록 가지고 오기.

const sockets = [];

///Message Type
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

////Message Creators
const getLatest = () => {
  return {
    type: GET_LATEST,
    data: null
  };
};

const getAll = () => {
  return {
    type: "GET_ALL",
    data: null
  };
};

const blockchainResponse = data => {
  return {
    type: BLOCKCHAIN_RESPONSE,
    data: data
  };
};

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

const initSocketConnection = ws => {
  sockets.push(ws);
  handleSocketMessages(ws);
  handleSocketError(ws);
  sendMessage(ws, getLatest());
  ///특정메세지를 보내면 반응하도록
  // ws.on("message", data => {
  //   console.log(data);
  // });
  // setTimeout(() => socket.send("welcome"), 5000);
};

const parseData = data => {
  ////try-catch error
  try {
    return JSON.parse(data);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const handleSocketMessages = ws => {
  ////메세지를 얻었을 때, 어떻게 할 지 알려주는 함수
  ws.on("message", data => {
    const message = parseData(data);
    if (message === null) {
      return;
    }
    console.log(message);
    switch (message.type) {
      case GET_LATEST:
        sendMessage(ws, responseLatest());
        break;
      case GET_ALL:
        sendMessage(ws, responseAll());
        break;
      case BLOCKCHAIN_RESPONSE:
        const recivedBlocks = message.data;
        if (recivedBlocks === null) {
          break;
        }
        handleBlockchainResponse(recivedBlocks);
        break;
    }
  });
};

const handleBlockchainResponse = recivedBlocks => {
  if (recivedBlocks.length === 0) {
    console.log("Recevied block have a length of 0");
    return;
  }
  const latesBlockRecevied = recivedBlocks[recivedBlocks.length - 1];
  if (!isBlockStructureValid(latesBlockRecevied)) {
    console.log("The Block Structure of the block received is not valid");
  }
  ///현재가지고 있는 블록
  const newestBlock = getNewestBlock();
  ///현재, 서버에 있는 블록체인의 index가 우리가 가지고 있는 블록체인의 index 보다 크다면,
  if (latesBlockRecevied.index > newestBlock.index) {
    ////check 10번 블록의 이전 해쉬가 9번 블록의 해쉬인지
    ///이 경우에는, 블록이 딱 1개 전에 있다는 뜻이므로, 블록을 하나만 추가해주면 된다.
    if (newestBlock.hash === latesBlockRecevied.previousHash) {
      addBlockToChain(latesBlockRecevied);
    } else if (recivedBlocks.length === 1) {
      ///to do, get all the blocks, We are waay behind => all blockchain 을 가지고 오는 것
      /// 모든 사람들한테 블록체인을 달라고 메세지를 보내야한다.
      sendMessageToAll(getAll());
    } else {
      replaceChain(recivedBlocks);
    }
  }
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const sendMessageToAll = message =>
  scokets.forEach(ws => sendMessage(ws, message));

const responseLatest = () => blockchainResponse(getNewestBlock());

const responseAll = () => blockchainResponse(getBlockchain());

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
