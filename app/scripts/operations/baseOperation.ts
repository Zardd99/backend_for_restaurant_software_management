import { connectDB, disconnectDB } from "../config/db";
import { Logger } from "../utils/logger";
import { handleError } from "../utils/errorHandler";

export abstract class BaseOperation {
  protected logger: Logger;

  constructor(operationName: string) {
    this.logger = new Logger(operationName);
  }

  protected async executeOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      await connectDB();
      this.logger.info("Starting operation...");

      const result = await operation();

      this.logger.info("Operation completed successfully");
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      await disconnectDB();
    }
  }

  protected loadData(data: any, defaultData: any[]): any[] {
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        throw new Error("Invalid JSON data provided");
      }
    }
    return defaultData;
  }

  protected async loadDataFromFile(filePath: string): Promise<any[]> {
    const fs = await import("fs/promises");
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Error reading file ${filePath}: ${error}`);
    }
  }
}
