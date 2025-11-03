import "dotenv/config";

export const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY!,
  PORT: process.env.PORT!,
};
