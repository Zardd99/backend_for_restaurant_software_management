import { BaseOperation } from "./baseOperation";
import MenuItem from "../../models/MenuItem";
import { validateMenuItems } from "../utils/validation";
import { MenuItemData } from "../types";
import mongoose from "mongoose";

export const updateMenuItems = async (
  filePath?: string,
  dataString?: string
): Promise<void> => {
  const operation = new UpdateOperation();
  await operation.execute(filePath, dataString);
};

class UpdateOperation extends BaseOperation {
  constructor() {
    super("UpdateOperation");
  }

  async execute(filePath?: string, dataString?: string): Promise<void> {
    await this.executeOperation(async () => {
      let data: MenuItemData[];

      if (filePath) {
        data = await this.loadDataFromFile(filePath);
      } else {
        data = this.loadData(dataString, []);
      }

      if (data.length === 0) {
        this.logger.warn("No data provided for update");
        return;
      }

      validateMenuItems(data);

      const updateOperations = data.map(async (item) => {
        if (!item._id) {
          throw new Error("Missing _id field for update operation");
        }

        const { _id, ...updateData } = item;
        const result = await MenuItem.findByIdAndUpdate(
          _id,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        if (!result) {
          this.logger.warn(`Item with ID ${_id} not found`);
        }

        return result;
      });

      const results = await Promise.all(updateOperations);
      const successfulUpdates = results.filter((result) => result !== null);

      this.logger.info(`Updated ${successfulUpdates.length} menu items`);
      return successfulUpdates;
    });
  }
}
