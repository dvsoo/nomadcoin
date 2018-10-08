const CryptoJS = require("crypto-js");

class Block {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

const genesisBlock = new Block(
  0,
  "2C4CEB90344F20CC4C77D626247AED3ED530C1AEE3E6E85AD494498B17414CAC",
  null,
  1520312194926,
  "This is the genesis!!"
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length - 1];
////{}가 없는 ES6 문법은 모든 것들이 디폴트로 리턴이 된다.

const getTimestamp = () => new Date().getTime() / 1000;
//// 타임스탬프가 왜 이런 방식으로?
//// getTime 메서드는 시간표현에 항상 UTC를 사용하기 때문에
//// 비트코인 Timestamp도 Unix time을 사용하는데 Unix time이란 1970년 1월 1일 0시 0분 0초 로부터 몇 초나 지난 것인지를 표현한다.
//// 여기서 / 1000을 해주는 이유는?? seconds값이 나온다.

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + JSON.stringify(data)
  ).toString();
///이런 crypto를 만들고 나면 인풋을 줘야한다. https://passwordsgenerator.net/sha256-hash-generator/
/// data에 string이 아닌 다른 값이 들어갈 수도 있으므로 JSON.stringify를 통해서 string으로 만들어준다.

//// hash값 만들기
const createNewBlock = data => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const newHash = createHash(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data
  );
  const newBlock = new Block(
    newBlockIndex,
    newHash,
    previousBlock.hash,
    newTimestamp,
    data
  );
  addBlockToChain(newBlock);
  return newBlock;
};

const getBLockHash = block =>
  createHash(block.index, block.previousHash, block.timestamp, block.data);

////Block Contents 검증 과정
const isBlockValid = (candidateBlock, latestBlock) => {
  if (!isBlockStructureValid(candidateBlock)) {
    console.log("The candidate block structure is not valid");
    return false;
  } else if (latestBlock.index + 1 !== candidateBlock.index) {
    console.log("The candidate block does not have a valid index");
    return false;
  } else if (latestBlock.hash !== candidateBlock.previousHash) {
    console.log(
      "The previousHash of the candidate block is not the hash of the latest block"
    );
    return false;
  } else if (getBLockHash(candidateBlock) !== candidateBlock.hash) {
    ///hash를 계산하여 이 블록의 해쉬가 내가 계산한 해쉬와 동일하다면 유효
    console.log("The hash of this block is invalid");
    return false;
  }
  return true;
};

////Block Structure 검증 과정
const isBlockStructureValid = block => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "string"
  );
};

////체인을 검증해야하는 이유
/// 체인을 클론할 수 있기 때문에 전세계에서 체인을 사용할 수 있다
/// 그렇기 때문에 우리의 체인에게 어떤 체인이 유효하고 어떤 블록체인이 긴 지 검증할 수 있도록 만들어야 한다.[체인이 바뀌기도 하기 때문]

const isChainValid = candidateChain => {
  ////1. 두 개의 블록체인은 같은 하나의 제니시스 출신이어야 한다.
  const isGenesisValid = block => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
    ///다른 곳에서 온 체인이 내가 가지고 있는 제니시스 블록과 같아야 한다.
  };
  if (!isGenesisValid(candidateChain[0])) {
    console.log(
      "The candidateChains's GenesisBlock is not the same as our GenesisBlock"
    );
    return false;
  }

  ////1인 이유는 제네시스 블록을 검증하기 싫어서. why? 제네시스는 이전해시값이 없기 때문에
  for (let i = 1; i < candidateChain.length; i++) {
    if (!isBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
    return true;
  }
  ////2.
};

const replaceChain = candidateChain => {
  if (
    isChainValid(candidateChain) &&
    candidateChain.length > getBlockchain().length
  ) {
    ////체인이 유효하고, 새로운 체인이 우리 체인보다 길다면, true, 대체한다.
    blockchain = candidateChain;
    return true;
  } else {
    return false;
  }
};

const addBlockToChain = candidateBlock => {
  ///최근블록은 우리 함수의 마지막 블록을 뜻한다.
  if (isBlockValid(candidateBlock, getNewestBlock())) {
    blockchain.push(candidateBlock);
    return true;
  } else {
    return false;
  }
};

module.exports = {
  getBlockchain,
  createNewBlock,
  getNewestBlock,
  isBlockStructureValid,
  replaceChain,
  addBlockToChain
};
