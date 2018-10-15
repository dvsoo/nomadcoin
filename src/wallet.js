const elliptic = require("elliptic"),
  path = require("path"),
  fs = require("fs"),
  _ = require("lodash"),
  Transactions = require("./transaction");

const {
  getPublickKey,
  getTxId,
  signTxIn,
  TxIn,
  Transaction,
  TxOut
} = Transactions;

const ec = new elliptic.ec("secp256k1");

const privateKeyLocation = path.join(__dirname, "privateKey");

const generatePrivateKey = () => {
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
};

///지갑에서 프라이빗키를 가지고 온다 => 이 파일을 가지고 온다.
const getPrivateFromWallet = () => {
  const buffer = fs.readFileSync(privateKeyLocation, "utf8");
  return buffer.toString();
};

const getPublicFromWallet = () => {
  const privateKey = getPrivateFromWallet();
  const key = ec.keyFromPrivate(privateKey, "hex");
  return key.getPublic().encode("hex");
};

////address를 매칭하여 전체 아웃풋을 찾는다.
const getBalance = (address, uTxOuts) => {
  return _(uTxOuts)
    .filter(uTxO => uTxO.address === address)
    .map(uTxO => uTxO.amount)
    .sum();
  /////uTxOuts에서 address와 동일한 사용하지 않은 아웃풋의 주소를 uTxO로 담아
  //// 배열로 올려놓고, uTxO를 총량으로 넣는다. 그걸 다 합친다.
};

const initWallet = () => {
  ///만약 프라이빗키가 존재한다면, 아무것도 안하고
  ///존재하지 않는다면 만든다.
  if (fs.existsSync(privateKeyLocation)) {
    return;
  }
  const newPrivateKey = generatePrivateKey();

  fs.writeFileSync(privateKeyLocation, newPrivateKey);
};

const findAmountInUTxOuts = (amountNeeded, myUTxOuts) => {
  let currentAmount = 0;
  const includeUTxOuts = [];
  for (const myUTxOut of myUTxOuts) {
    includeUTxOuts.push(myUTxOut);
    ////현재 내가 가지고 있는 수량
    currentAmount = currentAmount + myUTxOut.amount;
    if (currentAmount >= amountNeeded) {
      const leftOverAmount = currentAmount - amountNeeded;
      return { includeUTxOuts, leftOverAmount };
    }
  }
  console.log("Not enough founds");
  return false;
};

///amount 내가 남에게 주는 양
const createTxOut = (receiverAddress, myAddress, amount, leftOverAmount) => {
  const receiverTxOut = new TxOut(receiverAddress, amount);
  if (leftOverAmount === 0) {
    return [receiverTxOut];
  } else {
    const leftOverTxOut = new TxOut(myAddress, leftOverAmount);
    return [receiverTxOut, leftOverAmount];
  }
};

const createTx = (receiverAddress, amount, privateKey, uTxOutList) => {
  ///내 주소 얻기
  const myAddress = getPublickKey(privateKey);
  ///내 소유의 UTXO 찾기
  const myUTxOuts = uTxOutList.filter(uTxO => uTxO.address === myAddress);

  const { includeUTxOuts, leftOverAmount } = findAmountInUTxOuts(
    amount,
    myUTxOuts
  );

  ///UTXO를 가져다가 인풋으로 넣기 이해안된다... ㅠ #55
  const toUnsignedTxIn = uTxOut => {
    const txIn = new txIn();
    txIn.txOutId = uTxOut.txOutId;
    txIn.txOutIndex = uTxOut.txOutIndex;
  };

  const unsignedTxIns = includeUTxOuts.map(toUnsignedTxIn);

  const tx = new Transaction();

  tx.txIns = unsignedTxIns;
  tx.txOuts = createTxOut(receiverAddress, myAddress, amount, leftOverAmount);
  ///transaction ID 얻기
  tx.id = getTxId(tx);

  tx.txIns = tx.txIns.map((txIn, index) => {
    txIn.signature = signTxIn(tx, index, privateKey, uTxOutList);
    return txIn;
  });
  return tx;
};

module.exports = {
  initWallet,
  getBalance,
  getPublicFromWallet
};
