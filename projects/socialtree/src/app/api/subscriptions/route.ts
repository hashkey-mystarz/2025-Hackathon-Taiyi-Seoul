import { createClient } from '@/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL, CONTRACT_ABI } from '@/constants/contractInfo';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();
		const requestData = await request.json();
		const { userId, wallet_address, contentId, referralCode, transactionHash, amount, signature, message } =
			requestData;

		console.log('구독 API 요청 데이터:', requestData);

		if (!contentId || !amount) {
			return NextResponse.json({ error: '콘텐츠 ID, 금액은 필수입니다.' }, { status: 400 });
		}

		// userId나 wallet_address 중 하나는 반드시 있어야 함
		if (!userId && !wallet_address) {
			return NextResponse.json({ error: '사용자 ID나 지갑 주소 중 하나는 필수입니다.' }, { status: 400 });
		}

		// 사용자가 존재하는지 확인
		let user;
		if (wallet_address) {
			console.log('지갑 주소로 사용자 조회:', wallet_address);
			// 지갑 주소로 사용자 조회
			const { data: walletUser, error: walletUserError } = await supabase
				.from('users')
				.select('id, wallet_address')
				.eq('wallet_address', wallet_address.toLowerCase())
				.single();

			if (walletUserError) {
				console.log('기존 사용자 조회 결과 오류:', walletUserError);
				// 사용자가 없으면 새로 생성
				if (walletUserError.code === 'PGRST116') {
					console.log('사용자가 존재하지 않아 새로 생성합니다.');
					// 새로운 추천 코드 생성 (지갑 주소의 앞 6자리)
					const referralCode = wallet_address.slice(2, 8).toLowerCase();

					// 사용자 정보 준비
					const newUserData = {
						wallet_address: wallet_address.toLowerCase(),
						referral_code: referralCode,
					};
					console.log('생성할 사용자 정보:', newUserData);

					try {
						const { data: newUser, error: createError } = await supabase
							.from('users')
							.insert(newUserData)
							.select('id, wallet_address')
							.single();

						if (createError) {
							console.error('사용자 생성 오류 상세:', createError);
							return NextResponse.json(
								{
									error: '사용자 생성 중 오류가 발생했습니다.',
									details: createError.message,
									code: createError.code,
								},
								{ status: 500 }
							);
						}

						console.log('새 사용자 생성 성공:', newUser);
						user = newUser;
					} catch (err) {
						console.error('사용자 생성 중 예외 발생:', err);
						return NextResponse.json(
							{
								error: '사용자 생성 중 예외가 발생했습니다.',
								details: err instanceof Error ? err.message : String(err),
							},
							{ status: 500 }
						);
					}
				} else {
					console.error('사용자 조회 오류 상세:', walletUserError);
					return NextResponse.json(
						{
							error: '사용자 조회 중 오류가 발생했습니다.',
							details: walletUserError.message,
							code: walletUserError.code,
						},
						{ status: 500 }
					);
				}
			} else {
				console.log('기존 사용자 조회 성공:', walletUser);
				user = walletUser;
			}
		} else {
			// userId로 사용자 조회
			const { data: idUser, error: idUserError } = await supabase
				.from('users')
				.select('id, wallet_address')
				.eq('id', userId)
				.single();

			if (idUserError || !idUser) {
				return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
			}
			user = idUser;
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
			.eq('user_id', user.id)
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

		// 온체인 트랜잭션 검증 (클라이언트에서 트랜잭션 해시를 제공한 경우)
		if (transactionHash) {
			console.log('트랜잭션 해시 확인:', transactionHash);
			try {
				const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
				const receipt = await provider.getTransactionReceipt(transactionHash);

				if (!receipt || receipt.status !== 1) {
					console.error('트랜잭션 실패 또는 미확인:', receipt);
					return NextResponse.json({ error: '유효하지 않은 트랜잭션입니다.' }, { status: 400 });
				}

				// 트랜잭션이 SocialTreeCommission 컨트랙트와 상호작용하는지 확인
				if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
					console.error('트랜잭션 대상이 올바른 컨트랙트가 아닙니다:', receipt.to);
					return NextResponse.json({ error: '유효하지 않은 트랜잭션 대상입니다.' }, { status: 400 });
				}

				console.log('유효한 트랜잭션 확인됨:', receipt);
				onChainTxHash = transactionHash;
			} catch (err) {
				console.error('트랜잭션 검증 오류:', err);
				return NextResponse.json(
					{
						error: '트랜잭션 검증 중 오류가 발생했습니다.',
						details: err instanceof Error ? err.message : String(err),
					},
					{ status: 400 }
				);
			}
		}
		// 트랜잭션 해시가 없고 서버 측 처리도 실패한 경우, 오류 반환
		else if (!onChainTxHash) {
			console.error('트랜잭션 해시가 없고 서버 측 처리도 실패했습니다.');
			return NextResponse.json({ error: '구독 처리를 위한 유효한 트랜잭션이 없습니다.' }, { status: 400 });
		}

		// 구독 생성 (오프체인 DB)
		const { data: subscription, error: createError } = await supabase
			.from('subscriptions')
			.insert({
				user_id: user.id,
				content_id: contentId,
				referrer_id: referrerId,
				transaction_hash: onChainTxHash,
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
				from_user_id: user.id,
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
					from_user_id: user.id,
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
