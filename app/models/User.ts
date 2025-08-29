// import mongoose, { Document, Schema } from "mongoose";
// import bcrypt from "bcryptjs";

// export interface IUser extends Document {
//   name: string;
//   email: string;
//   password: string;
//   role: "customer" | "admin" | "staff";
//   createdAt: Date;
//   comparePassword(candidatePassword: string): Promise<boolean>;
// }

// const userSchema: Schema = new Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: ["customer", "admin", "staff"],
//       default: "customer",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// userSchema.methods.comparePassword = async function (
//   candidatePassword: string
// ): Promise<boolean> {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// export default mongoose.model<IUser>("User", userSchema);
