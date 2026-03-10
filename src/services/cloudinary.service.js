const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary (tomará las variables del .env automáticamente si tienen el prefijo CLOUDINARY_URL o si se las pasamos)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryService = {
    /**
     * Sube una imagen a Cloudinary desde un buffer de memoria (usando Multer)
     * @param {Buffer} fileBuffer - El buffer de la imagen
     * @returns {Promise<Object>} - La respuesta de Cloudinary con la URL segura
     */
    async uploadImage(fileBuffer) {
        return new Promise((resolve, reject) => {
            // Si el usuario no ha configurado Cloudinary aún, devolvemos el mock para que no se caiga el sistema
            if (!process.env.CLOUDINARY_CLOUD_NAME) {
                console.warn("[ADVERTENCIA] Cloudinary no está configurado en .env. Usando imagen mock.");
                const timestamp = Date.now();
                return resolve({
                    secure_url: `https://res.cloudinary.com/bizbazar/image/upload/v${timestamp}/mock_image.jpg`,
                    public_id: `bizbazar/mock_${timestamp}`
                });
            }

            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'bizbazar_productos' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            // Escribimos el buffer en el stream de subida
            uploadStream.end(fileBuffer);
        });
    }
};

module.exports = cloudinaryService;
