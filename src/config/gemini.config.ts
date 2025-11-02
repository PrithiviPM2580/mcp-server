import { GoogleGenAI } from "@google/genai";
import { config } from "./env.config.ts";

const ai = new GoogleGenAI({
  apiKey: config.GEMINI_API_KEY,
});

export default ai;
