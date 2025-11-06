# 프로젝트 분석 문서

## 📋 프로젝트 개요

**프로젝트명**: Fittly  
**팀장**: 김준경  
**팀원**: 정동화, 김경진, 김대일, 고동욱  
**프로젝트 유형**: 패션 E-Commerce 플랫폼 (모노레포 구조)  
**개발 목적**: AI 기반 패션 상품 추천 및 쇼핑몰 서비스 제공  
**구조**: 백엔드(Spring Boot) + 프론트엔드(React) + 업로드 자산 디렉터리  
**버전**: 백엔드 0.0.1-SNAPSHOT, 프론트엔드 0.1.0

---

## 🏗️ 기술 스택

### 백엔드 (`fittly/`)

#### 프레임워크 및 언어
- **Spring Boot**: 3.5.5
- **Java**: 17
- **빌드 도구**: Gradle

#### 주요 의존성
- **Spring Web**: RESTful API 서버
- **Spring Security**: JWT 기반 인증/인가
- **Spring Data JPA**: 데이터베이스 ORM
- **Spring Validation**: 요청 데이터 검증
- **Spring Mail**: 이메일 인증/비밀번호 재설정
- **MySQL Connector/J**: MySQL 데이터베이스 연결
- **JJWT** (0.11.5): JWT 토큰 생성 및 검증
- **OpenAI Java SDK** (3.7.1): AI 비전 분석 및 추천
- **Lombok**: 코드 보일러플레이트 제거
- **Jackson**: JSON 직렬화/역직렬화

### 프론트엔드 (`fittlyreact/`)

#### 프레임워크 및 언어
- **React**: 19.1.1
- **React Router DOM**: 7.9.4
- **Create React App**: 5.0.1

#### 주요 의존성
- **axios**: ^1.12.2 - HTTP 클라이언트
- **jwt-decode**: ^4.0.0 - JWT 토큰 디코딩
- **@fortawesome/fontawesome-free**: ^7.0.1 - 아이콘
- **react-scripts**: 5.0.1 - CRA 빌드 도구

### 인프라 및 데이터베이스
- **MySQL**: 관계형 데이터베이스
- **파일 시스템**: 로컬 업로드 디렉터리 (`C:/uploads`)

---

## 📁 프로젝트 구조

