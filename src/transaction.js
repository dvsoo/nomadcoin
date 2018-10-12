const CryptoJS = require("crypto-js"),
  utils = require("./utils"),
  elliptic = require("elliptic");

///initialize
const ec = new elliptic.ec("secp256k1");

const COINBASE_AMOUNT = 50;

class TxOut {
  constructor(address, amount) {
    this.address = address;
    this.amount = amount;
  }
}

////constructor 없다 why 우리가 변경할 것이기 때문에
class TxIn {
  ///앞으로 생길 것들
  ///인풋은 결국 이전 트랜잭션에서 사용되지 않은 아웃풋
  ///uTxOutId
  ///uTxOutIndex
  ///Signature
}

class Transaction {
  ///ID
  ///txIns[]
  ///txOuts[]
}

////UTXO
class UnxOut {
  constructor(txOutId, txOutIndex, address, amount) {
    this.txOutId = txOutId;
    this.txOutIndex = txOutIndex;
    this.address = address;
    this.amount = amount;
  }
}

let uTxOuts = [];

////transaction ID 얻는 방법: transaction input and output 함께 hash

const getTxId = tx => {
  ///전체 트랜잭션 인풋을 합친 것.
  ///map: array로 만든다.
  //txIn은 txOutId 와 txOutIndex가 들어가 있다.
  const txInContent = tx.txIns
    .map(txIn => txIn.uTxOutId + txIn.txOutIndex)
    .reduce((a, b) => a + b, "");

  ///트랜잭션 아웃풋 작업
  const txOutContent = tx.txOuts
    .map(txOut => txOut.address + txOut.amount)
    .reduce((a, b) => a + b, "");
  return CryptoJS.SHA256(txInContent + txOutContent).toString();
};

////
const findUTxOut = (txOutId, txOutIndex, uTxOutList) => {
  return uTxOutList.find(
    uTxO => uTxO.txOutId === txOutId && uTxO.txOutIndex === txOutIndex
  );
};

///Input 에 사인, 블록체인에게 유효하다고 검증해 주는 것.
const signTxIn = (tx, txInIndex, privateKey, uTxO) => {
  ///우리가 원하는 input을 찾아야 된다.
  const txIn = tx.txIns[txInIndex];
  const dataToSign = tx.id;
  //// 돈이 있는 지 체크한다.  To do: Find Tx 사용되지 않은 아웃풋
  const referencedUTxOut = findUTxOut(txIn.txOutId, tx.txOutIndex, uTxOuts);
  if (referencedUTxOut === null) {
    return;
  }

  const key = ec.keyFromPrivate(privateKey, "hex");
  const signature = utils.toHexString(key.sign(dataToSign).toDER());
  return signature;
};

const updateUxOuts = (newTxs, uTxOutList) => {
  ///트랜잭션응ㄴ 가끔 new transaction을 만든다.
  const newUTxOuts = newTxs
    .map(tx => {
      tx.txOuts.map((txOut, index) => {
        new UTxO(tx.id, index, txOut.address, txOut.amount);
      });
    })
    .reduce((a, b) => a.contact(b), []);

  const spentTxOuts = newTxs
    .map(tx => tx.txIns)
    .reduce((a, b) => a.contact(b), [])
    .map(txIn => new UTxO(txIn.txOutId, txIn.txOutIndex, "", 0));

  const resultingUTxOuts = uTxOutList
    .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    .concat(newUTxOuts);

  return resultingUTxOuts;
};

////트랜젝션 구조가 유효한지 체크
//1. 트랜젝션의 아이디가 한글이 맞는 지 확인한다.
//2. 트랜젝션 인풋이 array가 맞는 지 확인한다.
//3. 트랜잭션 인풋 검증

////transaction structure valid
const isTxInStructureValid = txIn => {
  // to do
  if (txIn === null) {
    return false;
  } else if (typeof txIn.signature !== "string") {
    return false;
  } else if (typeof txIn.txOutId !== "string") {
    return false;
  } else if (typeof txIn.txOutIndex !== "number") {
    return false;
  } else {
    return true;
  }
};

