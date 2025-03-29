import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL, CONTRACT_ABI } from '@/constants/contractInfo';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const supabase = createClient();
		const userId = params.id;
		const { signature, message } = await request.json();

		if (!userId || !signature || !message) {
			return NextResponse.json({ error: '사용자 ID, 서명, 메시지는 필수입니다.' }, { status: 400 });
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

		// 서명 검증
		const walletAddress = user.wallet_address;
		const signerAddress = ethers.utils.verifyMessage(message, signature);

		if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
			return NextResponse.json({ error: '서명이 유효하지 않습니다.' }, { status: 401 });
		}

		// 프라이빗 키는 보안상 서버 환경변수로 관리해야 함 (데모용으로만 사용)
		// 실제 서비스에서는 사용자가 프론트엔드에서 직접 트랜잭션을 서명하는 방식으로 구현해야 함
		const privateKey = process.env.ADMIN_PRIVATE_KEY || '';
		if (!privateKey) {
			return NextResponse.json({ error: '서버 설정 오류: 관리자 키가 설정되지 않았습니다.' }, { status: 500 });
		}

		// 컨트랙트 연결
		const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
		const wallet = new ethers.Wallet(privateKey, provider);
		const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

		// 출금 가능한 잔액 확인
		const balance = await contract.getCommission(walletAddress);

		if (balance.lte(0)) {
			return NextResponse.json({ error: '출금 가능한 금액이 없습니다.' }, { status: 400 });
		}

		// 출금 트랜잭션 실행
		const tx = await contract.withdraw({ from: walletAddress });
		const receipt = await tx.wait();

		// 트랜잭션이 성공적으로 처리됨
		if (receipt && receipt.status === 1) {
			// 커미션 상태 업데이트
			const { data: commissions, error: updateError } = await supabase
				.from('commissions')
				.update({ status: 'paid', transaction_hash: receipt.transactionHash })
				.eq('user_id', userId)
				.eq('status', 'pending')
				.select('id');

			if (updateError) {
				console.error('커미션 상태 업데이트 오류:', updateError);
				// 온체인에서는 성공했지만 DB 업데이트는 실패한 경우
			}

			return NextResponse.json({
				message: '보상이 성공적으로 출금되었습니다.',
				transaction: {
					hash: receipt.transactionHash,
					blockNumber: receipt.blockNumber,
					amount: balance.toString(),
				},
			});
		}

		return NextResponse.json({ error: '트랜잭션 처리 중 오류가 발생했습니다.' }, { status: 500 });
	} catch (error) {
		console.error('서버 오류:', error);
		return NextResponse.json(
			{
				error: '서버 오류가 발생했습니다.',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
