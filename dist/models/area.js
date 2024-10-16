"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Area = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const areaSchema = new mongoose_1.default.Schema({
    name: String,
});
exports.Area = mongoose_1.default.model("Area", areaSchema);
