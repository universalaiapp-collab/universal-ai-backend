import express from "express";
import bodyParser from "body-parser";
import orchRouter from "./routes/orch";

const app = express();
app.use(bodyParser.json());

app.post("/orch", orchRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Orchestrator listening on port ${PORT}`);
});
