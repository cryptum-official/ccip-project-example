# About The Project

This code provides a practical example of how to use the Chainlink functions implemented with the Cryptum-sdk

In this project, we utilized the following functionalities:

   - Chainlink CCIP

This project was developed based on the AVALANCHE and ETHEREUM Sepolia network on TESTNET.

It's necessary to have ETH and LINK in your wallet for it to function correctly.

We will send data from the Ethereum network to the Avalanche network.

## About Cryptum

The Cryptum infrastructure allows clients to integrate and interact with the most diverse blockchain protocols - you don't need to start from scratch! We already laid the foundation for you to build upon. </b> Learn more about Cryptum <a href="https://cryptum.io" target="_blank">here</a>.


## About Chainlink

Chainlink is the industry-standard Web3 services platform that has enabled trillions of dollars in transaction volume across DeFi, insurance, gaming, NFTs, and other major industries. As the leading decentralized oracle network, Chainlink enables developers to build feature-rich Web3 applications with seamless access to real-world data and off-chain computation across any blockchain and provides global enterprises with a universal gateway to all blockchains.

[Read more about the Chainlink integration](docs/chainlink.md).

### Implementation

The following steps highlight the core aspect of our project, which involves using Chainlink CCIP with the Cryptum SDK to send data between the Ethereum Sepolia network and the Avalanche Fuji network.

#### Step 1

Obtain your credentials and create a wallet. Get faucets for Ethereum and Avalanche Fuji.

You can obtain faucets through the link: https://docs.chain.link/ccip/test-tokens

#### Step 2

Deploy your contract on the source network.

```js
const { hash } = await sdk.chainlink.createCCIP({
   protocol: PROTOCOL,
   wallet
})
```

```sh
node origin create_ccip
```

#### Step 3 

Add funds to the created contract.

In this example, we will add ETH and LINK. We will transfer the balance from our wallet to the contract.

```js
const { hash } = await sdk.token.transfer({
   wallet,
   protocol: PROTOCOL,
   token,
   destination: contractAddress, // contractAddress
   amount: amount,
})
```

```sh
# add ETH
node origin add_founds 0x8688CCA669714C205E6C722d15d7dEF0dE764869 ETH 0.05 

# add LINK
node origin add_founds 0x8688CCA669714C205E6C722d15d7dEF0dE764869 0x779877A7B0D9E8603169DdbD7836e478b4624789 10
```
#### Step 4

Repeat steps 2 and 3 on the destination network.

```sh
# create contract
node destination create_ccip
# add AVAX
node destination add_founds 0x791122cc6f94D78289EC737F4cc04ce444292aE1 AVAX 0.2

# add LINK
node destination add_founds 0x791122cc6f94D78289EC737F4cc04ce444292aE1 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846 10
```

#### Step 5

On the destination contract, approve the origin contract address to receive messages sent by it.

```js
const { hash } = await sdk.chainlink.allowSenderCCIP({
   protocol: PROTOCOL,
   wallet,
   address: contractAddress,
   senderAddress,
   allowed
})
```

```sh
# node destination allow_sender contractAddress senderAddress allowed
node destination allow_sender 0x791122cc6f94D78289EC737F4cc04ce444292aE1 0x8688CCA669714C205E6C722d15d7dEF0dE764869 true
```

#### Step 6
Send a data message to Avalanche Fuji.

```js
const { hash } = await sdk.chainlink.sendMessageCCIP({
   wallet,
   protocol: PROTOCOL,
   destinationProtocol: process.env.PROTOCOL_DESTINATION,
   payLink,
   text: data,
   contractAddress: senderContractAddress,
   to: receiveContractAddress
})
```

```sh
# senderAddress receiveAddress data payLink
node origin send_message 0x8688CCA669714C205E6C722d15d7dEF0dE764869 0x791122cc6f94D78289EC737F4cc04ce444292aE1 'Cryptum Sdk <> Chainlink CCIP' true

# example response: 
# hash: 0x08dead64fbeeb59946351cd89ee584f2a7caafc8d0512de2c2f7c5a96c052506
```

You can track the request status at: https://ccip.chain.link or by using the function:
`sdk.chainlink.getStatusCCIP`

See more examples for sending tokens and tokens with data. [Read More](https://github.com/cryptum-official/cryptum-sdk/blob/master/docs/chainlink.md)

#### Step 6

Run destination.js and wait for the new message:

```js
const message = await sdk.chainlink.getLastReceivedMessageDetailsCCIP({
        protocol: PROTOCOL,
        address: contractAddress
})
```

```sh
node destination receive_message 0x791122cc6f94D78289EC737F4cc04ce444292aE1
```
