# API-Tools-TS

A modern, type-safe, light-weight library to help you create APIs quickly using Express.js, written in TypeScript.

[![npm version](https://badge.fury.io/js/api-tools-ts.svg)](https://www.npmjs.com/package/api-tools-ts)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## 🚀 Features

-   **Type-safe**: Full TypeScript support with comprehensive type definitions
-   **Easy to use**: Simplified Express.js API for beginners
-   **Flexible**: Support for middleware, parameter validation, and bulk route registration
-   **Modern**: Promise-based with async/await support
-   **Secure**: Built-in security middlewares (helmet, cors)
-   **Configurable**: Extensive configuration options

## 📦 Installation

```bash
npm install api-tools-ts
```

## 🏃‍♂️ Quick Start

### TypeScript

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1", {
  port: 3000,
  useDefaultMiddlewares: true
});

api.addEndpoint("/", "get", (req, res) => {
  res.json({ message: "Hello World!" });
});

await api.startServer();
```

### JavaScript

```js
const { APIController } = require("api-tools-ts");

const api = new APIController("/api/v1");

api.addEndpoint("/", "get", (req, res) => {
  res.json({ message: "Hello World!" });
});

api.startServer();
```

## 📖 Examples

### Basic API with Multiple Endpoints

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

// Simple GET endpoint
api.addEndpoint("/", "get", (req, res) => {
  res.json({ message: "Welcome to the API!" });
});

// Parameterized endpoint
api.addEndpoint("/users/:id", "get", (req, res) => {
  const userId = req.params.id;
  res.json({ userId, message: `User ${userId} profile` });
});

await api.startServer();
```

### Multiple HTTP Methods on Single Endpoint

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

const getUsers = (req, res) => {
  res.json({ users: [], message: "All users" });
};

const createUser = (req, res) => {
  res.status(201).json({ message: "User created", user: req.body });
};

const deleteUser = (req, res) => {
  res.json({ message: "User deleted" });
};

api.addMultipleMethods("/users", ["get", "post", "delete"], [getUsers, createUser, deleteUser]);

await api.startServer();
```

### Bulk Route Registration

```ts
import { APIController, RouteDefinition } from "api-tools-ts";

const api = new APIController("/api/v1");

const routes: RouteDefinition[] = [
  {
    path: "/users",
    method: "get",
    handler: (req, res) => res.json({ users: [] })
  },
  {
    path: "/users",
    method: "post",
    handler: (req, res) => res.status(201).json({ user: req.body })
  },
  {
    path: "/health",
    method: ["get", "head"],
    handler: [(req, res) => res.json({ status: "ok" }), (req, res) => res.status(200).end()]
  }
];

api.addRoutes(routes);
await api.startServer();
```

### Custom Middlewares

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

// Add custom middleware
api.addMiddleware("logger", (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add authentication middleware
api.addMiddleware("auth", (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Token required" });
  }
  next();
});

api.addEndpoint("/protected", "get", (req, res) => {
  res.json({ message: "This is a protected route" });
});

await api.startServer();
```

### Parameter Validation

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

// Add parameter validation
api.addParamChecker("id", (req, res, next, value) => {
  const id = parseInt(value);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ID parameter" });
  }
  req.params.id = id.toString(); // Normalize the parameter
  next();
});

api.addEndpoint("/users/:id", "get", (req, res) => {
  res.json({ userId: req.params.id, message: "Valid user ID" });
});

await api.startServer();
```

### Advanced Configuration

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1", {
  port: 8080,
  hostname: "0.0.0.0",
  useDefaultMiddlewares: true,
  cors: {
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    credentials: true
  },
  helmet: {
    contentSecurityPolicy: false
  },
  morgan: "combined",
  jsonLimit: "50mb"
});

await api.startServer();
```

### Error Handling

```ts
import { APIController, ControllerErrors, Errors } from "api-tools-ts";

const api = new APIController("/api/v1");

api.addEndpoint("/error-demo", "get", (req, res) => {
  // The library will automatically handle ControllerErrors
  throw new ControllerErrors("Something went wrong", Errors.CONTROLLER_ERROR, {
    timestamp: Date.now(),
    endpoint: "/error-demo"
  });
});

await api.startServer();
```

### Server Lifecycle Management

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

api.addEndpoint("/", "get", (req, res) => {
  res.json({ message: "Hello World!" });
});

// Start the server
await api.startServer();

// Get server information
console.log(api.getServerInfo());
// Output: { port: 3000, hostname: 'localhost', mainEndPoint: '/api/v1', isRunning: true }

// Check active connections
console.log(`Active connections: ${api.getActiveConnections()}`);

// Gracefully stop the server
await api.stopServer();

// Restart the server
await api.restartServer();

// Force stop (for emergencies)
api.forceStopServer();
```

### Graceful Shutdown in Production

```ts
import { APIController } from "api-tools-ts";

const api = new APIController("/api/v1");

// Set up your routes
api.addEndpoint("/", "get", (req, res) => {
  res.json({ message: "API is running" });
});

await api.startServer();

// Handle graceful shutdown on process signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await api.stopServer();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await api.stopServer();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
```

## 🔧 API Reference

### Constructor

```ts
new APIController(endpoint: string, config?: APIControllerConfig)
```

#### APIControllerConfig

```ts
interface APIControllerConfig {
  port?: number;                    // Default: 3000
  hostname?: string;                // Default: 'localhost'
  useDefaultMiddlewares?: boolean;  // Default: true
  cors?: cors.CorsOptions;          // CORS configuration
  helmet?: HelmetOptions;           // Helmet configuration
  morgan?: string | FormatFn;       // Morgan logging format
  jsonLimit?: string;               // JSON payload limit
  urlEncodedLimit?: string;         // URL encoded payload limit
}
```

### Methods

#### Modern API (Recommended)

-   `addEndpoint(path, method, callback, middlewares?)` - Add a single endpoint
-   `addMultipleMethods(path, methods, callbacks)` - Add multiple methods to one path
-   `addRoutes(routes)` - Bulk register routes
-   `addMiddleware(id, callback)` - Add middleware
-   `addParamChecker(param, callback)` - Add parameter validation
-   `startServer(config?)` - Start the server
-   `stopServer()` - Stop the server gracefully
-   `forceStopServer()` - Force stop the server immediately
-   `restartServer()` - Restart the server
-   `getServerInfo()` - Get server status
-   `getEndpoints()` - Get all registered endpoints
-   `getActiveConnections()` - Get current connection count

#### Legacy API (Backward Compatible)

-   `AddEndPoint()` - Legacy version of addEndpoint
-   `AddMultipleMethods()` - Legacy version of addMultipleMethods
-   `AddMiddleWare()` - Legacy version of addMiddleware
-   `AddParamChecker()` - Legacy version of addParamChecker

## 🛡️ Default Middlewares

When `useDefaultMiddlewares` is true (default), the following middlewares are automatically applied:

-   **Morgan**: HTTP request logger
-   **Helmet**: Security headers
-   **CORS**: Cross-origin resource sharing
-   **Express.json()**: JSON body parser
-   **Express.urlencoded()**: URL encoded body parser

## 📝 Migration from v1.x

The library maintains backward compatibility, but we recommend migrating to the new API:

```ts
// Old way (still works)
api.AddEndPoint("/users", "get", callback);

// New way (recommended)
api.addEndpoint("/users", "get", callback);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 📊 Changelog

### v2.0.0

-   ✨ Modern async/await API
-   🔒 Improved type safety
-   🛡️ Better error handling
-   📦 Bulk route registration
-   ⚙️ Advanced configuration options
-   🔄 Backward compatibility maintained
