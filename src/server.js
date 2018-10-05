const express = require("express"),
  bodyParser = require("body-parser"),
  morgan = require("morgan"),
  Blockchain = require("./blockchain"),
  P2P = require("./p2p");
////p2p서버를 import 시킨다.

////blockchain이라는 객체를 만들었는데, 여기에는 제이슨형태로 들어갈거야.
////처음에는 getBlockchain을 하고, 그 뒷부분은 새로운 블록을 설정할게. => getBlockchain에는 제네시스 블록까지 존재하기 떄문에 먼저 써주고, 나머지 블록을 동일한 내용이기 때문에 createNewBlock 함수를 사용한다.

const { getBlockchain, createNewBlock } = Blockchain;
const { startP2PServer, connectToPeers } = P2P;
//// P2P를 객체로 넣는다.

const PORT = process.env.HTTP_PORT || 3000;

const app = express();

////bodyParser을 뭐하는 건지?
app.use(bodyParser.json());

////combined: 필요한 정보를 로고에 찍어준다
app.use(morgan("combined"));

///block router 설정, get으로 통신
///router를 blocks로 설정하면 함수 getBlockchain으로 받을게
app.get("/blocks", (req, res) => {
  res.send(getBlockchain());
});

///mining block post
app.post("/blocks", (req, res) => {
  ///요청하는 것은 data
  const {
    body: { data }
  } = req;
  const newBlock = createNewBlock(data);
  res.send(newBlock);
});

////peers server
app.post("/peers", (req, res) => {
  const {
    body: { peer }
  } = req;
  connectToPeers(peer);
  ////connection을 닫음
  ///why? 보낼 것이 없으니까, 즉 웹소켓 서버가 돌고있는 URL을 보낼거야.
  res.send();
});

////server => p2p서버에게 express 서버를 줘야하기 때문에 변수로 만든뒤

////express server
const server = app.listen(PORT, () =>
  console.log(`Nomadcoin Server running on ${PORT}`)
);

///p2p server에 express server를 인자로 둔다.
startP2PServer(server);