```
fittly/
├── fittly/                          # Spring Boot 백엔드
│   ├── src/main/java/kr/co/fittly/
│   │   ├── config/                  # 설정 클래스
│   │   │   ├── SecurityConfig.java           # Spring Security 설정
│   │   │   ├── WebMvcConfig.java            # CORS, 인터셉터 설정
│   │   │   ├── OpenAIConfig.java            # OpenAI 클라이언트 설정
│   │   │   └── JpaConfig.java               # JPA 설정
│   │   ├── controller/              # REST API 컨트롤러
│   │   │   ├── user/                        # 사용자 관련
│   │   │   │   ├── AuthController.java             # 인증 (로그인/회원가입)
│   │   │   │   ├── MeController.java               # 내 정보 조회/수정
│   │   │   │   ├── AddressController.java          # 배송지 관리
│   │   │   │   ├── AiController.java               # AI 추천 API
│   │   │   │   ├── AiVisionController.java         # AI 비전 분석
│   │   │   │   └── UserMediaController.java        # 프로필 이미지
│   │   │   ├── product/                     # 상품 관련
│   │   │   │   ├── ProductController.java          # 상품 조회/검색
│   │   │   │   └── AdminProductController.java      # 관리자 상품 관리
│   │   │   ├── orderpay/                    # 주문/결제 관련
│   │   │   │   ├── OrderController.java            # 주문 관리
│   │   │   │   ├── PaymentController.java          # 결제 (포트원 연동)
│   │   │   │   ├── CartController.java              # 장바구니
│   │   │   │   └── WishlistController.java          # 찜하기
│   │   │   ├── review/                     # 리뷰 관련
│   │   │   │   ├── ReviewController.java            # 리뷰 CRUD
│   │   │   │   └── AdminReviewController.java      # 관리자 리뷰 관리
│   │   │   ├── qna/                       # QnA 관련
│   │   │   │   ├── QnaController.java              # 사용자 QnA
│   │   │   │   └── AdminQnaController.java         # 관리자 QnA 답변
│   │   │   ├── notice/                     # 공지사항
│   │   │   └── faq/                        # FAQ
│   │   ├── service/                # 비즈니스 로직
│   │   │   ├── user/                       # 사용자 서비스
│   │   │   ├── product/                     # 상품 서비스
│   │   │   ├── order/                       # 주문 서비스
│   │   │   ├── pay/                         # 결제 서비스 (포트원)
│   │   │   ├── ai/                          # AI 서비스
│   │   │   └── review/                      # 리뷰 서비스
│   │   ├── repository/              # 데이터 접근 계층
│   │   │   ├── user/
│   │   │   ├── product/
│   │   │   ├── order/
│   │   │   └── review/
│   │   ├── vo/                      # 엔티티 (Value Object)
│   │   │   ├── user/User.java
│   │   │   ├── product/Product.java
│   │   │   ├── order/Order.java
│   │   │   └── review/Review.java
│   │   ├── dto/                     # 데이터 전송 객체
│   │   ├── security/                # JWT 필터 및 유틸
│   │   ├── mail/                    # 이메일 발송
│   │   └── ticket/                  # 임시 코드 (이메일 인증, 비밀번호 재설정)
│   ├── src/main/resources/
│   │   └── application.properties   # 설정 파일
│   └── build.gradle                 # Gradle 의존성
│
├── fittlyreact/                     # React 프론트엔드
│   ├── src/
│   │   ├── pages/                   # 페이지 컴포넌트
│   │   │   ├── MainPage.js                  # 메인 페이지
│   │   │   ├── MyPage.js                    # 마이페이지
│   │   │   ├── auth/                        # 인증 페이지
│   │   │   │   ├── loginUser.js
│   │   │   │   ├── loginAdmin.js
│   │   │   │   ├── signup.js
│   │   │   │   └── verifyEmail.js
│   │   │   ├── ai/                          # AI 기능 페이지
│   │   │   │   ├── AiVisionPage.js
│   │   │   │   └── Aicommend.js
│   │   │   └── admin/                        # 관리자 페이지
│   │   ├── components/               # 재사용 컴포넌트
│   │   │   ├── ProductCard.js
│   │   │   ├── HashtagText.js
│   │   │   └── StatusBadge.js
│   │   ├── contexts/                 # React Context
│   │   │   └── AuthContext.js
│   │   ├── api/                      # API 호출 함수
│   │   │   ├── auth.js
│   │   │   └── ai.js
│   │   ├── cart/                     # 장바구니
│   │   ├── order/                    # 주문
│   │   ├── product/                  # 상품
│   │   ├── review/                   # 리뷰
│   │   ├── qna/                      # QnA
│   │   ├── wishlist/                 # 찜하기
│   │   ├── guards/                   # 라우트 가드
│   │   │   ├── RequireAuth.js
│   │   │   └── PublicOnlyRoute.js
│   │   ├── App.js                    # 라우팅 설정
│   │   └── index.js                  # 진입점
│   ├── public/                       # 정적 파일
│   │   └── images/                   # 이미지 리소스
│   └── package.json                  # NPM 의존성
│
└── uploads/                          # 업로드 파일 저장소
    ├── 2025/                         # 날짜별 업로드 파일
    ├── qna/                          # QnA 첨부파일
    ├── reviews/                      # 리뷰 이미지
    └── user-photos/                  # 사용자 프로필 사진
```

---

## 🔑 주요 기능

### 1. 인증 및 사용자 관리 시스템

#### 인증 기능
- **회원가입**: 이메일 인증 기반 회원가입
  - 이메일 인증 코드 발송 및 검증
  - 프로필 이미지 업로드 지원
  - 비밀번호 BCrypt 해싱
- **로그인**: JWT 토큰 기반 인증
  - 사용자/관리자 분리 로그인
  - 토큰 유효성 검증
- **비밀번호 재설정**: 이메일 기반 비밀번호 재설정
  - 임시 코드 발송 (10분 유효)
  - 일일 발송 제한 (5회)
  - 쿨다운 시간 (60초)
- **ID 찾기**: 이메일로 로그인 ID 조회

#### 사용자 정보 관리
- **프로필 조회/수정**: 내 정보 조회 및 수정
- **배송지 관리**: 배송지 추가/수정/삭제
- **프로필 이미지**: 다중 이미지 업로드 지원

### 2. 상품 관리 시스템

#### 상품 조회
- **최신 상품**: 최신순 상품 목록 조회
- **카테고리별 조회**: 상의/하의/아우터/신발 카테고리 필터링
- **상품 검색**: 키워드 검색 및 태그 기반 검색
- **상품 상세**: 상품 상세 정보 (이미지, 가격, 재고, 변형 옵션)
- **태그 기반 검색**: 해시태그로 상품 검색

#### 관리자 상품 관리
- **상품 등록**: 상품 정보, 이미지, 변형 옵션 등록
- **상품 수정**: 상품 정보 수정
- **상품 삭제**: 상품 비활성화

### 3. AI 추천 시스템

#### AI 비전 분석
- **이미지 업로드**: 사용자 옷 이미지 업로드
- **AI 분석**: OpenAI GPT-4 Vision API를 통한 스타일 분석
- **스타일 추천**: 분석 결과 기반 상품 추천

#### AI 코디 추천
- **사용자 선호도 기반**: 과거 구매 이력, 위시리스트 기반 추천
- **맞춤 코디**: AI가 생성한 코디 추천
- **컨텍스트 저장**: 사용자별 AI 대화 컨텍스트 관리

### 4. 장바구니 및 위시리스트

#### 장바구니
- **상품 추가**: 상품 옵션(색상/사이즈) 선택하여 장바구니 추가
- **수량 조정**: 장바구니 상품 수량 변경
- **상품 삭제**: 장바구니에서 상품 제거
- **주문 후 자동 삭제**: 주문 완료 시 장바구니 자동 비우기

#### 위시리스트
- **찜하기**: 상품 찜하기/찜하기 취소
- **찜 목록 조회**: 찜한 상품 목록 조회

### 5. 주문 및 결제 시스템

#### 주문 관리
- **주문 생성**: 결제 검증 후 주문 생성
- **주문 내역 조회**: 주문 목록 및 상세 내역
- **주문 상태 관리**: 주문 상태 변경 (결제완료, 배송중, 배송완료 등)

#### 결제 시스템
- **포트원(IAMPORT) 연동**: 카드/계좌이체 결제
- **결제 검증**: 서버 측 결제 검증
- **결제 콜백**: 결제 완료 후 주문 생성
- **웹훅**: 포트원 웹훅 처리

### 6. 리뷰 시스템

#### 리뷰 작성
- **구매 후 리뷰**: 구매한 상품에 대한 리뷰 작성
- **이미지 업로드**: 리뷰 이미지 다중 업로드
- **평점**: 1~5점 평점 시스템
- **리뷰 작성 가능 목록**: 작성 가능한 리뷰 조회

#### 리뷰 조회
- **상품별 리뷰**: 상품 상세 페이지 리뷰 목록
- **내 리뷰**: 내가 작성한 리뷰 목록
- **리뷰 필터링**: 평점, 사진 리뷰 필터링

#### 관리자 리뷰 관리
- **리뷰 목록 조회**: 전체 리뷰 목록
- **리뷰 삭제**: 부적절한 리뷰 삭제

### 7. QnA 시스템

#### 사용자 QnA
- **QnA 작성**: 상품 관련 문의 작성
- **주문 연결**: QnA 작성 시 주문 선택 가능
- **이미지 첨부**: 문의 이미지 첨부
- **QnA 목록**: 내가 작성한 QnA 목록

#### 관리자 QnA 관리
- **QnA 목록**: 관리자 QnA 목록 조회
- **답변 작성**: QnA 답변 작성

### 8. 공지사항 및 FAQ

#### 공지사항
- **공지 목록**: 공지사항 목록 조회 (공개)
- **공지 상세**: 공지사항 상세 조회
- **관리자 작성/수정**: 관리자만 공지 작성/수정 가능

#### FAQ
- **FAQ 목록**: FAQ 목록 조회 (공개)
- **FAQ 상세**: FAQ 상세 조회
- **관리자 작성/수정**: 관리자만 FAQ 작성/수정 가능

### 9. 관리자 시스템

#### 사용자 관리
- **사용자 목록**: 전체 사용자 목록 조회
- **사용자 정보 조회**: 사용자 상세 정보

#### 상품 관리
- **상품 등록/수정/삭제**: 상품 CRUD
- **상품 목록 관리**: 상품 목록 조회 및 관리

---

## 🔌 API 통신

### API 서버 설정
- **백엔드 서버**: `http://localhost:8080`
- **프론트엔드 프록시**: `package.json`의 `proxy` 설정으로 `/api` 요청이 백엔드로 전달
- **CORS 설정**: Spring Security에서 `http://localhost:3000` 허용

### 주요 API 엔드포인트

#### 인증 관련 (`/api/auth`)
- `POST /api/auth/signup` - 회원가입
  - Request: `{loginId, email, password, name, phone, ...}`
  - Response: `{success: true, data: {userId, loginId, email}}`
- `POST /api/auth/login` - 로그인
  - Request: `{loginId, password}`
  - Response: `{success: true, data: {token, role, loginId}}`
- `POST /api/auth/user/login` - 사용자 로그인
- `POST /api/auth/admin/login` - 관리자 로그인
- `POST /api/auth/password/forgot` - 비밀번호 재설정 요청
- `POST /api/auth/reset-password` - 비밀번호 재설정
- `GET /api/auth/validate` - 토큰 유효성 검증

#### 상품 관련 (`/api/products`)
- `GET /api/products/latest` - 최신 상품 목록
  - Query: `limit` (기본값: 12)
- `GET /api/products/category/{cat}` - 카테고리별 상품 목록
  - Path: `cat` (all, top, bottom, outer, shoes)
- `GET /api/products/{id}` - 상품 상세 정보
- `GET /api/products/search` - 상품 검색
  - Query: `q` (키워드), `category`, `tags`, `page`, `size`, `sort`

#### AI 관련 (`/api/ai`)
- `POST /api/ai/recommend` - AI 추천 (인증 필요)
  - Request: `{preferences, style, outfitCount}`
  - Response: `{outfits: [...]}`
- `POST /api/ai/public/recommend` - 공개 AI 추천 (인증 불필요)
- `POST /api/ai/vision/analyze` - AI 비전 분석
  - Request: `MultipartFile` (이미지)
  - Response: `{bodyType, styleHints}`

#### 장바구니 관련 (`/api/user/cart`)
- `GET /api/user/cart` - 장바구니 조회
- `POST /api/user/cart` - 장바구니 추가
  - Request: `{productId, color, size, quantity}`
- `PUT /api/user/cart/{id}` - 장바구니 수량 변경
- `DELETE /api/user/cart/{id}` - 장바구니 삭제

#### 주문 관련 (`/api/user/orders`)
- `GET /api/user/orders` - 주문 목록 조회
- `GET /api/user/orders/{orderId}` - 주문 상세 조회

