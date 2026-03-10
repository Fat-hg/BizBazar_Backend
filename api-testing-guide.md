# Guía de Pruebas y Conexión de la API BizBazar

Esta guía te ayudará a probar tu backend recién creado usando Postman, y te dará las bases para conectar tu futuro Frontend (React/Next.js/HTML).

---

## 1. Cómo probar la API con Postman

Postman es una herramienta que simula ser el frontend (o un usuario) haciendo peticiones a tu servidor.

### Pasos Iniciales
1. Descarga e instala [Postman](https://www.postman.com/downloads/).
2. Asegúrate de que tu servidor esté corriendo (`npm run dev` en la terminal, indicando `puerto 3001`).

### A. Probar un GET (Ejemplo: Dashboard)
1. Abre Postman y haz clic en el botón **`+`** para crear un nuevo request (pestaña).
2. A la izquierda de la barra de URL, asegúrate de que diga **`GET`**.
3. En la barra de URL escribe: `http://localhost:3001/api/dashboard`
4. Haz clic en el botón azul **`Send`**.
5. Abajo, en la sección de respuesta (Response), verás el JSON con tus métricas en 0.

### B. Probar un POST (Ejemplo: Crear un Producto)
Para crear datos, necesitamos enviar información (un "Body").

1. Crea un nuevo request (pestaña) en Postman.
2. Cambia el método de `GET` a **`POST`**.
3. En la URL escribe: `http://localhost:3001/api/productos`
4. Justo debajo de la URL, haz clic en la pestaña **`Body`**.
5. Selecciona la opción **`raw`**.
6. A la derecha, donde dice `Text`, cámbialo a **`JSON`**.
7. En el cuadro de texto grande, pega este ejemplo:
   ```json
   {
     "codigo": "PROD001",
     "nombre": "Anillo de Plata",
     "descripcion": "Anillo 100% plata ley 925",
     "categoria": "joyeria",
     "tipo_venta": "directa",
     "costo_base": 250.00
   }
   ```
8. Haz clic en **`Send`**.
9. En la respuesta verás algo como `"success": true` y los datos del producto creado con su nuevo `id`.

**¡Felicidades!** Acabas de guardar tu primer dato en la base de datos de PostgreSQL a través de tu API. Si ahora vuelves a hacer el `GET` al dashboard (paso A), verás que `joyeria_disponible` ahora marca `1`.

---

## 2. Cómo conectar el Frontend a esta API

Eventualmente construirás un cliente o interfaz (Frontend) que consuma esta API. 

### Concepto Básico
El Frontend usa una función nativa de JavaScript llamada `fetch()` (o librerías como `axios`) para hacer exactamente lo mismo que hace Postman. Todo gracias a que incluimos la configuración de `CORS` en tu backend.

### Ejemplo Práctico (JavaScript nativo / React)

Digamos que en tu frontend tienes un botón que debe cargar los datos del dashboard. El código en tu frontend se vería así:

```javascript
// Función en tu frontend para obtener el dashboard
async function cargarDashboard() {
  try {
    // 1. Hacemos la petición a la API
    const respuesta = await fetch('http://localhost:3001/api/dashboard');
    
    // 2. Convertimos la respuesta a JSON
    const datos = await respuesta.json();
    
    // 3. Verificamos si fue exitoso
    if (datos.success) {
      console.log('Métricas:', datos.data.metricas);
      console.log('Ventas recientes:', datos.data.ventas_recientes);
      
      // Aquí usarías estos datos para actualizar tu interfaz
      // (ej. setDashboardData(datos.data) en React)
    }
  } catch (error) {
    console.error('Error al conectar con la API:', error);
  }
}
```

### Ejemplo Práctico: Enviar datos (POST) desde un formulario

Si tienes un formulario para crear productos, al darle click a "Guardar", tu frontend haría esto:

```javascript
async function crearProducto(datosDelFormulario) {
  try {
    const respuesta = await fetch('http://localhost:3001/api/productos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Le decimos a la API que enviamos JSON
      },
      // Convertimos el objeto de JavaScript a un string literal JSON
      body: JSON.stringify(datosDelFormulario)
    });
    
    const resultado = await respuesta.json();
    
    if (resultado.success) {
      alert('Producto guardado con éxito!');
    } else {
      alert('Error: ' + resultado.error); // Ej. si faltaron campos obligatorios
    }
  } catch (error) {
    console.error('Error de conexión:', error);
  }
}
```

¡Eso es todo! Postman hace este proceso manual para que puedas probar que el backend funciona (lo cual acabamos de comprobar). Una vez validado, programas tu frontend para hacer esas mismas peticiones.
