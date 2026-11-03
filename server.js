const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');

const PORT = process.env.PORT || 3456;
const CONFIG_FILE = path.join(__dirname, 'config.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Cargar o inicializar configuración
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error al leer config.json:', err);
  }
  return {
    downloadPath: path.join(__dirname, 'repositorios'),
    templatePath: 'W:\\PLANTILLAS_EDICION_LUIS',
    brands: [
      {
        name: 'WESTERN DIGITAL',
        keyword: 'WD',
        subbrands: [
          'Western Digital Black Edition',
          'Western Digital HDD',
          'Western Digital Micro SD Purple',
          'Western Digital NAS',
          'Western Digital SSD',
          'Western Digital USB'
        ]
      },
      {
        name: 'PATRIOT',
        keyword: '',
        subbrands: ['PATRIOT']
      },
      {
        name: 'ASUS',
        keyword: '',
        subbrands: [
          'ASUS Componentes',
          'ASUS Empresarial',
          'ASUS Laptops',
          'ASUS Monitores',
          'ASUS NUC Mini PCs',
          'ASUS PCs Desktop GAMING',
          'ASUS PCs Empresarial',
          'ASUS Periféricos',
          'ASUS Placas Madre',
          'ASUS Routers',
          'ASUS Tarjetas de Video'
        ]
      },
      {
        name: 'GEEKOM',
        keyword: '',
        subbrands: ['GEEKOM']
      },
      {
        name: 'COUGAR',
        keyword: '',
        subbrands: [
          'Cougar Componentes',
          'Cougar Mesas',
          'Cougar Perifericos',
          'Cougar Sillas | Sofa'
        ]
      },
      {
        name: 'SAMSUNG',
        keyword: '',
        subbrands: [
          'SAMSUNG Monitores Gaming Odyssey',
          'SAMSUNG Monitores Smart',
          'SAMSUNG Monitores WorkPro',
          'SAMSUNG Pantallas (Digital Signage)',
          'SAMSUNG Pantallas Pizarras',
          'SAMSUNG Perifericos',
          'SAMSUNG SmartPhone Galaxy',
          'SAMSUNG Tablet Galaxy',
          'SAMSUNG Unidades SSD'
        ]
      },
      {
        name: 'KLIP XTREME',
        keyword: '',
        subbrands: [
          'Klip Xtreme Accesorios para Laptop, Smartphone',
          'Klip Xtreme Accesorios, Perifericos',
          'Klip Xtreme Cargadores, Power Bank',
          'Klip Xtreme Ecran',
          'Klip Xtreme Empresarial',
          'Klip Xtreme Mochilas Maletines',
          'Klip Xtreme Soportes, Rack'
        ]
      }
    ],
    tipoxpsMappings: {
      'MEMORIA-RAM': { '1': 'MEMORIA-RAM', '2': '700x400' },
      'DISCO-DURO-INTERNO': { '1': 'DISCO-DURO-INTERNO', '2': '700x400' },
      'PC MINI': { '1': 'PC MINI', '2': 'PUERTOS', '3': 'PUERTOS', '4': '700x400' },
      'LAPTOP': { '1': 'LAPTOP', '2': 'RESOLUCION', '3': '700x400', '4': 'LAPTOP-PUERTOS' },
      'CASE': { '1': 'CASE', '2': '700x400' },
      'MONITOR': { '1': 'MONITOR', '2': 'PUERTOS-MONITOR', '3': '700x400' },
      'CARGADOR-DE-PARED': { '1': 'CARGADOR-DE-PARED', '2': '700x400' },
      'MOCHILA': { '1': 'MOCHILA', '2': '700x400' },
      'BOLSO': { '1': 'MOCHILA', '2': '700x400' },
      'N/A': { '2': '700x400' }
    },
    complementos: ['Black', 'Negro', 'White', 'Blanco'],
    history: []
  };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error al guardar config.json:', err);
    return false;
  }
}