#### 결제 관련 (`/api/pay`)
- `POST /api/pay/verify` - 결제 검증 및 주문 생성
  - Request: `{impUid, merchantUid, amount, products: [...]}`
  - Response: `{success: true, data: OrderResponse}`
- `POST /api/pay/webhook` - 포트원 웹훅 (인증 불필요)

#### 리뷰 관련 (`/api/reviews`)
- `GET /api/reviews` - 리뷰 목록 조회
- `GET /api/reviews/available` - 작성 가능한 리뷰 목록
- `POST /api/reviews` - 리뷰 작성
- `GET /api/reviews/my` - 내 리뷰 목록

#### QnA 관련 (`/api/qna`)
- `GET /api/qna` - QnA 목록 조회
- `POST /api/qna` - QnA 작성
- `GET /api/qna/{id}` - QnA 상세 조회

---

## 📱 화면 구조 및 라우팅

### 라우트 설정 (`App.js`)

```javascript
/                           → MainPage (메인 페이지)
/ai/vision                  → AiVisionPage (AI 비전 분석, 인증 필요)
/ai/commend                 → Aicommend (AI 추천, Lazy Loading)
/my                         → MyPage (마이페이지, 인증 필요)

// 인증 관련
/signup                     → Signup (회원가입)
/verify-email               → VerifyEmail (이메일 인증)
/auth/find-id               → FindId (ID 찾기)
/auth/find-pw               → FindPw (비밀번호 찾기)
/auth/reset-password        → ResetPassword (비밀번호 재설정)
/login/user                 → LoginUser (사용자 로그인)
/login/admin                → LoginAdmin (관리자 로그인)

// 공지사항 및 FAQ
/notice                     → NoticeList (공지사항 목록)
/notice/:id                 → NoticeDetail (공지사항 상세)
/notice/write               → NoticeWrite (공지사항 작성, 관리자만)
/faq                        → FaqList (FAQ 목록)
/faq/:id                    → FaqDetail (FAQ 상세)

// QnA
/qna                        → QnA (QnA 목록, 인증 필요)
/qna/write                  → QnaWrite (QnA 작성)
/qna/:id                    → QnaDetail (QnA 상세)
/admin/qna                  → AdminQnaList (관리자 QnA 목록)

// 상품 관련
/products/:id               → ProductDetailPage (상품 상세)
/category/:cat              → CategoryPage (카테고리별 상품)
/search                     → SearchResultsPage (검색 결과)

// 장바구니 및 위시리스트
/cart                       → CartPage (장바구니, 인증 필요)
/wishlist                   → WishlistPage (위시리스트, 인증 필요)

// 주문 및 결제
/payment                    → PaymentPage (결제 페이지, 인증 필요)
/payment/success            → PaymentSuccessPage (결제 완료)
/orders                     → OrderHistoryPage (주문 내역, 인증 필요)
/orders/:orderId            → OrderDetailPage (주문 상세)

// 관리자
/admin                      → AdminProductHub (관리자 홈)
/admin/products/hub         → AdminProductHub
/admin/products/manage      → ManageProductsPage (상품 관리)
/admin/products/:id/edit    → AdminProductEditPage (상품 수정)
/admin/users                → AdminUserList (사용자 관리)
/admin/reviews              → AdminReviewList (리뷰 관리)
```

### 라우트 가드

- **RequireAuth**: 인증 필요 (로그인 필수)
  - `role="ROLE_ADMIN"`: 관리자 권한 필요
- **PublicOnlyRoute**: 비로그인 사용자만 접근 (로그인 시 리다이렉트)

---

## 🎨 UI/UX 특징

### 디자인 시스템
- **주요 색상**: 파란색 계열 (Accent Blue)
- **아이콘**: Font Awesome 7
- **레이아웃**: 반응형 디자인 (모바일/태블릿/데스크톱)
- **컴포넌트**: 재사용 가능한 컴포넌트 구조

