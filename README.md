# API-Tools-TS

A light-weight library to help you create APIs on the fly using express.js written in TypeScript.
<br>

## Motivation

Creating RESTful APIs is not always the easiest, especially when you have a lot of endpoints and functions for each of this endpoints. API-Tools-TS (the name will be changed LOL) provides an easy way to deal with express.js for beginners in more structured way.
<br>

## Installation

```
npm i api-tools-ts
```

## Importing

### TypeScript

```ts
import { APIController } from "api-tools-ts";

const api = new APIController(endpoint); // the main endpoint for the api you wish to create
```

### JavaScript

```js
const { APIController } = require("api-tools-ts");
const api = new APIController(endpoint); // the main endpoint for the api you wish to create
```

## Example

### Create an API with 2 different endpoints

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

### Add multiple methods to single endpoint

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

const postUser = (req, res) => {
  res.status(200).json({ status: "ok", message: "User created successfully." });
}

const getUsers = (req, res) => {
  res.status(200).json({ status: "ok", message: "Here are all users" });
}

const deleteUser = (req, res) => {
  res.status(200).json({ status: "ok", message: "User deleted successfully" });
}

api.AddMultipleMethods("/users", ["get", "post", "delete"], [getUsers, postUser, deleteUser] );

api.startServer({useDefaultMiddlewares: 'true'});
```

### Add custom middlewares

```ts

api.AddEndPoint("/user", "get", (req, res) => {
  res.status(200).json({ status: "ok", message: "Here are all users"});
})

api.AddMiddleWare("whatever", (req, res, next) => {
  console.log("I am activated");
  next();
})

api.startServer({useDefaultMiddlewares: 'true'});
```

### API Server port is by default set to 51337. To change it, simply do:

```ts

api.port = <your port>

api.startServer({useDefaultMiddlewares: 'true'});
```

### Method startServer

API-Tools-TS uses by default the following middlewares for better security and stability:

-   morgan
-   helmet
-   cors

If you do not wish to create your api with these milddlewares, set `useDefaultMiddlewares` to false when calling startServer.

```ts
api.startServer({useDefaultMiddlewares: 'false'});

```
