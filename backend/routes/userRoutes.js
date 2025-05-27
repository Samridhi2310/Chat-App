import { userCreate, userLogin } from "../controller/userController.js";
import express, { Router } from "express";
const router=express.Router()

router.post("/userRegister",userCreate)
router.post("/login",userLogin)
export default router;