const { expect } = require('chai');
const { ethers } = require('hardhat');

// 테스트에서만 사용할 Mock HSK 토큰 컨트랙트
const MOCK_TOKEN_ABI = [
	'function transfer(address to, uint256 amount) external returns (bool)',
	'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
	'function approve(address spender, uint256 amount) external returns (bool)',
	'function balanceOf(address account) external view returns (uint256)',
	'function mint(address to, uint256 amount) external',
];

describe('SocialTree Commission System', function () {
	// 컨트랙트 객체 선언
	let SocialTreeCommission;
	let socialTreeCommission;
	let mockHSKToken;

	// 계정 선언
	let owner;
	let contentCreator;
	let user1; // 최상위 추천인 (owner가 추천)
	let user2; // user1의 추천을 받은 사용자
	let user3; // user2의 추천을 받은 사용자
	let user4; // user3의 추천을 받은 사용자
	let addrs;

	// 테스트용 상수
	const contentId = 1;
	const contentPrice = ethers.parseEther('10'); // 10 HSK
	const commissionRate = 20; // 20%

	beforeEach(async function () {
		// 컨트랙트 배포
		[owner, contentCreator, user1, user2, user3, user4, ...addrs] = await ethers.getSigners();

		// MockHSKToken 배포 (테스트용 간단한 Mock 토큰)
		// 테스트 환경에서는 실제 HSK 토큰을 사용할 수 없으므로 간단한 Mock을 사용
		const MockHSKTokenFactory = await ethers.getContractFactory('MockHSKToken_Simple');
		mockHSKToken = await MockHSKTokenFactory.deploy();

		// SocialTreeCommission 배포
		SocialTreeCommission = await ethers.getContractFactory('SocialTreeCommission');
		socialTreeCommission = await SocialTreeCommission.deploy(await mockHSKToken.getAddress());

		// 각 사용자에게 토큰 전송
		// 테스트용 토큰 민팅
		await mockHSKToken.mint(owner.address, ethers.parseEther('1000'));
		await mockHSKToken.mint(contentCreator.address, ethers.parseEther('1000'));
		await mockHSKToken.mint(user1.address, ethers.parseEther('1000'));
		await mockHSKToken.mint(user2.address, ethers.parseEther('1000'));
		await mockHSKToken.mint(user3.address, ethers.parseEther('1000'));
		await mockHSKToken.mint(user4.address, ethers.parseEther('1000'));

		// 콘텐츠 등록
		await socialTreeCommission.connect(contentCreator).registerContent(contentId, contentPrice);

		// 추천 구조 설정
		await socialTreeCommission.connect(user1).setReferrer(owner.address);
		await socialTreeCommission.connect(user2).setReferrer(user1.address);
		await socialTreeCommission.connect(user3).setReferrer(user2.address);
		await socialTreeCommission.connect(user4).setReferrer(user3.address);

		// 각 사용자가 커미션 컨트랙트에 토큰 사용 승인
		await mockHSKToken.connect(user1).approve(await socialTreeCommission.getAddress(), ethers.parseEther('100'));
		await mockHSKToken.connect(user2).approve(await socialTreeCommission.getAddress(), ethers.parseEther('100'));
		await mockHSKToken.connect(user3).approve(await socialTreeCommission.getAddress(), ethers.parseEther('100'));
		await mockHSKToken.connect(user4).approve(await socialTreeCommission.getAddress(), ethers.parseEther('100'));
	});

	describe('기본 기능 테스트', function () {
		it('컨트랙트가 올바르게 배포되어야 합니다', async function () {
			expect(await socialTreeCommission.owner()).to.equal(owner.address);
			expect(await socialTreeCommission.hskToken()).to.equal(await mockHSKToken.getAddress());
		});

		it('콘텐츠 등록이 올바르게 작동해야 합니다', async function () {
			expect(await socialTreeCommission.contentPrices(contentId)).to.equal(contentPrice);
			expect(await socialTreeCommission.contentCreators(contentId)).to.equal(contentCreator.address);
		});

		it('소유권 이전이 올바르게 작동해야 합니다', async function () {
			await socialTreeCommission.connect(owner).transferOwnership(user1.address);
			expect(await socialTreeCommission.owner()).to.equal(user1.address);
		});

		it('HSK 토큰 주소 업데이트가 올바르게 작동해야 합니다', async function () {
			const newMockToken = await (await ethers.getContractFactory('MockHSKToken_Simple')).deploy();
			await socialTreeCommission.connect(owner).updateHSKToken(await newMockToken.getAddress());
			expect(await socialTreeCommission.hskToken()).to.equal(await newMockToken.getAddress());
		});
	});

	describe('구독 및 커미션 테스트', function () {
		it('구독 시 콘텐츠 생성자가 대부분의 금액을 받아야 합니다', async function () {
			const creatorBalanceBefore = await mockHSKToken.balanceOf(contentCreator.address);

			// 구독 실행
			await socialTreeCommission.connect(user4).subscribe(contentId);

			// 콘텐츠 생성자는 구독료의 80% 받음
			const creatorShare = (contentPrice * 80n) / 100n;
			const creatorBalanceAfter = await mockHSKToken.balanceOf(contentCreator.address);

			expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(creatorShare);
		});

		it('구독 시 커미션은 추천인에게 재귀적으로 분배되어야 합니다', async function () {
			// 구독 실행
			await socialTreeCommission.connect(user4).subscribe(contentId);

			// 각 레벨의 커미션 계산
			const totalCommission = (contentPrice * 20n) / 100n; // 총 커미션은 20%

			// level 1: user3 (직접 추천인) = 100% 커미션
			const level1Commission = totalCommission;

			// level 2: user2 = 20% 커미션
			const level2Commission = (totalCommission * 20n) / 100n;

			// level 3: user1 = 20% * 20% 커미션
			const level3Commission = (level2Commission * 20n) / 100n;

			// level 4: owner = 20% * 20% * 20% 커미션
			const level4Commission = (level3Commission * 20n) / 100n;

			// 각 레벨의 커미션 확인
			expect(await socialTreeCommission.pendingCommissions(user3.address)).to.equal(level1Commission);
			expect(await socialTreeCommission.pendingCommissions(user2.address)).to.equal(level2Commission);
			expect(await socialTreeCommission.pendingCommissions(user1.address)).to.equal(level3Commission);
			expect(await socialTreeCommission.pendingCommissions(owner.address)).to.equal(level4Commission);
		});

		it('커미션 출금이 올바르게 작동해야 합니다', async function () {
			// 구독 실행으로 커미션 생성
			await socialTreeCommission.connect(user4).subscribe(contentId);

			// user3의 커미션 금액
			const user3Commission = await socialTreeCommission.pendingCommissions(user3.address);
			expect(user3Commission).to.be.gt(0);

			// user3의 초기 잔액
			const user3BalanceBefore = await mockHSKToken.balanceOf(user3.address);

			// 커미션 출금
			await socialTreeCommission.connect(user3).withdraw();

			// 출금 후 잔액 확인
			const user3BalanceAfter = await mockHSKToken.balanceOf(user3.address);
			expect(user3BalanceAfter - user3BalanceBefore).to.equal(user3Commission);

			// 출금 후 커미션 잔액 0 확인
			expect(await socialTreeCommission.pendingCommissions(user3.address)).to.equal(0);
		});

		it('추천 트리가 올바르게 조회되어야 합니다', async function () {
			const tree = await socialTreeCommission.getReferralTree(user4.address);
			expect(tree[0]).to.equal(user3.address);
			expect(tree[1]).to.equal(user2.address);
			expect(tree[2]).to.equal(user1.address);
			expect(tree[3]).to.equal(owner.address);
			expect(tree[4]).to.equal(ethers.ZeroAddress);
		});
	});
});

// 테스트 파일에 필요한 MockHSKToken 컨트랙트 코드
// 이 코드는 자바스크립트로 작성되어 있으므로 테스트에서 참조용으로만 사용
// 실제 컨트랙트는 위의 ethers.getContractFactory('MockHSKToken_Simple')을 통해 별도 파일에서 불러옴

/*
// 테스트용 Mock HSK 토큰 솔리디티 코드 (참조용)
contract MockHSKToken_Simple {
    string public name = "Mock HSK Token";
    string public symbol = "mHSK";
    uint8 public decimals = 18;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(_allowances[from][msg.sender] >= amount, "ERC20: insufficient allowance");
        _allowances[from][msg.sender] -= amount;
        _transfer(from, to, amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "ERC20: transfer amount exceeds balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
    }
    
    // 테스트용 민팅 함수
    function mint(address to, uint256 amount) public {
        require(to != address(0), "ERC20: mint to the zero address");
        
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
*/
