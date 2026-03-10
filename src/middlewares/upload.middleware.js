const multer = require('multer');

// Configuramos multer para que guarde el archivo en la memoria del servidor
// (RAM) temporalmente en lugar del disco duro, ideal para Cloudinary.
const storage = multer.memoryStorage();

// Filtro opcional para asegurar que solo suban imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen. Por favor sube un formato válido (jpg, png, etc).'), false);
    }
};

const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB por archivo
    }
});

module.exports = uploadMiddleware;