### 주요 UI 컴포넌트
- **TopHeader**: 상단 헤더 (로그인/회원가입, 장바구니, 검색)
- **Footer**: 하단 푸터
- **ProductCard**: 상품 카드 컴포넌트
- **StatusBadge**: 상태 배지 (주문 상태, 상품 상태)
- **HashtagText**: 해시태그 링크 처리

### 주요 페이지 스타일
- **메인 페이지**: 히어로 배너, 카테고리 필터, 상품 그리드
- **상품 상세**: 상품 이미지 갤러리, 옵션 선택, 리뷰 섹션
- **장바구니**: 테이블 형태 상품 목록, 수량 조정
- **결제 페이지**: 주문 정보, 배송지 선택, 결제 수단 선택

---

## 📊 데이터 구조

### 주요 엔티티 (VO)

#### User (사용자)
```java
{
  id: Long,                    // 사용자 ID
  loginId: String,             // 로그인 ID (고유)
  password: String,             // BCrypt 해시
  email: String,                // 이메일 (고유)
  name: String,                 // 이름
  phone: String,                // 전화번호
  role: String,                // 권한 (ROLE_USER, ROLE_ADMIN)
  emailVerified: boolean,      // 이메일 인증 여부
  createdAt: LocalDateTime,    // 생성일시
  updatedAt: LocalDateTime     // 수정일시
}
```

#### Product (상품)
```java
{
  id: Long,                    // 상품 ID
  productCode: String,         // 상품 코드 (12자리, 고유)
  name: String,                // 상품명
  brand: String,               // 브랜드
  category: ProductCategory,  // 카테고리 (N:1)
  price: int,                  // 정가
  discountPrice: Integer,     // 할인가
  discountRate: Integer,      // 할인율
  stock: int,                  // 재고
  status: ProductStatus,        // 상태 (SALE, SOLD_OUT, HIDDEN)
  description: String,         // 상품 설명
  thumbnailUrl: String,        // 썸네일 이미지 URL
  imageUrls: String,           // 이미지 URL 리스트 (JSON)
  tags: String,                 // 태그 (콤마 구분)
  variants: List<ProductVariant>, // 변형 상품 (색상/사이즈)
  salesCount: int,             // 판매 수량
  reviewCount: int,           // 리뷰 수
  averageRating: BigDecimal    // 평균 평점
}
```

#### Order (주문)
```java
{
  id: Long,                    // 주문 ID
  user: User,                  // 주문자 (N:1)
  orderNumber: String,         // 주문 번호 (고유)
  totalAmount: int,            // 총 주문 금액
  shippingFee: int,             // 배송비
  status: OrderStatus,          // 주문 상태
  orderItems: List<OrderItem>, // 주문 상품 목록
  payAddress: PayAddress,      // 배송지 정보
  createdAt: LocalDateTime     // 주문일시
}
```

#### Review (리뷰)
```java
{
  id: Long,                    // 리뷰 ID
  user: User,                  // 작성자 (N:1)
  product: Product,            // 상품 (N:1)
  orderItem: OrderItem,        // 주문 상품 (N:1)
  rating: int,                 // 평점 (1~5)
  content: String,             // 리뷰 내용
  images: List<ReviewImage>,   // 리뷰 이미지
  createdAt: LocalDateTime     // 작성일시
}
```

---

## 🔐 보안 기능

### 인증 및 보안
- **JWT 토큰**: 로그인 후 JWT 토큰 발급
  - 토큰 유효기간: 604800000ms (7일)
  - Secret Key: 32바이트 Base64 인코딩
- **비밀번호 해싱**: BCrypt 암호화
- **토큰 검증**: `JwtAuthFilter`에서 모든 요청 토큰 검증
- **권한 기반 접근 제어**: Spring Security `@PreAuthorize` 사용

