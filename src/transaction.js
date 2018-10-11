const CryptoJS = require("crypto-js");

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
  constructor(uTxOutId, uTxOutIndex, address, amount) {
    this.uTxOutId = uTxOutId;
    this.uTxOutIndex = uTxOutIndex;
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
