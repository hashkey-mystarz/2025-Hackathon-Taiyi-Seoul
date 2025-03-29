import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL } from '@/constants/contractInfo';

// 스마트 컨트랙트 ABI (필요한 함수만 포함)
const CONTRACT_ABI = [
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
];

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createClient();
		const userId = params.id;

		if (!userId) {
			return NextResponse.json({ error: '사용자 ID는 필수입니다.' }, { status: 400 });
		}

		// 사용자 정보 조회
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, wallet_address')
			.eq('id', userId)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 사용자의 지갑 주소
		const walletAddress = user.wallet_address;

		// 오프체인 커미션 내역 조회
		const { data: commissions, error: commissionsError } = await supabase
			.from('commissions')
			.select('id, content_id, from_user_id, level, amount, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (commissionsError) {
			console.error('커미션 내역 조회 오류:', commissionsError);
			return NextResponse.json({ error: '커미션 내역 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 온체인 커미션 잔액 조회
		let onChainBalance = '0';
		let referredUsersCount = 0;

		try {
			// HashKey 테스트넷에 연결 (ethers v6 문법으로 수정)
			const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
			const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

			// 커미션 잔액 조회
			const balance = await contract.getCommission(walletAddress);
			onChainBalance = balance.toString();

			// 추천한 사용자 수 조회
			const referredUsers = await contract.getReferredUsers(walletAddress);
			referredUsersCount = referredUsers.length;
		} catch (chainError) {
			console.error('온체인 데이터 조회 오류:', chainError);
			// 온체인 조회 실패해도 오프체인 데이터는 반환
		}

		// 커미션 합계 계산
		const totalOffChainAmount = commissions.reduce(
			(sum: number, commission: any) => sum + (Number(commission.amount) || 0),
			0
		);

		return NextResponse.json({
			user: {
				id: user.id,
				walletAddress: walletAddress,
			},
			commissions: {
				history: commissions,
				count: commissions.length,
				totalOffChain: totalOffChainAmount.toString(),
				onChainBalance: onChainBalance,
				referredUsers: referredUsersCount,
			},
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