// Helpers para sanitizar nombres de carpetas en Windows
function sanitizeFolderName(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

// Generar objeto JSON según la especificación técnica
function buildProductJson(data) {
  const linkPdf = (data.linkPdf || '').trim();
  const linkProducto = (data.linkProducto || '').trim();

  // Fórmulas especificadas:
  // link1: link-pdf || link-producto || "#"
  // link2: link-producto || link-pdf || "#"
  const link1 = linkPdf || linkProducto || '#';
  const link2 = linkProducto || linkPdf || '#';

  const videos = Array.isArray(data.videos)
    ? data.videos.map(v => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
    : [];

  const complementos = Array.isArray(data.complementoNombre)
    ? data.complementoNombre.map(c => (typeof c === 'string' ? c.trim() : '')).filter(Boolean)
    : [];

  return {
    'codigo-producto': (data.codigoProducto || '').trim(),
    'numero-parte': (data.numeroParte || '').trim(),
    'nombre-producto': (data.nombreProducto || '').trim(),
    'upbase-caracteristicas-tecnicas': (data.upbaseCaracteristicasTecnicas || '').trim(),
    'upbase-nota-importante': (data.upbaseNotaImportante || '').trim(),
    'link-pdf': linkPdf,
    'link-producto': linkProducto,
    'videos': videos,
    'tipoxps': (data.tipoxps || '').trim(),
    'marca': (data.marca || '').trim(),
    'submarca': (data.submarca || '').trim(),
    'nombre-corto': (data.nombreCorto || '').trim(),
    'complemento-nombre': complementos,
    'slogan': '',
    'meta-keywords': [],
    'descripcion': {
      'title': '',
      'p': [],
      'one-line-specs': []
    },
    'caracteristicas': [],
    'specs': [],
    'link1': link1,
    'link2': link2,
    'posicion': 1
  };
}

// Servir archivos estáticos
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  const filePath = path.join(PUBLIC_DIR, reqUrl);
  const ext = path.extname(filePath).toLowerCase();

  // Prevenir Directory Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Acceso denegado');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error interno del servidor');
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
}

// Leer cuerpo de solicitud JSON
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (e) {
        reject(new Error('JSON no válido'));
      }
    });
    req.on('error', err => reject(err));
  });
}

// Abrir carpeta en explorador de Windows
function openInExplorer(targetPath) {
  return new Promise((resolve, reject) => {
    if (!targetPath || typeof targetPath !== 'string') {
      return reject(new Error('Ruta inválida'));
    }

    const normalizedPath = path.normalize(targetPath);
    // En Windows, explorer.exe abre la carpeta
    exec(`explorer.exe "${normalizedPath}"`, (error) => {
      // explorer.exe a menudo devuelve código 1 aún teniendo éxito al invocar la ventana
      if (error && error.code !== 1) {
        console.warn('Advertencia al abrir explorador:', error.message);
      }
      resolve(true);
    });
  });
}

