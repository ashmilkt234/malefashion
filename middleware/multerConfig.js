const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure storage for uploaded product images
const storage = multer.diskStorage({
  // Set the destination folder
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../public/uploads/product-images");
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  // Generate a unique filename for each uploaded file
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // Get file extension
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

// Initialize multer with the defined storage
const uploads = multer({ storage });

module.exports = uploads;
