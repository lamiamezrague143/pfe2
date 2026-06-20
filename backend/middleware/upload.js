const multer = require('multer');

const storage = multer.memoryStorage(); // ✅ plus de disque, tout en RAM puis BDD

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|csv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(file.originalname.toLowerCase());
    if (mimetype || extname) return cb(null, true);
    cb(new Error("Format non autorisé (JPG, PNG, PDF, CSV uniquement)"));
  }
});

module.exports = upload;