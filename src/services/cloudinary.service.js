const cloudinaryService = {
    mockUpload(data) {
        const timestamp = Date.now();
        return {
            url: `https://res.cloudinary.com/bizbazar/image/upload/v${timestamp}/mock_image.jpg`,
            secure_url: `https://res.cloudinary.com/bizbazar/image/upload/v${timestamp}/mock_image.jpg`,
            public_id: `bizbazar/mock_${timestamp}`,
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 125000,
            created_at: new Date().toISOString(),
        };
    },
};

module.exports = cloudinaryService;
