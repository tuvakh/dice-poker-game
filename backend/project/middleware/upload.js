// Use multer in memory mode so uploaded files are available as buffers
// and never written to the server filesystem.
import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({ storage });
