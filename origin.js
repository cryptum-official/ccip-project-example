require("dotenv").config()
const logger = require("./logger")

// instance cryptum-sdk
const CryptumSDK = require('cryptum-sdk');

//
const ENVIROMENT = process.env.ENVIROMENT // testnet
const MNEMONIC = process.env.MNEMONIC; // 
const API_KEY = process.env.API_KEY; // 
const PROTOCOL = process.env.PROTOCOL_ORIGIN; // ETHEREUM
//

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sdk = new CryptumSDK({
    environment: ENVIROMENT, // 'testnet' or 'mainnet'
    apiKey: API_KEY,
})

// Generte wallet
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

const addFound = async (contractAddress, token, amount) => {
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

const sendMessage = async (senderContractAddress, receiveContractAddress, data, payLink) => {
    if (!senderContractAddress || !receiveContractAddress || !data || !payLink) throw Error("Arguments senderContractAddress, receiveContractAddress, data, payLink required!")
    const wallet = await getWallet()
    const { hash } = await sdk.chainlink.sendMessageCCIP({
        wallet,
        protocol: PROTOCOL,
        destinationProtocol: process.env.PROTOCOL_DESTINATION,
        payLink,
        text: data,
        contractAddress: senderContractAddress,
        to: receiveContractAddress
    })

    logger.info({ hash, call_method: function_name, senderContractAddress, receiveContractAddress, data, payLink, protocol: PROTOCOL, destinationProtocol: process.env.PROTOCOL_DESTINATION })
    console.log(`Message sended, follow the status via the link: https://ccip.chain.link/`)
    console.log(`Provide the hash: ${hash}`)
    return hash
}

const arguments = process.argv.slice(2)
const [function_name] = arguments;

if (!function_name) throw Error("Argument required!")

const functions = {
    'create_ccip': createContractCCIP,
    'add_founds': () => addFound(arguments[1], arguments[2], arguments[3]),
    'send_message': () => sendMessage(arguments[1], arguments[2], arguments[3], arguments[4] == "true"),
}

const method = functions[function_name]
if (!method) throw Error("Function not found!")

logger.info({ call_method: function_name })
console.log(`function selected: ${function_name}`)

method()
    .then(console.log)
    .catch(console.log)