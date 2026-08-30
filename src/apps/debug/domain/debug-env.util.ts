// /debug 라우터를 마운트해도 되는 환경인지 판단하는 순수 함수.
// 프로덕션(NODE_ENV=production)에서는 절대 마운트하지 않음 —
// 전체 데이터 삭제(/debug/reset)가 인증 없이 열리는 걸 막기 위함.
export function shouldMountDebugRoutes(nodeEnv: string | undefined): boolean {
  return nodeEnv !== 'production';
}
