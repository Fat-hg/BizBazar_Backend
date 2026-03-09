require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
    logger.info(`API disponible en http://localhost:${PORT}/api`);
});
