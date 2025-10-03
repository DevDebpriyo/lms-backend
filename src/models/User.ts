// src/models/User.ts
import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  avatar?: string;
  refreshToken?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'parent', 'principal', 'superadmin'],
      default: 'student',
    },
    avatar: { type: String },
    refreshToken: { type: String }, // stored for refresh flow
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (!user.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  const user = this as IUser;
  return bcrypt.compare(candidate, user.password);
};

export default model<IUser>('User', UserSchema);
