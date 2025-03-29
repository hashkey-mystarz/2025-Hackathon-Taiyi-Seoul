require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
	solidity: '0.8.28',
	networks: {
		hashkeyTestnet: {
			url: 'https://hashkeychain-testnet.alt.technology',
			accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
			chainId: 133,
		},
	},
};
