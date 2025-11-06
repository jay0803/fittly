## Fittly Monorepo

세 개의 폴더를 하나의 저장소로 통합했습니다. 루트는 모노레포이며, 백엔드(Spring Boot), 프론트엔드(React), 업로드 자산 디렉터리로 구성됩니다.

- `fittly/` — Spring Boot 3.5 (Java 17) 기반 백엔드
- `fittlyreact/` — Create React App 기반 프론트엔드
- `uploads/` — 이미지/첨부 파일 저장 디렉터리 (운영·개발 공통 경로)


### 빠른 시작

- 백엔드
  - JDK 17, Gradle Wrapper 사용
  - 포트: 기본 8080
  - 실행:
    ```bash
    cd fittly
    ./gradlew bootRun
    ```
  - 빌드(JAR):
    ```bash
    cd fittly
    ./gradlew bootJar
    ```

- 프론트엔드
  - Node.js 18+ 권장
  - 개발 서버 실행:
    ```bash
    cd fittlyreact
    npm install
    npm start
    ```
    기본 스크립트가 Windows에서 `PORT=80`을 사용하도록 설정되어 있습니다. 80포트 사용에 문제가 있으면 `package.json`의 `start` 스크립트를 `react-scripts start`로 변경하거나 환경변수로 다른 포트를 지정하세요.
  - 프로덕션 빌드:
    ```bash
    cd fittlyreact
    npm run build
    ```


### 백엔드 개요 (`fittly/`)

- 빌드 도구: Gradle
- 주요 의존성
  - Spring Web, Security, Data JPA, Validation, Mail
  - MySQL Connector/J
  - JJWT (토큰), OpenAI Java SDK
- Java 17 Toolchain 사용
- 테스트: JUnit Platform

환경설정은 `src/main/resources/application.properties`에서 관리합니다. 민감한 값(데이터베이스, 메일, 결제, OpenAI 키 등)은 운영 환경에서 환경변수/외부 설정으로 치환하세요.

주요 프로퍼티(예시 — 값은 환경에 맞게 설정 필요)
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://<HOST>:<PORT>/<DB>?...
spring.datasource.username=<USER>
spring.datasource.password=<PASSWORD>

spring.jpa.hibernate.ddl-auto=update
spring.web.cors.allowed-origin-patterns=http://localhost,http://localhost:3000

fittly.upload-dir=C:/uploads

# 앱 프론트엔드 베이스 URL
FRONTEND_BASE=https://staging.fittly.team

# 결제/메일/JWT/OpenAI 등 민감정보는 환경변수로 주입 권장
APP_JWT_SECRET=...
OPENAI_API_KEY=...
SPRING_MAIL_USERNAME=...
SPRING_MAIL_PASSWORD=...
```

실제 배포에서는 `application.properties`의 민감한 상수 값을 제거하고, 동일 키를 환경변수 또는 프로필별 설정으로 주입하는 방식을 권장합니다.


### 프론트엔드 개요 (`fittlyreact/`)

- CRA(Create React App) 기반
- 주요 라이브러리: React 19, React Router DOM 7, Axios 등
- 개발 프록시: `package.json`의 `proxy`가 `http://localhost:8080`으로 설정되어 있어, 프론트에서 백엔드로 API 호출 시 CORS 우회를 돕습니다.

라우팅 예시(`src/routes.js`): 루트(`/`), 인증 필요 경로(`/ai/vision`) 및 와일드카드 리다이렉션 구성.


### 업로드 디렉터리 (`uploads/`)

- 사용자 업로드 자산(상품/리뷰/QnA/프로필 등) 저장소
- 로컬 개발 시 경로를 OS에 맞게 조정 가능 (`fittly`의 `fittly.upload-dir` 프로퍼티)
- 저장소에 정적 자산으로 포함되어 있으므로, 필요 시 Git LFS 또는 외부 스토리지로 이전을 고려하세요.


### 개발 편의 스니펫

- 백엔드 테스트 실행
  ```bash
  cd fittly
  ./gradlew test
  ```

- 프론트엔드 환경 변수
  - CRA 규칙에 따라 브라우저로 노출될 변수는 `REACT_APP_` 접두어 필요
  - 예: `REACT_APP_API_BASE`, `REACT_APP_ENABLE_VISION`


### 배포 가이드(개요)

- 백엔드: JAR 빌드 후 JVM 런타임(예: Temurin 17)에서 실행. MySQL, 메일, 외부 API 키 환경변수 세팅 필요.
- 프론트엔드: `npm run build` 결과물을 정적 호스팅(Nginx/S3+CloudFront 등)에 배포.
- 정적 자산: `uploads/`는 외부 스토리지로 이전 및 CDN 연동을 권장.


### 프로젝트 구조

```
.
├─ fittly/          # Spring Boot 백엔드
├─ fittlyreact/     # React 프론트엔드
└─ uploads/         # 업로드 자산(이미지 등)
```


### 라이선스

사내/개인 프로젝트 전제로, 별도 라이선스 파일이 없는 경우 기본적으로 비공개 사용을 가정합니다. 공개 전환 시 라이선스 명시를 권장합니다.


