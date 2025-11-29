"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existing = await user_model_1.default.findOne({ email });
        if (existing)
            return res.status(400).json({ msg: "User already exists" });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.default.create({ email, password: hashed, name });
        await wallet_model_1.default.create({ userId: user._id });
        res.json({ msg: "Signup success" });
    }
    catch (e) {
        res.status(500).json({ msg: "Error" });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ msg: "No user found" });
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: "Invalid password" });
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        res.json({ token });
    }
    catch (e) {
        res.status(500).json({ msg: "Error" });
    }
};
exports.login = login;