///주소체크
///길이가 300이 아니고, 주소가 hexadecimal pattern에 매칭되지 않으면,
///주소가ㅓ 04로 시작하지 않으몀 다 거짓
const isAddressValid = address => {
  if (address.legnth !== 130) {
    return false;
  } else if (address.match("^[a-fA-F0-9]+$") === null) {
    return false;
  } else if (!address.startsWith("04")) {
    return false;
  } else {
    return true;
  }
};

const isTxOutStructureValid = txOut => {
  if (txOut === null) {
    return false;
  } else if (typeof txOut.address !== "string") {
    return false;
  } else if (!isAddressValid(txOut.address)) {
    return false;
  } else if (typeof txOut.amount !== "number") {
    return false;
  } else {
    return true;
  }
};

const isTxStructureValid = tx => {
  if (typeof tx.id !== "string") {
    console.log("Tx ID is not valid");
    return false;
  } else if (!(tx.txIns instanceof Array)) {
    console.log("The txIns are not an array");
    return false;
  } else if (
    !tx.txIns.map(isTxInStructureValid).reduce((a, b) => a && b, true)
  ) {
    console.log("The structure of one of the txIn is not valid");
    return false;
  } else if (!(tx.txOuts instanceof Array)) {
    return false;
  } else if (
    !tx.txOut.map(isTxOutStructureValid).reduce((a, b) => a && b, true)
  ) {
    console.log("The structure of one of the txOut is not valid");
    return false;
  } else {
    return true;
  }
};

////transcation 의 데이터
///mother function

const validateTxIn = (txIN, tx, uTxOutList) => {
  const wantedTxOut = uTxOutList.find(
    uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
  );
  if (wantedTxOut === null) {
    return false;
  } else {
    const address = wantedTxOut.address;
    const key = ec.keyFromPublic(address, "hex");
    return key.verify(tx.id, txIn.signature);
  }
};

const getAmountInTxIn = (txIn, uTxOutList) =>
  findUTxOut(txIn.txOutId, txIn.txOutIndex, uTxOutList).amount;

const validateTx = (tx, uTxOutList) => {
  if (!isTxStructureValid(tx)) {
    return false;
  }
  if (getTxId(tx) !== tx.id) {
    return false;
  }

  const hasValidTxIns = tx.txIns.map(txIn => validateTxIn(txIn, tx, uTxOuts));

  if (!hasValidTxIns) {
    return false;
  }

  const amountInTxIns = tx.txIns
    .map(txIn => getAmountInTxIn(txIn, uTxOutList))
    .reduce((a, b) => a + b, 0);

  const amountInTxOuts = tx.txOuts
    .map(txOut => txOut.amount)
    .reduce((a, b) => a + b, 0);

  if (amountInTxIns !== amountInTxOuts) {
    return false;
  } else {
    return true;
  }
};

///coinbase output 50 input x transaction

///레퍼런스할 이전 아웃풋이 없기때문에 인풋은 블록 인덱스를 레퍼런스한다
// 1. 내가 얻은 transaction id 와 가지고 있는 transaction id가 다르다면,
// 2. tx input이 1개가 아니라면 (1개: 제네시스블록 why? 채굴된거니까 input 없음)
// 3. tx input의 인덱스와 블록인덱스가 다르다면,
// 4. tx.out의 길이가 1이 아니라면 (채굴자만 득한다.)
const validateCoinbaseTx = (tx, blockIndex) => {
  if (getTxId(tx) !== tx.id) {
    return false;
  } else if (tx.txIns.legnth !== 1) {
    return false;
  } else if (tx.txIns[0].txOutIndex !== blockIndex) {
    return false;
  } else if (tx.txOuts.legnth !== 1) {
    return false;
  } else if (tx.txOuts[0].amount !== COINBASE_AMOUNT) {
    return false;
  } else {
    return true;
  }
};
