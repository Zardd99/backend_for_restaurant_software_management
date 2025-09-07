import { BaseOperation } from "./baseOperation";
import MenuItem from "../../models/MenuItem";
import { menuItemsData } from "../data/menuItems";
import { validateMenuItems, checkForDuplicates } from "../utils/validation";
import { MenuItemData } from "../types";
import mongoose from "mongoose";

export const insertMenuItems = async (
  filePath?: string,
  dataString?: string
): Promise<void> => {
  const operation = new InsertOperation();
  await operation.execute(filePath, dataString);
};

class InsertOperation extends BaseOperation {
  constructor() {
    super("InsertOperation");
  }

  async execute(filePath?: string, dataString?: string): Promise<void> {
    await this.executeOperation(async () => {
      let data: MenuItemData[];

      if (filePath) {
        data = await this.loadDataFromFile(filePath);
      } else {
        data = this.loadData(dataString, menuItemsData);
      }

      if (data.length === 0) {
        this.logger.warn("No data provided for insertion");
        return;
      }

      validateMenuItems(data);

      // Check for duplicates and only insert new items
      const { newItems, duplicates } = await this.filterDuplicates(data);

      if (duplicates.length > 0) {
        this.logger.warn(`Skipping ${duplicates.length} duplicate items`);
        duplicates.forEach((duplicate) => {
          this.logger.debug(`Duplicate: ${duplicate.name}`);
        });
      }

      if (newItems.length === 0) {
        this.logger.warn("No new items to insert");
        return;
      }

      const result = await MenuItem.insertMany(newItems, { ordered: false });

      this.logger.info(`Inserted ${result.length} new menu items`);
      this.logger.info(`Skipped ${duplicates.length} duplicate items`);

      return {
        inserted: result,
        skipped: duplicates,
      };
    });
  }

  private async filterDuplicates(
    data: MenuItemData[]
  ): Promise<{ newItems: MenuItemData[]; duplicates: MenuItemData[] }> {
    return await checkForDuplicates(data, MenuItem as any, "name");
  }
}
