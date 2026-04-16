# Iniciar el proyecto

Esta guia te permite ejecutar el juego en tu ordenador usando PowerShell en Windows.

## Requisitos

- Tener instalado `Node.js` en una version moderna.
- Recomendado: `Node.js 20` o superior.
- No hace falta configurar variables de entorno para arrancar este proyecto.

## 1. Abrir la carpeta del proyecto

Abre PowerShell y entra en la carpeta del juego:

```powershell
cd "C:\Users\jordi\OneDrive\Documents\TrabajoJordi\Youtube\Tetris1"
```

## 2. Instalar dependencias

Ejecuta:

```powershell
npm install
```

Este paso descargara React, Vite y el resto de librerias del proyecto.

## 3. Iniciar el servidor de desarrollo

Ejecuta:

```powershell
npm run dev
```

Vite levantara una URL local. Normalmente sera:

```text
http://localhost:5173/
```

Abre esa direccion en tu navegador para jugar.

## 4. Detener el proyecto

Cuando quieras cerrar el servidor, vuelve a la terminal y pulsa:

```text
Ctrl + C
```

## 5. Crear version de produccion

Si quieres comprobar que el proyecto compila correctamente:

```powershell
npm run build
```

Esto generara la carpeta `dist/` con la version lista para produccion.

## Problemas comunes

### `npm` no se reconoce

Significa que `Node.js` no esta instalado o no esta agregado al `PATH`.

Compruebalo con:

```powershell
node -v
npm -v
```

### El puerto `5173` esta ocupado

Prueba con otro puerto:

```powershell
npm run dev -- --port 5174
```

Y abre:

```text
http://localhost:5174/
```

## Verificacion realizada

El `2026-04-16` se comprobaron estos pasos en este proyecto:

- `npm install`
- `npm run build`

Ambos comandos terminaron correctamente.
