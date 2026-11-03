# 🚀 Memory Kings - Generador de Repositorios de Producto

Aplicación web desarrollada para optimizar y **minimizar la fricción** en el flujo de trabajo de los editores de producto de Memory Kings. Genera de forma automatizada la estructura completa de carpetas, el archivo JSON de metadatos (`[codigo].txt`), las carpetas multimedia y las plantillas Photoshop (`.psd`) requeridas según el tipo de producto.

---

## 📁 Ubicación del Proyecto

La aplicación se encuentra en:
```
C:\Users\Memory Kings\.gemini\antigravity\scratch\product-repo-generator
```

> **Recomendación:** Puedes configurar esta subcarpeta como tu espacio de trabajo activo en Antigravity / Cursor / VS Code.

---

## ⚡ Cómo Iniciar la Aplicación

Para iniciar la aplicación, tienes tres opciones rápidas:

1. **Doble clic en el archivo:**
   - Ejecuta `iniciar.bat`.
   - Detecta automáticamente el entorno Node.js, inicia el servidor en `http://localhost:3456` y abre tu navegador predeterminado automáticamente.

2. **Mediante PowerShell:**
   ```powershell
   .\iniciar.ps1
   ```

3. **Mediante terminal directa:**
   ```bash
   node server.js
   ```
   Y abre en tu navegador: `http://localhost:3456`

---

## 🛠️ Estructura del Repositorio Generado

Cada vez que envíes el formulario con los datos de un producto, la aplicación creará una carpeta nombrada:
```
[codigo] - [tipo de producto]
```
*(Por ejemplo: `104523 - MEMORIA-RAM`)*

Dentro de ella se generará la siguiente estructura exacta:

```
[codigo] - [tipo de producto]/
│
├── docs/
│   └── [codigo].txt       # Contiene el JSON completo con todos los datos y fórmulas
│
├── img/
│   └── mk/                # Carpeta vacía para marcas de agua / recursos MK
│
└── ps/                    # Copias de las plantillas de Photoshop requeridas
    ├── 1-[plantilla].psd  # Renombrado con la posición correspondiente
    └── 2-[plantilla].psd
```

---

## 📑 Mapeo de Plantillas de Photoshop (`tipoxps`)

Las plantillas se obtienen automáticamente del directorio de origen:
`W:\PLANTILLAS_EDICION_LUIS`

| Tipo (`tipoxps`) | Posición | Plantilla Origen | Archivo Resultante en `ps/` |
|---|---|---|---|
| `MEMORIA-RAM` | PS1 | `MEMORIA-RAM` | `1-MEMORIA-RAM.psd` |
| `MEMORIA-RAM` | PS2 | `700x400` | `2-700x400.psd` |
| `DISCO-DURO-INTERNO` | PS1 | `DISCO-DURO-INTERNO` | `1-DISCO-DURO-INTERNO.psd` |
| `DISCO-DURO-INTERNO` | PS2 | `700x400` | `2-700x400.psd` |
| `PC MINI` | PS1 | `PC MINI` | `1-PC MINI.psd` |
| `PC MINI` | PS2 | `PUERTOS` | `2-PUERTOS.psd` |
| `PC MINI` | PS3 | `PUERTOS` | `3-PUERTOS.psd` |
| `PC MINI` | PS4 | `700x400` | `4-700x400.psd` |
| `LAPTOP` | PS1 | `LAPTOP` | `1-LAPTOP.psd` |
| `LAPTOP` | PS2 | `RESOLUCION` | `2-RESOLUCION.psd` |
| `LAPTOP` | PS3 | `700x400` | `3-700x400.psd` |
| `LAPTOP` | PS4 | `LAPTOP-PUERTOS` | `4-LAPTOP-PUERTOS.psd` |
| `CASE` | PS1 | `CASE` | `1-CASE.psd` |
| `CASE` | PS2 | `700x400` | `2-700x400.psd` |
| `MONITOR` | PS1 | `MONITOR` | `1-MONITOR.psd` |
| `MONITOR` | PS2 | `PUERTOS-MONITOR` | `2-PUERTOS-MONITOR.psd` |
| `MONITOR` | PS3 | `700x400` | `3-700x400.psd` |
| `CARGADOR-DE-PARED` | PS1 | `CARGADOR-DE-PARED` | `1-CARGADOR-DE-PARED.psd` |
| `CARGADOR-DE-PARED` | PS2 | `700x400` | `2-700x400.psd` |
| `MOCHILA` | PS1 | `MOCHILA` | `1-MOCHILA.psd` |
| `MOCHILA` | PS2 | `700x400` | `2-700x400.psd` |
| `BOLSO` | PS1 | `MOCHILA` | `1-MOCHILA.psd` |
| `BOLSO` | PS2 | `700x400` | `2-700x400.psd` |
| `N/A` | PS2 | `700x400` | `2-700x400.psd` |

