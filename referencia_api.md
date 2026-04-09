# Referencia de la API - BizBazar

Esta es la lista oficial de endpoints, métodos y formatos de datos para que el equipo pueda realizar pruebas.

**Base URL actual (AWS):** `http://34.200.85.73:3001`

---

## 1. Autenticación (`/api/auth`)

### POST `/login`
Inicia sesión en el sistema.
- **Body:**
  ```json
  {
    "email": "admin@bizbazar.com",
    "password": "tu_password"
  }
  ```

### POST `/register`
Registra un nuevo usuario administrador.
- **Body:**
  ```json
  {
    "nombre": "Nombre del Usuario",
    "email": "correo@ejemplo.com",
    "password": "password_seguro_min_8_caracteres"
  }
  ```

---

## 2. Productos (`/api/productos`)

### GET `/`
Lista todos los productos. Soporta filtros: `?categoria=ropa`, `?estado=disponible`, `?search=vestido`.

### POST `/`
Crea un nuevo producto general.
- **Body:**
  ```json
  {
    "codigo": "PROD-001",
    "nombre": "Vestido Azul Mara",
    "categoria": "ropa",
    "tipo_venta": "directa",
    "costo_base": 250.00,
    "descripcion": "Vestido de seda azul"
  }
  ```

### PUT `/:id`
Actualiza un producto existente.
- **Body:** (Envía solo los campos a cambiar)
  ```json
  {
    "nombre": "Nuevo Nombre",
    "costo_base": 300.00
  }
  ```

---

## 3. Joyería (`/api/joyeria`)
*Idéntico a productos, pero la categoría se asigna automáticamente como 'joyeria'.*

### POST `/`
Crea un producto de joyería.
- **Body:**
  ```json
  {
    "codigo": "JOY-001",
    "nombre": "Anillo de Plata",
    "tipo_venta": "subasta",
    "costo_base": 1200.00
  }
  ```

---

## 4. Lotes (`/api/lotes`)

### POST `/`
Crea un nuevo lote de compra.
- **Body:**
  ```json
  {
    "codigo": "LOT-MARZO",
    "nombre": "Lote Primavera",
    "fecha_compra": "2024-03-15",
    "precio_total": 5000.00,
    "gastos_adicionales": 500.00,
    "piezas_total": 50
  }
  ```

---

## 5. Ventas (`/api/ventas`)

### POST `/`
Registra una venta de uno o más productos.
- **Body:**
  ```json
  {
    "items": [
      { "producto_id": "uuid-aqui", "precio_venta": 350.00 },
      { "producto_id": "otro-uuid", "precio_venta": 450.00 }
    ]
  }
  ```

---

## 6. Subastas (`/api/subastas`)

### POST `/`
Inicia una subasta para un producto.
- **Body:**
  ```json
  {
    "producto_id": "uuid-del-producto",
    "precio_inicial": 500.00,
    "incremento_minimo": 50.00
  }
  ```

### PUT `/:id/cerrar`
Finaliza la subasta y registra al ganador.
- **Body:**
  ```json
  {
    "precio_final": 850.00,
    "ganadora_nombre": "Cliente Ejemplo"
  }
  ```

---

## 7. Misión BigQuery (`/api/benchmarking`)

### POST `/snapshot`
Envía las métricas acumuladas a BigQuery.
- **Body:**
  ```json
  {
    "accessToken": "token_obtenido_de_google_oauth"
  }
  ```

---

## Pruebas Rápidas (Health Check)
- **GET** `/api/health` -> Respuesta `{ "success": true, "message": "..." }`

