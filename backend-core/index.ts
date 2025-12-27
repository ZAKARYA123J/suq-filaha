
import dotenv from "dotenv";

dotenv.config();
import app from './src/app';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});