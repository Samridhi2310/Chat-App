import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const userCreate = async (req, res) => {
  const { username, password, email, gender } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const data = await User.create({
      username,
      email,
      password: hashedPassword,
      gender,
    });
    res.status(200).json({ message: "User Added successfully" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "error creating the user", err });
  }
};


export const userLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) 
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) 
      return res.status(401).json({ message: "Invalid credentials" });

    // Sign the JWT
    const token = jwt.sign(
      { userId: user.id, name: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Send cookie with appropriate flags
    res
      .cookie("token", token, {
        httpOnly: true,                          // JS can't read :contentReference[oaicite:2]{index=2}
        secure: false,
        sameSite: "lax",                        
        maxAge: 60 * 60 * 1000,                  // 1 hour
      })
      .status(200)
      .json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};