function selectFolder(initialPath) {
  if (process.platform !== 'win32') {
    return Promise.reject(new Error('El selector de carpetas está disponible solo en Windows.'));
  }

  const script = [
    "$ErrorActionPreference = 'Stop'",
    'Add-Type -AssemblyName System.Windows.Forms',
    '$dialog = New-Object System.Windows.Forms.OpenFileDialog',
    "$dialog.Title = 'Selecciona la carpeta de destino de los repositorios y haz clic en Abrir'",
    "$dialog.FileName = 'Seleccionar esta carpeta'",
    '$dialog.CheckFileExists = $false',
    '$dialog.CheckPathExists = $true',
    '$dialog.ValidateNames = $false',
    '$dialog.RestoreDirectory = $true',
    'if ($env:PRODUCT_REPO_INITIAL_PATH -and [System.IO.Directory]::Exists($env:PRODUCT_REPO_INITIAL_PATH)) { $dialog.InitialDirectory = $env:PRODUCT_REPO_INITIAL_PATH }',
    "if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $selectedPath = [System.IO.Path]::GetDirectoryName($dialog.FileName); [Console]::Out.Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($selectedPath))) } else { [Console]::Out.Write('CANCELLED') }",
    '$dialog.Dispose()'
  ].join('\r\n');
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64');

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-STA', '-EncodedCommand', encodedScript], {
      windowsHide: true,
      env: {
        ...process.env,
        PRODUCT_REPO_INITIAL_PATH: typeof initialPath === 'string' ? initialPath : ''
      }
    }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr.trim() || `No se pudo abrir el selector de carpetas: ${error.message}`));
      }

      const result = stdout.trim();
      if (result === 'CANCELLED') {
        return resolve(null);
      }

      try {
        const selectedPath = Buffer.from(result, 'base64').toString('utf8');
        if (!selectedPath) {
          return reject(new Error('El selector de carpetas no devolvió una ruta.'));
        }
        resolve(selectedPath);
      } catch (decodeError) {
        reject(new Error(`No se pudo leer la ruta seleccionada: ${decodeError.message}`));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Configuración de CORS para desarrollo local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = req.url.split('?')[0];

  // API Endpoints
  if (url === '/api/config' && req.method === 'GET') {
    const config = loadConfig();
    let templateExists = false;
    let templateFiles = [];

    try {
      if (fs.existsSync(config.templatePath)) {
        templateExists = true;
        templateFiles = fs.readdirSync(config.templatePath).filter(f => f.toLowerCase().endsWith('.psd') || !f.includes('.'));
      }
    } catch (e) {
      // Unidad no conectada o inaccesible
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      ...config,
      templatePathConnected: templateExists,
      availableTemplates: templateFiles
    }));
  }

  if (url === '/api/config' && req.method === 'POST') {
    try {
      const newConfig = await parseJsonBody(req);
      const current = loadConfig();
      const updated = { ...current, ...newConfig };
      saveConfig(updated);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, config: updated }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  if (url === '/api/open-folder' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      await openInExplorer(data.path);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  if (url === '/api/select-folder' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const selectedPath = await selectFolder(data.initialPath);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        cancelled: selectedPath === null,
        path: selectedPath
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  if (url === '/api/create-repo' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const config = loadConfig();

      // Validaciones obligatorias
      const codigo = (data.codigoProducto || '').trim();
      if (!/^\d{6}$/.test(codigo)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: 'El código de producto debe contener exactamente 6 dígitos numéricos.'
        }));
      }

      if (!(data.numeroParte || '').trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: 'El número de parte es obligatorio.'
        }));
      }

      if (!(data.nombreProducto || '').trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: 'El nombre de producto es obligatorio.'
        }));
      }

      if (!(data.nombreCorto || '').trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: 'El nombre corto es obligatorio.'
        }));
      }

      if (data.nombreCorto.trim().length > 30) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: 'El nombre corto no puede superar los 30 caracteres.'
        }));
      }

      const tipoxps = (data.tipoxps || '').trim();
      if (!tipoxps) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: 'El tipoxps es obligatorio.'
        }));
      }

      // Base download directory
      const baseDownloadDir = data.downloadPath ? data.downloadPath.trim() : config.downloadPath;
      if (!fs.existsSync(baseDownloadDir)) {
        fs.mkdirSync(baseDownloadDir, { recursive: true });
      }

      // Nombre del repositorio por defecto: "[codigo] - [tipo de producto]"
      const defaultFolderName = `${codigo} - ${tipoxps}`;
      const repoFolderName = sanitizeFolderName(data.repoFolderName || defaultFolderName);
      const repoDir = path.join(baseDownloadDir, repoFolderName);

      // Crear carpetas del repositorio:
      // 1. docs/
      // 2. img/ con mk/
      // 3. ps/
      const docsDir = path.join(repoDir, 'docs');
      const imgDir = path.join(repoDir, 'img');
      const mkSubDir = path.join(imgDir, 'mk');
      const psDir = path.join(repoDir, 'ps');

      fs.mkdirSync(docsDir, { recursive: true });
      fs.mkdirSync(imgDir, { recursive: true });
      fs.mkdirSync(mkSubDir, { recursive: true });
      fs.mkdirSync(psDir, { recursive: true });

      // Generar JSON
      const productJson = buildProductJson({ ...data, codigoProducto: codigo, tipoxps });
      const txtPath = path.join(docsDir, `${codigo}.txt`);
      fs.writeFileSync(txtPath, JSON.stringify(productJson, null, 2), 'utf8');

      // Copiar archivos de Photoshop según tipoxps
      // Mapeo esperado: PS[#] -> [#]-[nombre-archivo].psd
      const templateBaseDir = data.templatePath || config.templatePath || 'W:\\PLANTILLAS_EDICION_LUIS';
      const psMappings = config.tipoxpsMappings[tipoxps] || {};

      const copiedFiles = [];
      const warnings = [];

      const templateDirExists = fs.existsSync(templateBaseDir);
      if (!templateDirExists) {
        warnings.push(`La carpeta de plantillas (${templateBaseDir}) no está accesible actualmente. Verifique la conexión o unidad de red.`);
      }

      // Procesar cada posición PS1..PS7
      for (const [pos, templateName] of Object.entries(psMappings)) {
        if (!templateName || templateName.trim() === '') continue;

        const cleanTemplateName = templateName.trim();
        const destFileName = `${pos}-${cleanTemplateName}.psd`;
        const destFilePath = path.join(psDir, destFileName);

        let copied = false;
        if (templateDirExists) {
          // Buscar archivo con extensión o sin ella
          const possibleSources = [
            path.join(templateBaseDir, `${cleanTemplateName}.psd`),
            path.join(templateBaseDir, `${cleanTemplateName}.PSD`),
            path.join(templateBaseDir, cleanTemplateName)
          ];

          for (const src of possibleSources) {
            if (fs.existsSync(src)) {
              try {
                fs.copyFileSync(src, destFilePath);
                copied = true;
                copiedFiles.push({
                  position: pos,
                  name: destFileName,
                  source: src,
                  status: 'copied'
                });
                break;
              } catch (copyErr) {
                console.error(`Error copiando ${src}:`, copyErr);
              }
            }
          }
        }

        if (!copied) {
          // Si no existe la plantilla física o no hay conexión con W:\,
          // creamos un archivo placeholder indicativo para que el repositorio quede completo
          const placeholderContent = `Plantilla Photoshop requerida: ${cleanTemplateName}\nPosicion: ${pos}\nDestino: ${destFileName}\nOrigen esperado: ${path.join(templateBaseDir, cleanTemplateName + '.psd')}\nFecha de generación: ${new Date().toISOString()}`;
          fs.writeFileSync(destFilePath, placeholderContent, 'utf8');
          warnings.push(`Plantilla PS${pos} (${cleanTemplateName}): No se encontró en ${templateBaseDir}. Se generó archivo base ${destFileName}.`);
          copiedFiles.push({
            position: pos,
            name: destFileName,
            source: 'placeholder',
            status: 'placeholder'
          });
        }
      }

      // Registrar en historial reciente
      const historyItem = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        codigo: codigo,
        nombre: data.nombreProducto,
        tipoxps: tipoxps,
        repoDir: repoDir,
        repoName: repoFolderName,
        filesCount: copiedFiles.length + 1
      };

      config.history = [historyItem, ...(config.history || [])].slice(0, 30);
      saveConfig(config);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: true,
        message: 'Repositorio creado con éxito.',
        repoPath: repoDir,
        repoFolderName: repoFolderName,
        txtFile: txtPath,
        json: productJson,
        copiedFiles: copiedFiles,
        warnings: warnings
      }));

    } catch (err) {
      console.error('Error al crear repositorio:', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({
        success: false,
        error: `Error interno al generar repositorio: ${err.message}`
      }));
    }
  }

  // Si ninguna ruta API coincide, servir estáticos
  return serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  MEMORY KINGS - GENERADOR DE REPOSITORIOS DE PRODUCTO `);
  console.log(`=======================================================`);
  console.log(`  Servidor iniciado en: http://localhost:${PORT}`);
  console.log(`  Directorio base: ${__dirname}`);
  console.log(`=======================================================`);
});
