import { CreateGroup, FetchGroupDetails, LeaveGroup ,AddAdmin,RemoveAdmin} from "../controller/groupController.js";
import express from "express"
import { verifyToken } from "../middleware/middleware.js";
const router=express.Router()
router.get("/fetchGroupDetails",verifyToken,FetchGroupDetails)
router.post("/createGroup",verifyToken,CreateGroup)
router.put("/leaveGroup",verifyToken,LeaveGroup)
router.put("/addAdmin",AddAdmin)
router.put("/removeAdmin",RemoveAdmin)
export default router;