### API 보안
- **CORS 설정**: 허용된 Origin만 접근 가능
- **CSRF 비활성화**: JWT 기반이므로 CSRF 불필요
- **세션 비활성화**: STATELESS 세션 정책
- **인증/인가 분리**: 공개 API와 인증 필요 API 분리

### 데이터 보호
- **SQL Injection 방지**: JPA 사용으로 자동 방지
- **XSS 방지**: 입력 데이터 검증 및 이스케이프
- **파일 업로드 제한**: 최대 파일 크기 10MB
- **이메일 인증**: 회원가입 시 이메일 인증 필수

---

## 📝 주요 기능 상세

### 이메일 인증 시스템
- **인증 코드 생성**: 6자리 숫자 코드
- **유효기간**: 10분
- **일일 발송 제한**: 50회
- **쿨다운 시간**: 10초
- **메일 발송**: SMTP (Gmail)

### 비밀번호 재설정 시스템
- **임시 코드 생성**: 비밀번호 재설정용 코드
- **유효기간**: 10분
- **일일 발송 제한**: 5회
- **쿨다운 시간**: 60초
- **최대 시도 횟수**: 5회

### 결제 검증 프로세스
1. 프론트엔드에서 포트원 결제 요청
2. 결제 완료 후 `imp_uid` 전달
3. 백엔드에서 포트원 API로 결제 검증
4. 검증 성공 시 주문 생성
5. 장바구니 자동 삭제

### AI 추천 로직
- **사용자 컨텍스트 기반**: 과거 구매 이력, 위시리스트 분석
- **스타일 분석**: OpenAI Vision API로 이미지 분석
- **맞춤 추천**: 분석 결과 기반 상품 추천

---

## 🚧 개발 상태 및 미구현 기능

### 완전 구현된 기능
- ✅ 사용자 인증 (회원가입, 로그인, 비밀번호 재설정)
- ✅ 상품 관리 (CRUD, 검색, 카테고리 필터링)
- ✅ 장바구니 및 위시리스트
- ✅ 주문 및 결제 (포트원 연동)
- ✅ 리뷰 시스템
- ✅ QnA 시스템
- ✅ 공지사항 및 FAQ
- ✅ AI 비전 분석 및 추천
- ✅ 관리자 시스템

### 부분 구현된 기능
- ⚠️ AI 추천 고도화 (현재 기본 추천 로직만 구현)
- ⚠️ 리뷰 필터링 (기본 필터링만 구현)
- ⚠️ 상품 검색 (태그 검색은 기본 구현)

### 향후 개선 사항
- ❌ 소셜 로그인 (카카오, 네이버)
- ❌ 배송 추적 시스템
- ❌ 알림 시스템 (이메일/푸시 알림)
- ❌ 통계 및 분석 대시보드
- ❌ 쿠폰/할인 시스템
- ❌ 재고 관리 자동화

---

## 🛠️ 개발 환경 설정

### 필수 요구사항
- **Java**: JDK 17
- **Node.js**: 18+ (프론트엔드)
- **MySQL**: 8.0+
- **Gradle**: Wrapper 포함 (프로젝트 내)
- **IDE**: IntelliJ IDEA, VS Code, Eclipse (선택)

### 백엔드 실행 방법

1. **데이터베이스 설정**
   ```properties
   # application.properties
   spring.datasource.url=jdbc:mysql://localhost:3306/fit
   spring.datasource.username=root
   spring.datasource.password=1111
   ```

2. **의존성 설치 및 실행**
   ```bash
   cd fittly
   ./gradlew bootRun
   # 또는
   ./gradlew build
   java -jar build/libs/fittly-0.0.1-SNAPSHOT.jar
   ```

