export const RPC_URL = 'https://hashkeychain-testnet.alt.technology';
export const CONTRACT_NAME = 'SocialTreeCommission';
export const CONTRACT_ADDRESS = '0x8919d5A2bB03a7E76d1Dc14322a506A9AcF1FF3D';

export const CONTRACT_ABI = [
	{
		inputs: [],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'recipient',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'fromUser',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amount',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'level',
				type: 'uint256',
			},
		],
		name: 'CommissionDistributed',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amount',
				type: 'uint256',
			},
		],
		name: 'CommissionWithdrawn',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'fromUser',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'toReferrer',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'migratedCount',
				type: 'uint256',
			},
		],
		name: 'ReferralNetworkMigrated',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'oldReferrer',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'newReferrer',
				type: 'address',
			},
		],
		name: 'ReferrerMigrated',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'referrer',
				type: 'address',
			},
		],
		name: 'ReferrerSet',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'contentId',
				type: 'uint256',
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'referrer',
				type: 'address',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amount',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'endTime',
				type: 'uint256',
			},
		],
		name: 'Subscribed',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address',
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'contentId',
				type: 'uint256',
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'cancelTime',
				type: 'uint256',
			},
		],
		name: 'SubscriptionCancelled',
		type: 'event',
	},
	{
		inputs: [],
		name: 'COMMISSION_RATE',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'MIN_DISTRIBUTION_AMOUNT',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		name: 'activeSubscriptionCount',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_contentId',
				type: 'uint256',
			},
		],
		name: 'cancelSubscription',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		name: 'contentCreators',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		name: 'contentPrices',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_user',
				type: 'address',
			},
		],
		name: 'getCommission',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_user',
				type: 'address',
			},
		],
		name: 'getReferredUsers',
		outputs: [
			{
				internalType: 'address[]',
				name: '',
				type: 'address[]',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_user',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: '_contentId',
				type: 'uint256',
			},
		],
		name: 'getSubscriptionStatus',
		outputs: [
			{
				internalType: 'bool',
				name: 'active',
				type: 'bool',
			},
			{
				internalType: 'uint256',
				name: 'endTime',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'owner',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		name: 'pendingCommissions',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		name: 'referredUsers',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		name: 'referrers',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_contentId',
				type: 'uint256',
			},
			{
				internalType: 'uint256',
				name: '_price',
				type: 'uint256',
			},
			{
				internalType: 'address',
				name: '_creator',
				type: 'address',
			},
		],
		name: 'setContent',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_referrer',
				type: 'address',
			},
		],
		name: 'setReferrer',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_contentId',
				type: 'uint256',
			},
			{
				internalType: 'address',
				name: '_referrer',
				type: 'address',
			},
		],
		name: 'subscribe',
		outputs: [],
		stateMutability: 'payable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		name: 'subscriptions',
		outputs: [
			{
				internalType: 'uint256',
				name: 'price',
				type: 'uint256',
			},
			{
				internalType: 'uint256',
				name: 'startTime',
				type: 'uint256',
			},
			{
				internalType: 'uint256',
				name: 'endTime',
				type: 'uint256',
			},
			{
				internalType: 'address',
				name: 'referrer',
				type: 'address',
			},
			{
				internalType: 'bool',
				name: 'active',
				type: 'bool',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'withdraw',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
];
