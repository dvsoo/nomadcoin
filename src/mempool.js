//// 내가 돈을 보낼 때, 트랜잭션은 memPool에 남아있는다.
//// 언제까지? 블록에서 트랜잭션을 선택해 갈때까지
//// 현재, 자동으로 블록에 올리는 작업을 하지만, 비트코인이나 이더리움 같은 경우에는
//// 기다리고 있는 트랜잭션은 수수료를 지불해야한다. 이 수수료를 채굴자가 보상으로 가져간다.

const _ = require("lodash"),
  Transactions = require("./transactions");

////검증안된 validateTx는 포함시키지 않을 것이기 때문에
const { validateTx } = Transactions;

let mempool = [];

const getMempool = () => _.cloneDeep(mempool);

//mem pool을 위해 트랜잭션이 유효한지 검증하기
//트랜잭션에서 이미 mempool에서 사용된 인풋이 있는지 체크하기 [50UTXO가 있어. 이걸 A에게 보냈어. 근데 이걸 또 B에게 보낼 수 없다 why? 더블스팬딩이니까 그렇다면 지갑에서는 어떻게??]

///전체 input을 가지고 와야한다.
const getTxInsInPool = mempool => {
  return _(mempool)
    .map(tx => tx.txIns)
    .flatten()
    .value();
};

const isTxValidForPool = (tx, mempool) => {
  const txInsInPool = getTxInsInPool(mempool);

  ///인풋이 사용되었는 지 체크
  const isTxInAlreadyInPool = (txIns, txIn) => {
    return _.find(txIns, txInsInPool => {
      return (
        txIn.txOutIndex === txInsInPool.txOutIndex &&
        txIn.txOutId === txInsInPool.txOutId
      );
    });
  };

  //mempool 안에 내가 전체 가지고 온 input에서 같은 인풋이 있는 지 전체 확인
  for (const txIn of tx.txIns) {
    if (isTxInAlreadyInPool(txInsInPool, txIn)) {
      return false;
    }
  }
  return true;
};

const hasTxIn = (txIn, uTxOutList) => {
  //동일한 ID를 갖는 아웃풋 그리고 인덱스를 찾는 함수.
  const foundTxIn = uTxOutList.find(
    uTxO => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex
  );

  return foundTxIn !== undefined;
};

const updateMempool = uTxOutList => {
  //UTXO에서 인풋을 찾을 수 없을 트랜잭션은 무효하다.
  const invalidTxs = [];

  for (const tx of mempool) {
    for (const txIn of tx.txIns) {
      if (!hasTxIn(txIn, uTxOutList)) {
        invalidTxs.push(tx);
        break;
      }
    }
  }

  if (invalidTxs.length > 0) {
    mempool = _.without(mempool, ...invalidTxs);
  }
};

const addToMemPool = (tx, uTxOutList) => {
  if (!validateTx(tx, uTxOutList)) {
    //error를 던지는 이유는, 익스프레스 서버에 요청을 보내면 value를 리턴
    throw Error("This tx is invalid. Will not add it to pool");
  } else if (!isTxValidForPool(tx, mempool)) {
    throw Error("This tx is not valid for the pool. Will not add it");
  }
  mempool.push(tx);
};

module.exports = {
  addToMemPool,
  getMempool,
  updateMempool
};
