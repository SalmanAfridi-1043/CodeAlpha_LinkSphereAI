const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const fs = require("fs");
const path = require("path");

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloudinary_cloud_name" &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== "your_cloudinary_api_key" &&
  process.env.CLOUDINARY_API_SECRET && 
  process.env.CLOUDINARY_API_SECRET !== "your_cloudinary_api_secret";

let storage;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const isAvatar = file.fieldname === "avatar" || file.fieldname === "coverImage";
      return {
        folder: isAvatar ? "LinkSphereAI/avatars" : "LinkSphereAI/posts",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: isAvatar
          ? [{ width: 500, height: 500, crop: "limit" }]
          : [{ width: 1200, height: 1200, crop: "limit" }],
      };
    },
  });
} else {
  // Local storage fallback
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

const upload = {
  single: (fieldname) => {
    const multerUpload = multer({ storage }).single(fieldname);
    return (req, res, next) => {
      multerUpload(req, res, (err) => {
        if (err) return next(err);
        if (!isCloudinaryConfigured && req.file) {
          const hostUrl = req.protocol + "://" + req.get("host");
          req.file.path = `${hostUrl}/uploads/${req.file.filename}`;
        }
        next();
      });
    };
  },
  fields: (fieldsArray) => {
    const multerUpload = multer({ storage }).fields(fieldsArray);
    return (req, res, next) => {
      multerUpload(req, res, (err) => {
        if (err) return next(err);
        if (!isCloudinaryConfigured && req.files) {
          const hostUrl = req.protocol + "://" + req.get("host");
          for (const key in req.files) {
            req.files[key] = req.files[key].map((file) => {
              file.path = `${hostUrl}/uploads/${file.filename}`;
              return file;
            });
          }
        }
        next();
      });
    };
  },
  array: (fieldname, maxCount) => {
    const multerUpload = multer({ storage }).array(fieldname, maxCount);
    return (req, res, next) => {
      multerUpload(req, res, (err) => {
        if (err) return next(err);
        if (!isCloudinaryConfigured && req.files) {
          const hostUrl = req.protocol + "://" + req.get("host");
          req.files = req.files.map((file) => {
            file.path = `${hostUrl}/uploads/${file.filename}`;
            return file;
          });
        }
        next();
      });
    };
  },
};

module.exports = { cloudinary, upload };
