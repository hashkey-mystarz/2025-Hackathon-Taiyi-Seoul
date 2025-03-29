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
];

/**
 * 사용자의 콘텐츠별 수수료 내역 조회 API
 *
 * Query Parameters:
 * - contentId: 콘텐츠 ID (선택적) - 입력 시 해당 콘텐츠의 수수료만 반환
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createClient();
		const userId = params.id;
		const { searchParams } = new URL(request.url);
		const contentId = searchParams.get('contentId'); // 선택적 콘텐츠 ID

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

		// 오프체인 수수료 쿼리 설정
		let query = supabase
			.from('commissions')
			.select(
				`
        id, 
        content_id, 
        from_user_id, 
        level, 
        amount, 
        created_at,
        subscriptions(content_id),
        contents(id, title)
      `
			)
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		// 특정 콘텐츠만 필터링
		if (contentId) {
			query = query.eq('content_id', contentId);
		}

		const { data: commissions, error: commissionsError } = await query;

		if (commissionsError) {
			console.error('수수료 내역 조회 오류:', commissionsError);
			return NextResponse.json({ error: '수수료 내역 조회 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 콘텐츠별로 그룹화
		const contentGroups: { [key: string]: any } = {};
		let totalOffChainAmount = 0;

		(commissions || []).forEach((commission: any) => {
			// 콘텐츠 정보 추출
			const contentInfo = commission.contents || { id: commission.content_id, title: '알 수 없는 콘텐츠' };
			const contentId = contentInfo.id;

			// 수수료 금액 파싱
			const amount = parseFloat(commission.amount) || 0;
			totalOffChainAmount += amount;

			// 콘텐츠별 그룹에 추가
			if (!contentGroups[contentId]) {
				contentGroups[contentId] = {
					content: {
						id: contentId,
						title: contentInfo.title,
					},
					commissions: [],
					totalAmount: 0,
				};
			}

			contentGroups[contentId].commissions.push({
				id: commission.id,
				fromUserId: commission.from_user_id,
				level: commission.level,
				amount: amount,
				createdAt: commission.created_at,
			});

			contentGroups[contentId].totalAmount += amount;
		});

		// 온체인 수수료 잔액 조회
		let onChainBalance = '0';

		try {
			// HashKey 테스트넷에 연결 (ethers 버전에 따라 사용법 다름)
			const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
			const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

			// 커미션 잔액 조회
			const balance = await contract.getCommission(walletAddress);
			onChainBalance = balance.toString();
		} catch (chainError) {
			console.error('온체인 데이터 조회 오류:', chainError);
			// 온체인 조회 실패해도 오프체인 데이터는 반환
		}

		// 결과 포맷팅
		const contentCommissions = Object.values(contentGroups);

		return NextResponse.json({
			user: {
				id: user.id,
				walletAddress: walletAddress,
			},
			summary: {
				totalOffChain: totalOffChainAmount.toString(),
				onChainBalance: onChainBalance,
				contentsCount: contentCommissions.length,
			},
			contentCommissions: contentCommissions,
		});
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
}
