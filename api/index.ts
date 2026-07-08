import app from "../server/index";
import { assertServerEnv } from "../server/config/env";

assertServerEnv();

export default app;
