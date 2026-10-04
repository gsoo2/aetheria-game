# 에테리아 — 별빛의 수호자

PC 퀘스트 접기/펼치기, 하단 NPC 초상화·대사·닫기 UI 개선.

Render 빌드: npm ci --prefix hosting --omit=dev && node hosting/fetch-assets.mjs
시작: node hosting/gateway.mjs

UI와 아트·오디오는 Render에서 제공하고 API/WebSocket은 기존 공개 서버로 전달합니다. 게임 저장과 권한 검증은 기존 서버에서 유지합니다. 새 도메인은 별도의 브라우저 쿠키를 사용합니다. Google OAuth 설정은 별도로 완료해야 합니다.

빌드된 dist 포함. 자산은 빌드 단계에서 SHA-256 검증 후 다운로드합니다. 소스 재빌드는 dist/external/client 자산을 public으로 복사한 후 npm ci 및 npm run build:external.

비밀 키나 플레이어 저장 데이터는 저장소에 포함하지 않습니다.
