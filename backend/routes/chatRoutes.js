import { CreateChat, fetchChat ,MessageSeen} from "../controller/chatController.js";
import express from "express"
import { verifyToken } from "../middleware/middleware.js";
const router=express.Router();
router.post("/addChat",verifyToken,CreateChat);
router.get("/fetchChats",verifyToken,fetchChat)
router.post("/messageSeen",verifyToken,MessageSeen);
export default router ;