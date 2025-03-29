import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL, CONTRACT_ABI } from '@/constants/contractInfo';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const { userId, contentId, referralCode, transactionHash, amount, signature, message } = await request.json();

		if (!userId || !contentId || !amount) {
			return NextResponse.json({ error: '사용자 ID, 콘텐츠 ID, 금액은 필수입니다.' }, { status: 400 });
		}

		// 사용자가 존재하는지 확인
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('id, wallet_address')
			.eq('id', userId)
			.single();

		if (userError || !user) {
			return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 서명 검증 (있는 경우)
		if (signature && message) {
			const walletAddress = user.wallet_address;
			const signerAddress = ethers.utils.verifyMessage(message, signature);

			if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
				return NextResponse.json({ error: '서명이 유효하지 않습니다.' }, { status: 401 });
			}
		}

		// 콘텐츠가 존재하는지 확인
		const { data: content, error: contentError } = await supabase
			.from('contents')
			.select('id, creator_id, price')
			.eq('id', contentId)
			.single();

		if (contentError || !content) {
			return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
		}

		// 추천인 정보 찾기 (있는 경우)
		let referrerId = null;
		let referrerWalletAddress = null;
		if (referralCode) {
			const { data: referrer, error: referrerError } = await supabase
				.from('users')
				.select('id, wallet_address')
				.eq('referral_code', referralCode)
				.single();

			if (!referrerError && referrer) {
				referrerId = referrer.id;
				referrerWalletAddress = referrer.wallet_address;
			}
		}

		// 이미 구독 중인지 확인
		const { data: existingSubscription, error: subscriptionError } = await supabase
			.from('subscriptions')
			.select('id')
			.eq('user_id', userId)
			.eq('content_id', contentId)
			.eq('status', 'active')
			.maybeSingle();

		if (existingSubscription) {
			return NextResponse.json({ error: '이미 해당 콘텐츠를 구독 중입니다.' }, { status: 400 });
		}

		// 현재 시간과 구독 종료 시간(30일 후) 설정
		const now = new Date();
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() + 30);

		// 스마트 컨트랙트 호출 (온체인 구독 처리)
		let onChainTxHash = '';
		const walletAddress = user.wallet_address;

		// 프라이빗 키는 보안상 서버 환경변수로 관리해야 함 (데모용으로만 사용)
		const privateKey = process.env.ADMIN_PRIVATE_KEY || '';
		if (privateKey) {
			try {
				// 컨트랙트 연결
				const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
				const wallet = new ethers.Wallet(privateKey, provider);
				const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

				// 컨텐츠 정보 설정 (아직 설정되지 않은 경우)
				const contentOnChainId = parseInt(contentId); // UUID를 정수로 변환하거나 별도의 매핑 필요

				// 컨텐츠 생성자 지갑 주소 조회
				const { data: creator, error: creatorError } = await supabase
					.from('users')
					.select('wallet_address')
					.eq('id', content.creator_id)
					.single();

				if (!creatorError && creator) {
					// 컨텐츠 정보 설정 시도 (이미 설정되어 있으면 오류 무시)
					try {
						await contract.setContent(
							contentOnChainId,
							ethers.utils.parseEther(content.price.toString()),
							creator.wallet_address
						);
					} catch (err) {
						console.log('컨텐츠가 이미 설정되어 있거나 설정 오류:', err);
					}

					// 구독 처리
					const value = ethers.utils.parseEther(amount.toString());
					const tx = await contract.subscribe(contentOnChainId, referrerWalletAddress || ethers.constants.AddressZero, {
						value,
					});

					const receipt = await tx.wait();
					onChainTxHash = receipt.transactionHash;
					console.log('온체인 구독 완료:', onChainTxHash);
				}
			} catch (err) {
				console.error('온체인 처리 오류:', err);
				// 온체인 처리가 실패해도 오프체인 DB에는 저장 진행
			}
		}

		// 구독 생성 (오프체인 DB)
		const { data: subscription, error: createError } = await supabase
			.from('subscriptions')
			.insert({
				user_id: userId,
				content_id: contentId,
				referrer_id: referrerId,
				transaction_hash: onChainTxHash || transactionHash,
				amount: amount,
				status: 'active',
				start_date: now.toISOString(),
				end_date: endDate.toISOString(),
			})
			.select('id, user_id, content_id, referrer_id, amount, status, start_date, end_date')
			.single();

		if (createError) {
			console.error('구독 생성 오류:', createError);
			return NextResponse.json({ error: '구독 생성 중 오류가 발생했습니다.' }, { status: 500 });
		}

		// 수수료 처리 (추천인이 있는 경우) - 온체인에서 자동으로 처리되지만, 오프체인 DB에도 기록
		if (referrerId) {
			// 직접 추천인 수수료 (20%)
			const commissionAmount = parseFloat(amount) * 0.2;

			await supabase.from('commissions').insert({
				subscription_id: subscription.id,
				user_id: referrerId,
				from_user_id: userId,
				content_id: contentId,
				level: 1,
				amount: commissionAmount,
				status: 'pending',
				transaction_hash: onChainTxHash,
			});

			// 상위 추천인 조회 및 수수료 처리 (재귀적 분배 시뮬레이션)
			let currentReferrerId = referrerId;
			let currentLevel = 2;
			let currentAmount = commissionAmount;

			while (currentLevel <= 3) {
				// 최대 3단계까지 재귀
				// 현재 추천인의 추천인 조회
				const { data: upperReferrer, error: upperReferrerError } = await supabase
					.from('users')
					.select('id, referrer_id')
					.eq('id', currentReferrerId)
					.single();

				if (upperReferrerError || !upperReferrer || !upperReferrer.referrer_id) {
					break; // 상위 추천인이 없으면 중단
				}

				// 상위 레벨 수수료 계산 (20%씩 감소)
				currentAmount = currentAmount * 0.2;

				// 최소 분배 금액 미만이면 중단
				if (currentAmount < 0.01) {
					break;
				}

				// 상위 추천인에게 수수료 기록
				await supabase.from('commissions').insert({
					subscription_id: subscription.id,
					user_id: upperReferrer.referrer_id,
					from_user_id: userId,
					content_id: contentId,
					level: currentLevel,
					amount: currentAmount,
					status: 'pending',
					transaction_hash: onChainTxHash,
				});

				// 다음 상위 레벨로 이동
				currentReferrerId = upperReferrer.referrer_id;
				currentLevel += 1;
			}
		}

		return NextResponse.json(
			{
				message: '구독이 성공적으로 생성되었습니다.',
				subscription: subscription,
				onChainTxHash: onChainTxHash,
			},
			{ status: 201 }
		);
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
