import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { receiptsRouter } from "./apps/receipts/entry-points/api/receipts.routes.js";
import { categoriesRouter } from "./apps/categories/entry-points/api/categories.routes.js";
import { debugRouter } from "./apps/debug/entry-points/api/debug.routes.js";
import { shouldMountDebugRoutes } from "./apps/debug/domain/debug-env.util.js";
import { swaggerSpec } from "./libraries/swagger.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/receipts", receiptsRouter);
app.use("/categories", categoriesRouter);

// /debug 는 로컬/개발 전용 — 프로덕션(NODE_ENV=production)에서는 라우터 자체를 마운트하지 않음.
// (전체 데이터 삭제 API를 인증 없이 배포 서버에 열어두지 않기 위함)
if (shouldMountDebugRoutes(process.env.NODE_ENV)) {
  app.use("/debug", debugRouter);
}

app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 예상 못한 에러(500)는 항상 이 핸들러를 거침 — NODE_ENV 설정 여부와 무관하게
// 스택트레이스/에러 상세를 응답에 절대 노출하지 않고 서버 로그에만 남김.
// (express-async-errors 없이도 Express 5는 async 핸들러의 reject를 자동으로 여기로 넘겨줌)
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);
