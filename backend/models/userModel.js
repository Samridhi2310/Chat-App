// models/User.js

import mongoose from "mongoose";

// Define schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
password: {
  type: String,
  required: true,
  minlength: 8,
  maxlength: 128,
  match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
},
email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
},
gender:{
    type:String,
    required:true
}
});

// Create and export model
const User = mongoose.model("User", userSchema);
export default User;
