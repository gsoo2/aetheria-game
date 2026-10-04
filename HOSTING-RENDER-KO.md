# Render + Neon 무료 호스팅

Cloudflare 계정 없이 게임 전체를 Node 서버로 실행합니다. Render 무료 웹 서비스와 Neon 무료 Postgres 사용량 한도 내에서 실행할 수 있습니다. 아직 실제 서비스·DB 생성 및 접속 주소 발급은 완료되지 않았습니다.

배포 루트는 이 문서·render.yaml·dist·hosting 폴더가 있는 휴대용 게임 폴더입니다. source 폴더를 루트로 올리면 먼저 소스 빌드가 필요합니다. 루트에는 완성된 dist가 포함됩니다.

Render 서비스 설정:
- Node 런타임 / Free 플랜 / 단일 인스턴스
- 빌드: npm ci --prefix hosting --omit=dev
- 시작: node hosting/server.mjs
- 상태 확인: /health
- DATABASE_URL: Neon 연결 문자열 (TLS 포함)
- GM_TOKEN: 임의의 32자 이상 비밀 문자열. render.yaml이 자동 생성하도록 지정했습니다.

Render가 실제로 발급한 onrender.com 주소를 사용합니다. 임의 주소가 예약된 상태는 아닙니다. 무료 서버는 15분간 트래픽이 없으면 잠들고 다음 접속 시 다시 시작하므로 최초 접속이 느릴 수 있습니다. 24시간 무제한 운영을 보장하지 않습니다.

저장: Neon의 aetheria_world 테이블에 서버 전체 상태를 저장합니다. 시작할 때 DB를 먼저 복원하며 로컬 디스크를 저장 원본으로 사용하지 않습니다. HTTP 변경 작업은 저장을 확인한 뒤 응답하며 WebSocket 작업은 비동기로 저장합니다. 접속 중에는 5초마다 추가 저장합니다. 강제 종료 시 마지막 수 초의 변경이 유실될 수 있습니다. 저장 실패 시 /health가 503을 반환하고 추가 요청을 차단합니다. 단일 서버만 DB 잠금을 얻을 수 있습니다. 배포 교체 시 이전 서버 종료 후 새 서버가 시작되어야 합니다.

개인 PC의 기존 saved-game을 온라인 DB로 자동 이전하지 않습니다. 새 주소는 새로운 브라우저 인증 도메인이므로 기존 로컬 캐릭터가 자동 로그인되지 않습니다. 초기 DB에는 새 캐릭터를 만듭니다. 로컬본은 UPDATE-WINDOWS로 기존 저장을 유지합니다.

온라인 GM: GM-CONNECT-WINDOWS.bat에 실제 Render HTTPS 주소와 해당 서버의 GM_TOKEN을 넣으세요. 이후 GM-WINDOWS.bat을 실행합니다. GM 로그인 코드와 서버 GM_TOKEN은 서로 다릅니다. SHOW-ADMIN-WINDOWS.bat은 현재 로컬 GM 로그인 코드만 표시합니다. 비밀 토큰·DB 주소는 소스·ZIP·채팅에 넣지 마세요.

검증: 실제 Node HTTP/WebSocket, 채팅·GM 변경 전파, 외부 저장 인터페이스에 저장 후 새 캐시로 재시작 복원, 저장 실패 상태 확인 통과. 실제 Neon DB 연결·Render 원격 배포는 아직 검증하지 못했습니다.
