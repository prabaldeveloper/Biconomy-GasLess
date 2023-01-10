import { Biconomy } from "@biconomy/mexa";
import Web3 from "web3";
import sigUtil from 'eth-sig-util';
const rpc = "https://rpc-mumbai.maticvigil.com";
const provider = new Web3.providers.HttpProvider(rpc);
import * as dotenv from 'dotenv';
dotenv.config()
// let options = {
//     apiKey: "t7lWoKboX.d94cef89-86d0-452e-80ca-f5e5984eee90",
//     debug: true,
//     //contractAddresses: ["0x2395ae63aEF621513253B12AF7197d4c1DE864b1"],
// };
//const biconomy = new Biconomy(provider, options);

const biconomy = new Biconomy(provider, { apiKey: "t7lWoKboX.d94cef89-86d0-452e-80ca-f5e5984eee90", debug: true });
const web3 = new Web3(biconomy);

const historyAbi =  [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "userAddress", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }, 
{ "indexed": false, "internalType": "string", "name": "data", "type": "string" }], "name": "DataAdded", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "userAddress", "type": "address" }, { "internalType": "uint256", "name": "eventTokenId", "type": "uint256" }, 
{ "internalType": "string", "name": "data", "type": "string" }], "name": "addData", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "tokenIdToData", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, 
{ "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "userData", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }];

const historyAddress = "0x2395ae63aEF621513253B12AF7197d4c1DE864b1";

let historyContractInstance;

const signerAddress = process.env.userAddress1;
const privateKey = process.env.privateKey1;

const eventTokenId = "194";
const data = `Test data for tokenId 194`;
 // Initialize your dapp here like getting user accounts etc

 biconomy.onEvent(biconomy.READY, () => {
    historyContractInstance = new web3.eth.Contract(
        historyAbi,
        historyAddress
    );
    for(let i = 1; i< 10; i++) {
        addData(signerAddress,eventTokenId, data, i);
    }

 }).onEvent(biconomy.ERROR, (error, message) => {
    //Handle error while initializing mexa
    console.log(error);
 })


 async function addData(userAddress, eventTokenId, userData, i) {
    historyContractInstance = new web3.eth.Contract(
        historyAbi,
        historyAddress
    );
    //Find gas limit
    let limit = await historyContractInstance.methods.addData(userAddress,eventTokenId, userData).estimateGas({ from: userAddress});
    console.log("Limit", limit);

    //Call a function of the contract
    var rawdata = historyContractInstance.methods.addData(userAddress, eventTokenId, userData).encodeABI();

    //Generate Raw Transaction
    var rawTx = {
        from: userAddress,
        value: 0,
        to: historyAddress,
        gasLimit: limit,
        data: rawdata,
        batchId: i,
        batchNonce: await web3.eth.getTransactionCount(userAddress),
    }

    const signedTx = await web3.eth.accounts.signTransaction(rawTx, `0x${privateKey}`);
    const forwardData = await biconomy.getForwardRequestAndMessageToSign(signedTx.rawTransaction);
    const signature = sigUtil.signTypedMessage(new Buffer.from(privateKey, 'hex'),
    { data: forwardData.eip712Format }, 'V4');

    let rawTransaction = signedTx.rawTransaction;
    let data = {
        signature: signature,
        forwardRequest: forwardData.request,
        rawTransaction: rawTransaction,
        signatureType: biconomy.EIP712_SIGN
    };

    web3.eth.sendSignedTransaction(data)
        .on('transactionHash',(hash) => {
            console.log(`Transaction hash is ${hash}`);
            console.log(`Transaction sent via Biconomy. Waiting for confirmation.`);
        })
        .once('confirmation', (confirmation, receipt) => {
            console.log(`Transaction Confirmed.`);
            //console.log(receipt);
        })
 }