*(La ruta de origen `W:\PLANTILLAS_EDICION_LUIS` se puede cambiar o verificar directamente desde la interfaz en el botón **⚙️ Ajustes**).*

---

## 📋 Estructura del JSON generado en `[codigo].txt`

| Campo | Tipo | Fórmula / Regla | Obligatorio |
|---|---|---|---|
| `codigo-producto` | 6 dígitos fijos | Manual | **Sí** |
| `numero-parte` | Texto | Manual | **Sí** |
| `nombre-producto` | Texto | Manual | **Sí** |
| `upbase-caracteristicas-tecnicas` | Texto | Manual (vacío si no se indica) | No |
| `upbase-nota-importante` | Texto | Manual (vacío si no se indica) | No |
| `link-pdf` | Texto | Manual | No (vacío si no se indica) |
| `link-producto` | Texto | Manual | No (vacío si no se indica) |
| `videos` | Array de textos | Manual (links de YouTube) | No (`[]` si no hay) |
| `tipoxps` | Opción | Manual | **Sí** |
| `marca` | Opción | Manual (`WESTERN DIGITAL`, `PATRIOT`, etc.) | No |
| `submarca` | Opción | Manual dependiente de la marca | No |
| `nombre-corto` | Texto | Manual (con botón auto-sugerir), máximo 30 caracteres | **Sí** |
| `complemento-nombre` | Array de opciones | Manual (`Black`, `Negro`, `White`, `Blanco`) | No |
| `slogan` | Texto | Vacío (`""`) | No |
| `meta-keywords` | Array de textos | Vacío (`[]`) | No |
| `descripcion` | Objeto | Vacío (`{ "title": "", "p": [], "one-line-specs": [] }`) | No |
| `caracteristicas` | Array | Vacío (`[]`) | No |
| `specs` | Array | Vacío (`[]`) | No |
| `link1` | Texto | `link-pdf || link-producto || "#"` | Automático |
| `link2` | Texto | `link-producto || link-pdf || "#"` | Automático |
| `posicion` | Entero | `1` | Automático |

---

## 🌟 Características Destacadas de la App

1. **Botón "Abrir ubicación":**
   - Presente en la ventana modal de confirmación tras crear el repositorio.
   - Presente en cada elemento del **Historial Reciente**.
   - Junto al campo del directorio base, el botón **Buscar** abre el selector estándar de Windows: navega hasta la carpeta deseada y pulsa **Abrir** para usarla. **Abrir** permite comprobar la ruta en el Explorador.
   - Abre de inmediato la carpeta en el Explorador de archivos de Windows (`explorer.exe`).

2. **Inspector en tiempo real:**
   - **Pestaña JSON:** Visualiza el JSON exactamente como se escribirá en `docs/[codigo].txt` con formateo y conteo de líneas/bytes. Botón de 1-clic para copiar al portapapeles.
   - **Pestaña Estructura:** Muestra el árbol interactivo de carpetas y archivos antes de crearlo.
   - **Pestaña Historial:** Mantiene los últimos repositorios creados con fecha y hora para reabrirlos cuando quieras.

3. **Validación Instantánea:**
   - Contador en vivo de `[0/6 dígitos]` para el código de producto.
   - Filtrado dinámico de submarcas según la marca seleccionada (ej. si eliges *WESTERN DIGITAL*, despliega sus 6 submarcas específicas como *Black Edition*, *HDD*, *NAS*, *SSD*, etc.).
   - Selección interactiva por chips/pills para los complementos de nombre (*Black*, *Negro*, *White*, *Blanco* o personalizados).
   - Atajo de teclado: `Ctrl + Enter` para generar el repositorio al instante.