3. **환경 변수 설정** (선택)
   - `DB_POOL_MAX`: DB 커넥션 풀 최대 크기 (기본값: 10)
   - `FRONTEND_BASE`: 프론트엔드 URL (기본값: http://localhost:3000)
   - `OPENAI_API_KEY`: OpenAI API 키 (필수)

### 프론트엔드 실행 방법

1. **의존성 설치**
   ```bash
   cd fittlyreact
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm start
   # 기본 포트: 3000 (Windows에서는 package.json의 PORT=80 설정)
   ```

3. **프로덕션 빌드**
   ```bash
   npm run build
   # build/ 폴더에 빌드 결과물 생성
   ```

### 환경 변수 설정

#### 백엔드 (`application.properties`)
```properties
# 데이터베이스
spring.datasource.url=jdbc:mysql://localhost:3306/fit
spring.datasource.username=root
spring.datasource.password=1111

# JWT
app.jwt.secret=VGhpcy1pcy1qd3Qtc2VjcmV0LWZvci1GaXR0bHktQXV0aC0zMi1ieXRl
app.jwt.access-token-validity-ms=604800000

# OpenAI
openai.api.key=sk-proj-...
openai.model.vision=gpt-4o-mini

# 포트원 결제
app.payment.imp-code=imp18456832
app.payment.api-key=1644442100421586
app.payment.api-secret=...

# 메일
spring.mail.host=smtp.gmail.com
spring.mail.username=...
spring.mail.password=...

# 업로드 디렉터리
fittly.upload-dir=C:/uploads
```

#### 프론트엔드 (환경 변수)
- `REACT_APP_API_BASE`: API 서버 URL (기본값: http://localhost:8080)

---

## 📦 에셋 리소스

### 이미지 파일
- `public/images/logo.png` - 로고
- `public/images/banner1.png`, `banner2.png`, `banner3.png` - 메인 배너
- `public/images/hero.jpg` - 히어로 이미지
- `public/images/placeholder.png` - 상품 이미지 플레이스홀더
- `public/images/user-placeholder.png` - 사용자 프로필 플레이스홀더

### 업로드 파일 구조
- `uploads/2025/09/`, `uploads/2025/10/` - 날짜별 업로드 파일
- `uploads/qna/` - QnA 첨부파일
- `uploads/reviews/` - 리뷰 이미지
- `uploads/user-photos/` - 사용자 프로필 사진

---

## 🔄 향후 개선 사항

### 권장 개선 사항
1. **보안 강화**
   - API 키 환경 변수화 (하드코딩 제거)
   - Rate Limiting 적용
   - 입력 데이터 검증 강화

2. **성능 최적화**
   - 이미지 CDN 연동
   - 데이터베이스 인덱싱 최적화
   - 캐싱 전략 (Redis 도입)

3. **기능 개선**
   - 소셜 로그인 (카카오, 네이버)
   - 배송 추적 시스템
   - 알림 시스템 (이메일/푸시)
   - 쿠폰/할인 시스템

4. **사용자 경험 개선**
   - 반응형 디자인 고도화
   - 로딩 상태 개선
   - 에러 처리 강화

5. **코드 품질**
   - 테스트 코드 작성 (JUnit, React Testing Library)
   - 코드 리팩토링 (중복 코드 제거)
   - 문서화 강화

6. **인프라 개선**
   - Docker 컨테이너화
   - CI/CD 파이프라인 구축
   - 모니터링 시스템 도입

---

## 📄 라이선스 및 기타

- **프로젝트 타입**: 상업용 E-Commerce 플랫폼
- **배포 상태**: 개발 중
- **버전 관리**: Git (GitHub)
- **저장소**: https://github.com/jay0803/fittly.git

---

## 📞 연락처 및 참고

- **프로젝트명**: Fittly
- **프로젝트 설명**: AI 기반 패션 E-Commerce 플랫폼
- **백엔드 포트**: 8080
- **프론트엔드 포트**: 3000 (개발), 80 (Windows 설정)

---

**문서 생성일**: 2025년 1월  
**마지막 업데이트**: 프로젝트 분석 기준  
**버전**: 1.0.0

