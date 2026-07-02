import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const isZodError =
    err != null &&
    typeof err === "object" &&
    "issues" in err &&
    Array.isArray((err as { issues: unknown }).issues);

  if (isZodError) {
    const zodErr = err as {
      issues: Array<{ path: Array<string | number>; message: string }>;
    };
    logger.warn({ err, url: req.url }, "Validation error");
    res.status(400).json({
      error: "Validation failed",
      issues: zodErr.issues.map((i) => ({ path: i.path, message: i.message })),
    });
    return;
  }

  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
