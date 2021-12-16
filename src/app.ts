import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
const tourRouter = require("./routes/tourRouter");
const app = express();

app.use(cors());
app.use(morgan("combined"));
app.use(helmet()); // To enhance api security
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use("/api/v1/tours", tourRouter);

module.exports = app;
