const hre = require('hardhat');
require('dotenv').config();

async function main() {
	try {
		// 컨트랙트 배포
		const SocialTreeCommission = await hre.ethers.getContractFactory('SocialTreeCommission');
		const socialTreeCommission = await SocialTreeCommission.deploy();
		await socialTreeCommission.waitForDeployment();

		const contractAddress = await socialTreeCommission.getAddress();
		console.log(`SocialTreeCommission 컨트랙트 주소: ${contractAddress}`);

		// (옵션) 초기 콘텐츠 설정 예시
		// const contentId = 1;
		// const monthlyPrice = ethers.parseEther("0.1"); // 예: 0.1 HSK
		// const creatorAddress = "0xYOUR_CREATOR_ADDRESS";
		// await socialTreeCommission.setContent(contentId, monthlyPrice, creatorAddress);
		// console.log(`콘텐츠 ID ${contentId} 등록 완료`);
	} catch (error) {
		console.error('배포 중 오류 발생:', error);
		process.exit(1);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
