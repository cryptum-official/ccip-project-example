// AVALANCHE

require("dotenv").config()
const JSONdb = require('simple-json-db');
const logger = require("./logger")

// instance cryptum-sdk
const CryptumSDK = require('cryptum-sdk');

const db = new JSONdb('storage.json')
//
const ENVIROMENT = process.env.ENVIROMENT // testnet
const MNEMONIC = process.env.MNEMONIC; // 
const API_KEY = process.env.API_KEY; // 
const PROTOCOL = process.env.PROTOCOL_DESTINATION; // ETHEREUM
//

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sdk = new CryptumSDK({
    environment: ENVIROMENT, // 'testnet' or 'mainnet'
    apiKey: API_KEY,
})

// Generate wallet
const getWallet = async () => await sdk.wallet.generateWallet({
    protocol: PROTOCOL,
    mnemonic: MNEMONIC
})

const getContractAddressByHash = async (hash) => {
    const { contractAddress } = await sdk.transaction.getTransactionReceiptByHash({
        protocol: PROTOCOL,
        hash
    })
    return contractAddress
}

const createContractCCIP = async () => {

    const wallet = await getWallet()
    console.log(`wallet address ${wallet.address}`)
    const { hash } = await sdk.chainlink.createCCIP({
        protocol: PROTOCOL,
        wallet
    })

    console.log(`Waiting for contract address`)
    let contractAddress
    let attempts = 1;

    // loop para buscar o endereço de contrato, 
    // isso se faz necessário pois temos que esperar as confirmação do bloco, isso pode variar de acordo com a rede
    await delay(5000)

    while (!contractAddress) {
        try {
            console.log(`attempt: ${attempts}`)
            contractAddress = await getContractAddressByHash(hash)
        } catch (e) {
            attempts++
            await delay(5000)
        }
    }

    logger.info({ contractAddress, protocol: PROTOCOL })
    return contractAddress
}

const addFund = async (contractAddress, token, amount) => {
    if (!contractAddress || !token || !amount) throw Error("Arguments contractAddress, token and amount required!")

    const wallet = await getWallet()
    console.log(`wallet address ${wallet.address}`)

    const { hash } = await sdk.token.transfer({
        wallet,
        protocol: PROTOCOL,
        token,
        destination: contractAddress, // contractAddress
        amount: amount,
    })

    logger.info({ hash, call_method: function_name, token, amount, protocol: PROTOCOL })
    console.log({ hash })
    return hash
}

const allowSender = async (contractAddress, senderAddress, allowed) => {
    const wallet = await getWallet()

    const { hash } = await sdk.chainlink.allowSenderCCIP({
        protocol: PROTOCOL,
        wallet,
        address: contractAddress,
        senderAddress,
        allowed
    })

    logger.info({ hash, call_method: function_name, senderAddress, allowed, contractAddress })
    return hash
}

const getLastReceivedMessageDetailsCCIP = async (contractAddress) => {
    return await sdk.chainlink.getLastReceivedMessageDetailsCCIP({
        protocol: PROTOCOL,
        address: contractAddress
    })
}


const receiveMessage = async (contractAddress) => {
    if (!contractAddress) throw Error("contractAddress required!")

    while (true) {
        console.log(`Waiting new message...`)
        const message = await getLastReceivedMessageDetailsCCIP(contractAddress)
        if (message.messageId === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            await delay(30000)
            continue
        };

        const message_db = db.get(message.messageId)
        if (message_db) {
            await delay(30000)
            continue;
        }

        console.log(`New message received ${message.messageId}`)
        db.set(message.messageId, message)
    }
}

const arguments = process.argv.slice(2)
const [function_name] = arguments;

if (!function_name) throw Error("Argument required!")

const functions = {
    'create_ccip': createContractCCIP,
    'add_funds': () => addFund(arguments[1], arguments[2], arguments[3]),
    'allow_sender': () => allowSender(arguments[1], arguments[2], arguments[3] == "true"),
    'receive_message': () => receiveMessage(arguments[1])
}

const method = functions[function_name]
if (!method) throw Error("Function not found!")

logger.info({ call_method: function_name })
console.log(`function selected: ${function_name}`)

method()
    .then(console.log)
    .catch(console.log)