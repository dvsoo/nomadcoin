class Block {
    constructor(index, hash, previousHash, timestamp, data){
        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
    }
}

const genesisBlock  = new Block(
    0,
    '2C4CEB90344F20CC4C77D626247AED3ED530C1AEE3E6E85AD494498B17414CAC',
    null,
    1520312194926,
    "This is the genesis!!"
);

let blockchain = [genesisBlock];

const getLasBlock = () => blockchain[blockchain.length - 1];
////{}가 없는 ES6 문법은 모든 것들이 디폴트로 리턴이 된다.

const getTimestamp = () => new Date.getTime() / 1000;
//// 타임스탬프가 왜 이런 방식으로?
//// getTime 메서드는 시간표현에 항상 UTC를 사용하기 때문에
//// 비트코인 Timestamp도 Unix time을 사용하는데 Unix time이란 1970년 1월 1일 0시 0분 0초 로부터 몇 초나 지난 것인지를 표현한다.
//// 여기서 / 1000을 해주는 이유는?? seconds값이 나온다.


const createNewBlock = data => {
    const previousBlock = getLasBlock();
    const newBlockIndex = previousBlock.index + 1;
    const newTimestamp = getTimestamp();
}