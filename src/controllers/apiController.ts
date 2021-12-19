import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";


export class APIController {
  /**
   * the main endpoint for this API
   */

  protected mainEndPoint: string

  /**
   * A map containing all endpoints of this API
   */

  endpoints: any
  /**
   * Express Object
   */

  private app: any

  /**
   * Express Router
   */
  
  private router: any

  /**
   * Initialzes the APIController Class
   * @param {string} endpoint 
   */

  constructor(endpoint: string ) {
    if (!endpoint) throw new Error("APIController can not be initialized without a main endoint!")
    this.mainEndPoint = endpoint
    this.endpoints = new Map();
    this.app = express();
    this.router = express.Router();
  }

  /**
   * Adds some middlewares for the API Security
   */

  private CreateMainEndPoint() {
    this.app.use(morgan("short"));
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(this.mainEndPoint, this.router)
  }


  /**
   * Adds an enhdpoint to the API
   * @param {string} endpoint 
   * @param {string} method 
   * @param {function} callback 
   */

  AddEndPoint(endpoint: string, method: string, callback: (req: any, res: any) => void) {
      this.endpoints.set(endpoint, callback)
      this.router.route(endpoint)[method](callback)
  }


  /**
   * Starts the Server!
   */

  StartServer() {
    this.CreateMainEndPoint()
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
    console.log(`API is running on localhost:${port}/${this.mainEndPoint}`);
   });
  }

}