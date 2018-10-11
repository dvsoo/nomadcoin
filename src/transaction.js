const CryptoJS = require("crypto-js"),
  utils = require("./utils"),
  elliptic = require("elliptic");

///initialize
const ec = new elliptic.ec("secp256k1");

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
    uTxOut => uTxOut.txOutId === txOutId && uTxOut.txOutIndex === txOutIndex
  );
};

///Input 에 사인, 블록체인에게 유효하다고 검증해 주는 것.
const signTxIn = (tx, txInIndex, privateKey, uTxOut) => {
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
        new UTxOut(tx.id, index, txOut.address, txOut.amount);
      });
    })
    .reduce((a, b) => a.contact(b), []);

  const spentTxOuts = newTxs
    .map(tx => tx.txIns)
    .reduce((a, b) => a.contact(b), [])
    .map(txIn => new UTxOut(txIn.txOutId, txIn.txOutIndex, "", 0));

  const resultingUTxOuts = uTxOutList
    .filter(uTxO => !findUTxOut(uTxO.txOutId, uTxO.txOutIndex, spentTxOuts))
    .concat(newUTxOuts);

  return resultingUTxOuts;
};
