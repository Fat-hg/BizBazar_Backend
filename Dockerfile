# Usar una imagen oficial de Node.js ligera como base
FROM node:18-alpine

# Crear el directorio de trabajo de la aplicación
WORKDIR /usr/src/app

# Copiar solo el package.json y lock para instalar dependencias
# Esto ayuda a usar la caché de Docker y hacer builds más rápidos
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Exponer el puerto donde corre la API
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["npm", "start"]
