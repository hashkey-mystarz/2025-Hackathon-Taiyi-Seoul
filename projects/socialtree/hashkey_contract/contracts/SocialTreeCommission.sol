// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SocialTreeCommission
 * @dev 월 구독 모델 및 재귀적 커미션 분배 로직을 가진 SocialTree 플랫폼의 커미션 관리 컨트랙트
 * 유저 트리 추적 및 20%씩 재귀적으로 감소하는 커미션 분배 구현
 */
contract SocialTreeCommission {
    // 최소 분배 가능 금액 - 이 금액 이하면 분배 중단
    uint256 public constant MIN_DISTRIBUTION_AMOUNT = 0.00001 ether;
    
    // 커미션 비율 (20% = 20)
    uint256 public constant COMMISSION_RATE = 20;
    
    // 소유자 주소
    address public owner;
    
    // 유저의 추천인을 저장하는 매핑
    mapping(address => address) public referrers;
    
    // 각 유저별 누적 커미션 금액
    mapping(address => uint256) public pendingCommissions;
    
    // 사용자가 추천한 사용자 목록 (추천인 => 추천받은 사용자 배열)
    mapping(address => address[]) public referredUsers;
    
    // 사용자의 추천 인덱스 (추천인 => 추천받은 사용자 => 인덱스)
    mapping(address => mapping(address => uint256)) private referredUserIndices;
    
    // 사용자의 활성 구독 수
    mapping(address => uint256) public activeSubscriptionCount;
    
    // 구독 정보 구조체
    struct Subscription {
        uint256 price;        // 구독 가격
        uint256 startTime;    // 구독 시작 시간
        uint256 endTime;      // 구독 종료 시간 (0이면 활성 상태)
        address referrer;     // 추천인 주소
        bool active;          // 구독 활성 상태
    }
    
    // 콘텐츠별 구독 정보를 저장하는 매핑 (사용자 주소 => 콘텐츠 ID => 구독 정보)
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
    
    // 각 콘텐츠별 가격 (콘텐츠 ID => 가격)
    mapping(uint256 => uint256) public contentPrices;
    
    // 콘텐츠 생성자 주소 (콘텐츠 ID => 생성자 주소)
    mapping(uint256 => address) public contentCreators;
    
    // 이벤트 정의
    event ReferrerSet(address indexed user, address indexed referrer);
    event ReferrerMigrated(address indexed user, address indexed oldReferrer, address indexed newReferrer);
    event Subscribed(address indexed user, uint256 indexed contentId, address indexed referrer, uint256 amount, uint256 endTime);
    event SubscriptionCancelled(address indexed user, uint256 indexed contentId, uint256 cancelTime);
    event CommissionDistributed(address indexed recipient, address indexed fromUser, uint256 amount, uint256 level);
    event CommissionWithdrawn(address indexed user, uint256 amount);
    event ReferralNetworkMigrated(address indexed fromUser, address indexed toReferrer, uint256 migratedCount);
    event ContentRegistered(uint256 indexed contentId, uint256 price, address indexed creator);
    
    // 오너만 실행 가능한 modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev 컨트랙트 생성자
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev 추천인 설정
     * @param _referrer 추천인 주소
     */
    function setReferrer(address _referrer) external {
        require(_referrer != address(0), "Invalid referrer address");
        require(_referrer != msg.sender, "Cannot refer yourself");
        require(referrers[msg.sender] == address(0), "Referrer already set");
        
        // 순환 참조 방지
        address currentReferrer = _referrer;
        while (currentReferrer != address(0)) {
            require(currentReferrer != msg.sender, "Circular reference detected");
            currentReferrer = referrers[currentReferrer];
        }
        
        // 추천인-피추천인 관계 설정
        referrers[msg.sender] = _referrer;
        
        // 추천인의 추천 목록에 추가
        referredUsers[_referrer].push(msg.sender);
        referredUserIndices[_referrer][msg.sender] = referredUsers[_referrer].length - 1;
        
        emit ReferrerSet(msg.sender, _referrer);
    }
    
    /**
     * @dev 콘텐츠 등록 초기화 - 오너만 호출 가능
     * @param _contentId 콘텐츠 ID
     * @param _price 월 구독 가격
     * @param _creator 콘텐츠 생성자 주소
     */
    function setContent(uint256 _contentId, uint256 _price, address _creator) external onlyOwner {
        require(_price > 0, "Price must be greater than 0");
        require(_creator != address(0), "Invalid creator address");
        
        contentPrices[_contentId] = _price;
        contentCreators[_contentId] = _creator;
        
        emit ContentRegistered(_contentId, _price, _creator);
    }
    
    /**
     * @dev 월 구독 신청 (추천인 지정)
     * @param _contentId 구독할 콘텐츠 ID
     * @param _referrer 추천인 주소
     */
    function subscribe(uint256 _contentId, address _referrer) external payable {
        // 추천인이 지정되었고 아직 추천인이 설정되지 않은 경우에만 설정
        if (_referrer != address(0) && _referrer != msg.sender && referrers[msg.sender] == address(0)) {
            _setReferrer(msg.sender, _referrer);
        }
        
        uint256 price = contentPrices[_contentId];
        address creator = contentCreators[_contentId];
        
        // 콘텐츠가 등록되지 않은 경우 자동으로 등록
        if (price == 0 || creator == address(0)) {
            // 메시지 값을 가격으로 사용
            price = msg.value;
            require(price > 0, "Payment amount must be greater than 0");
            
            // 콘텐츠 자동 등록 (메시지 발신자를 크리에이터로 설정)
            contentPrices[_contentId] = price;
            contentCreators[_contentId] = msg.sender;
            creator = msg.sender;
            
            emit ContentRegistered(_contentId, price, creator);
        } else {
            // 이미 등록된 콘텐츠인 경우 충분한 금액이 지불되었는지 확인
            require(msg.value >= price, "Insufficient payment");
        }
        
        // 구독 정보 업데이트
        Subscription storage sub = subscriptions[msg.sender][_contentId];
        
        // 새 구독이거나 만료된 구독인 경우
        require(!sub.active || block.timestamp >= sub.endTime, "Subscription is already active");
        
        // 활성 구독이 없었던 경우 카운트 증가
        if (!sub.active) {
            activeSubscriptionCount[msg.sender]++;
        }
        
        // 한 달(30일) 구독 설정
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + 30 days;
        
        sub.price = price;
        sub.startTime = startTime;
        sub.endTime = endTime;
        sub.referrer = referrers[msg.sender];
        sub.active = true;
        
        // 콘텐츠 생성자에게 80% 지급 (20%는 커미션으로 분배)
        uint256 creatorAmount = (price * 80) / 100;
        payable(creator).transfer(creatorAmount);
        
        // 커미션 분배 (20%)
        uint256 commissionAmount = price - creatorAmount;
        _distributeCommission(referrers[msg.sender], msg.sender, commissionAmount);
        
        // 초과 지불된 금액 환불
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit Subscribed(msg.sender, _contentId, referrers[msg.sender], price, endTime);
    }
    
    /**
     * @dev 구독 취소 및 레퍼럴 네트워크 이양
     * @param _contentId 취소할 콘텐츠 ID
     */
    function cancelSubscription(uint256 _contentId) external {
        Subscription storage sub = subscriptions[msg.sender][_contentId];
        
        require(sub.active, "Subscription is not active");
        
        // 구독 비활성화
        sub.active = false;
        
        // 활성 구독 수 감소
        activeSubscriptionCount[msg.sender]--;
        
        // 더 이상 활성 구독이 없는 경우, 하위 레퍼럴 네트워크를 상위 레퍼럴에게 이양
        if (activeSubscriptionCount[msg.sender] == 0 && referrers[msg.sender] != address(0)) {
            _migrateReferralNetwork(msg.sender, referrers[msg.sender]);
        }
        
        emit SubscriptionCancelled(msg.sender, _contentId, block.timestamp);
    }
    
    /**
     * @dev 하위 레퍼럴 네트워크를 상위 레퍼럴로 이양
     * @param _from 현재 추천인 (구독 취소한 사용자)
     * @param _to 상위 추천인
     */
    function _migrateReferralNetwork(address _from, address _to) internal {
        address[] storage usersToMigrate = referredUsers[_from];
        uint256 migratedCount = 0;
        
        // 모든 하위 레퍼럴을 상위 레퍼럴로 이양
        for (uint256 i = 0; i < usersToMigrate.length; i++) {
            address user = usersToMigrate[i];
            
            // 기존 추천인 관계 제거
            delete referredUserIndices[_from][user];
            
            // 새 추천인 관계 설정
            _changeReferrer(user, _to);
            migratedCount++;
        }
        
        // 이양 후 사용자의 레퍼럴 목록 초기화
        delete referredUsers[_from];
        
        emit ReferralNetworkMigrated(_from, _to, migratedCount);
    }
    
    /**
     * @dev 내부 함수: 사용자의 추천인 설정
     * @param _user 사용자 주소
     * @param _referrer 추천인 주소
     */
    function _setReferrer(address _user, address _referrer) internal {
        referrers[_user] = _referrer;
        
        // 추천인의 추천 목록에 추가
        referredUsers[_referrer].push(_user);
        referredUserIndices[_referrer][_user] = referredUsers[_referrer].length - 1;
        
        emit ReferrerSet(_user, _referrer);
    }
    
    /**
     * @dev 내부 함수: 사용자의 추천인 변경
     * @param _user 사용자 주소
     * @param _newReferrer 새 추천인 주소
     */
    function _changeReferrer(address _user, address _newReferrer) internal {
        address oldReferrer = referrers[_user];
        
        // 새 추천인 관계 설정
        referrers[_user] = _newReferrer;
        
        // 새 추천인의 추천 목록에 추가
        referredUsers[_newReferrer].push(_user);
        referredUserIndices[_newReferrer][_user] = referredUsers[_newReferrer].length - 1;
        
        emit ReferrerMigrated(_user, oldReferrer, _newReferrer);
    }
    
    /**
     * @dev 구독 상태 확인
     * @param _user 사용자 주소
     * @param _contentId 콘텐츠 ID
     * @return active 구독 활성 상태
     * @return endTime 구독 종료 시간
     */
    function getSubscriptionStatus(address _user, uint256 _contentId) external view returns (bool active, uint256 endTime) {
        Subscription memory sub = subscriptions[_user][_contentId];
        
        // 구독이 존재하고, 활성 상태이며, 아직 만료되지 않은 경우
        if (sub.active && block.timestamp < sub.endTime) {
            return (true, sub.endTime);
        }
        
        return (false, 0);
    }
    
    /**
     * @dev 사용자의 하위 레퍼럴 목록 조회
     * @param _user 사용자 주소
     * @return 하위 레퍼럴 목록
     */
    function getReferredUsers(address _user) external view returns (address[] memory) {
        return referredUsers[_user];
    }
    
    /**
     * @dev 커미션 재귀적 분배
     * @param _referrer 추천인 주소
     * @param _subscriber 구독자 주소
     * @param _amount 분배할 총 금액
     */
    function _distributeCommission(address _referrer, address _subscriber, uint256 _amount) internal {
        // 추천인이 없거나 금액이 최소 분배 금액보다 작으면 중단
        if (_referrer == address(0) || _amount < MIN_DISTRIBUTION_AMOUNT) {
            return;
        }

        uint256 currentAmount = _amount;
        address currentReferrer = _referrer;
        uint256 level = 1;
        
        while (currentReferrer != address(0) && currentAmount >= MIN_DISTRIBUTION_AMOUNT) {
            // 현재 레벨의 추천인에게 현재 금액의 100%를 지급
            pendingCommissions[currentReferrer] += currentAmount;
            emit CommissionDistributed(currentReferrer, _subscriber, currentAmount, level);
            
            // 상위 레벨로 이동하며 금액은 20%로 감소
            currentAmount = (currentAmount * COMMISSION_RATE) / 100;
            currentReferrer = referrers[currentReferrer];
            level++;
        }
    }
    
    /**
     * @dev 누적된 커미션 출금
     */
    function withdraw() external {
        uint256 amount = pendingCommissions[msg.sender];
        require(amount > 0, "No commission to withdraw");
        
        // 출금 전에 먼저 잔액을 0으로 설정 (재진입 공격 방지)
        pendingCommissions[msg.sender] = 0;
        
        // 네이티브 토큰(HSK) 전송
        payable(msg.sender).transfer(amount);
        
        emit CommissionWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev 사용자의 커미션 조회
     * @param _user 사용자 주소
     * @return 누적된 커미션 금액
     */
    function getCommission(address _user) external view returns (uint256) {
        return pendingCommissions[_user];
    }
} 