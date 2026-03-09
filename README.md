# BizBazar Backend API

API REST para el sistema de gestión de inventario y ventas BizBazar.

## Stack Tecnológico

- **Node.js** v18+ con Express
- **PostgreSQL** con librería `pg`
- **JavaScript** puro (sin TypeScript)
- Puerto: `3001`
- CORS habilitado para `http://localhost:3000`

## Instalación

```bash
# 1. Clonar el repositorio e ir a la carpeta del backend
cd bizbazar-backend

# 2. Instalar dependencias
npm install

# 3. Copiar archivo de configuración
cp .env.example .env

# 4. Editar .env con tus credenciales de PostgreSQL
# (ver sección Configuración)
```

## Configuración

Editar el archivo `.env` con los datos de tu base de datos PostgreSQL:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bizbazar
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
```

## Ejecutar el Servidor

```bash
# Modo desarrollo (con hot-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3001`

## Endpoints Disponibles

### Health Check
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Verificar que la API está funcionando |

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |

### Lotes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/lotes` | Listar lotes (?estado=activo\|cerrado) |
| GET | `/api/lotes/:id` | Detalle de lote con productos |
| POST | `/api/lotes` | Crear lote |
| PUT | `/api/lotes/:id` | Actualizar lote |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar productos (?categoria=ropa\|joyeria&estado=disponible\|en_subasta\|vendido&search=texto) |
| GET | `/api/productos/:id` | Detalle de producto |
| POST | `/api/productos` | Crear producto |
| PUT | `/api/productos/:id` | Actualizar producto |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ventas` | Listar ventas con items |
| GET | `/api/ventas/:id` | Detalle de venta |
| POST | `/api/ventas` | Crear venta (transaccional) |

### Subastas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/subastas` | Listar subastas (?estado=activa\|finalizada) |
| POST | `/api/subastas` | Crear subasta |
| PUT | `/api/subastas/:id/cerrar` | Cerrar subasta |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | Métricas generales y ventas recientes |

### Reportes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes/diario?fecha=YYYY-MM-DD` | Reporte diario |
| GET | `/api/reportes/inventario` | Estado del inventario |

### Uploads (Mock)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/uploads` | Subir imagen (mock de Cloudinary) |

## Ejemplos de Uso

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bizbazar.com", "password": "123456"}'
```

### Crear un Lote
```bash
curl -X POST http://localhost:3001/api/lotes \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "LOT001",
    "nombre": "Lote Primavera 2024",
    "fecha_compra": "2024-03-01",
    "precio_total": 5000,
    "gastos_adicionales": 500,
    "piezas_total": 50
  }'
```

### Crear un Producto
```bash
curl -X POST http://localhost:3001/api/productos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "PROD001",
    "nombre": "Vestido Floral",
    "descripcion": "Vestido estampado floral talla M",
    "categoria": "ropa",
    "tipo_venta": "directa",
    "lote_id": "UUID_DEL_LOTE",
    "costo_base": 100
  }'
```

### Realizar una Venta
```bash
curl -X POST http://localhost:3001/api/ventas \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_nombre": "María García",
    "items": [
      { "producto_id": "UUID_PRODUCTO_1", "precio_venta": 250 },
      { "producto_id": "UUID_PRODUCTO_2", "precio_venta": 180 }
    ]
  }'
```

### Crear una Subasta
```bash
curl -X POST http://localhost:3001/api/subastas \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": "UUID_DEL_PRODUCTO",
    "precio_inicial": 100,
    "incremento_minimo": 10
  }'
```

### Cerrar una Subasta
```bash
curl -X PUT http://localhost:3001/api/subastas/UUID_SUBASTA/cerrar \
  -H "Content-Type: application/json" \
  -d '{
    "precio_final": 350,
    "ganadora_nombre": "Ana López"
  }'
```

### Consultar Dashboard
```bash
curl http://localhost:3001/api/dashboard
```

### Reporte Diario
```bash
curl "http://localhost:3001/api/reportes/diario?fecha=2024-03-01"
```

### Reporte de Inventario
```bash
curl http://localhost:3001/api/reportes/inventario
```

## Arquitectura

```
bizbazar-backend/
├── server.js              # Entry point
├── src/
│   ├── app.js             # Express app configuration
│   ├── config/
│   │   └── db.js          # PostgreSQL connection pool
│   ├── routes/            # Definición de rutas
│   ├── controllers/       # Validación y coordinación
│   ├── services/          # Lógica de negocio y queries SQL
│   ├── middlewares/       # Auth, CORS, error handling
│   └── utils/             # Utilidades (logger, generador de códigos)
```

## Respuestas de la API

Todas las respuestas siguen el formato:

```json
// Éxito
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Mensaje descriptivo del error"
}
```

## Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa (GET/PUT) |
| 201 | Created - Recurso creado (POST) |
| 400 | Bad Request - Validación fallida |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |
