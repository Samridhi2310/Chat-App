// middleware/auth.js
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET; 

export function verifyToken(req, res, next) {
  // 1) Extract token from cookies
  const token = req.cookies.token; 
  console.log("Cookies:", req.cookies);

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // 2) Verify the token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    // 3) Attach decoded payload (e.g., { userId, iat, exp }) to req.user
    req.user = decoded; 
    next();
  });
}
