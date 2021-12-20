# API-Tools-TS

A light-weight library to help you create APIs on the fly using express.js written in TypeScript.

# Motivation

Creating RESTful APIs is not always the easiest, especially when you have a lot of endpoints and functions for each of this endpoints. API-Tools-TS (the name will be changed LOL) provides an easy way to deal with express.js for beginners in more structured way.

# Installation

```
npm i api-tools-ts
```

# Importing

## TypeScript

```ts
import { APIController } from "api-tools-ts";

const api = new APIController(endpoint); // the main endpoint for the api you wish to create
```

## JavaScript

```js
const { APIController } = require("api-tools-ts");
const api = new APIController(endpoint); // the main endpoint for the api you wish to create
```

# Example

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

api.AddEndPoint("/", "get", (req, res) => {
  res.status(200).json({ home: "home is now accessible" });
});
api.AddEndPoint("/:random", "get", (req, res) => {
  const random = req.params.random;
  res.status(200).json({ test: Math.round(Math.random() * Number(random)) });
});

api.startServer("true"); // to apply default middlewares ["cors", "morgan", "helmet"]
```
