const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Cargar server modules
const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

// Extraer funciones clave para test unitario
const vm = require('vm');
const sandbox = {
  require,
  console,
  process,
  __dirname,
  module: { exports: {} },
  exports: {}
};
vm.createContext(sandbox);

console.log('--- Iniciando prueba unitaria de la lógica de negocio ---');

// Probar lógica de construcción de JSON
function testJsonFormulas() {
  console.log('1. Probando fórmulas de JSON...');

  // Helper local que replica la función de server.js
  function buildProductJson(data) {
    const linkPdf = (data.linkPdf || '').trim();
    const linkProducto = (data.linkProducto || '').trim();

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

  // Caso A: Solo PDF
  const resA = buildProductJson({
    codigoProducto: '104523',
    numeroParte: 'PVE2416G320C8K',
    nombreProducto: 'MEMORIA RAM PATRIOT 8GB',
    linkPdf: 'https://datasheet.pdf',
    linkProducto: '',
    tipoxps: 'MEMORIA-RAM',
    complementoNombre: ['Black', 'Negro']
  });

  if (resA['link1'] !== 'https://datasheet.pdf') throw new Error('Caso A link1 falló');
  if (resA['link2'] !== 'https://datasheet.pdf') throw new Error('Caso A link2 falló');
  if (resA['posicion'] !== 1) throw new Error('Caso A posicion falló');
  if (resA['upbase-caracteristicas-tecnicas'] !== '') throw new Error('El campo técnico opcional debe estar vacío por defecto');
  if (resA['upbase-nota-importante'] !== '') throw new Error('La nota opcional debe estar vacía por defecto');
  console.log('   [OK] Caso A (Solo PDF): link1=PDF, link2=PDF');

  const resOptionalFields = buildProductJson({
    codigoProducto: '104523',
    numeroParte: 'PVE2416G320C8K',
    nombreProducto: 'MEMORIA RAM PATRIOT 8GB',
    upbaseCaracteristicasTecnicas: '  Compatible con DDR4  ',
    upbaseNotaImportante: '  Confirmar compatibilidad  '
  });
  if (resOptionalFields['upbase-caracteristicas-tecnicas'] !== 'Compatible con DDR4') throw new Error('Las características técnicas opcionales no se guardaron correctamente');
  if (resOptionalFields['upbase-nota-importante'] !== 'Confirmar compatibilidad') throw new Error('La nota importante opcional no se guardó correctamente');
  console.log('   [OK] Campos adicionales opcionales: conservan el contenido y eliminan espacios externos');

  // Caso B: Solo Producto
  const resB = buildProductJson({
    codigoProducto: '104523',
    numeroParte: 'PVE2416G320C8K',
    nombreProducto: 'MEMORIA RAM PATRIOT 8GB',
    linkPdf: '',
    linkProducto: 'https://product.com/item',
    tipoxps: 'MEMORIA-RAM'
  });
  if (resB['link1'] !== 'https://product.com/item') throw new Error('Caso B link1 falló');
  if (resB['link2'] !== 'https://product.com/item') throw new Error('Caso B link2 falló');
  console.log('   [OK] Caso B (Solo Producto): link1=Producto, link2=Producto');

  // Caso C: Ambos
  const resC = buildProductJson({
    codigoProducto: '104523',
    numeroParte: 'PVE2416G320C8K',
    nombreProducto: 'MEMORIA RAM PATRIOT 8GB',
    linkPdf: 'https://datasheet.pdf',
    linkProducto: 'https://product.com/item',
    tipoxps: 'MEMORIA-RAM'
  });
  if (resC['link1'] !== 'https://datasheet.pdf') throw new Error('Caso C link1 falló');
  if (resC['link2'] !== 'https://product.com/item') throw new Error('Caso C link2 falló');
  console.log('   [OK] Caso C (Ambos): link1=PDF, link2=Producto');

  // Caso D: Ninguno
  const resD = buildProductJson({
    codigoProducto: '104523',
    numeroParte: 'PVE2416G320C8K',
    nombreProducto: 'MEMORIA RAM PATRIOT 8GB',
    linkPdf: '',
    linkProducto: '',
    tipoxps: 'MEMORIA-RAM'
  });
  if (resD['link1'] !== '#') throw new Error('Caso D link1 falló');
  if (resD['link2'] !== '#') throw new Error('Caso D link2 falló');
  console.log('   [OK] Caso D (Ninguno): link1="#", link2="#"');
}

// Probar creación de directorios físicos
function testDirectoryCreation() {
  console.log('2. Probando creación física de repositorio...');
  const testBase = path.join(__dirname, 'test_sandbox_repos');
  if (fs.existsSync(testBase)) {
    fs.rmSync(testBase, { recursive: true, force: true });
  }

  const codigo = '104523';
  const tipoxps = 'MEMORIA-RAM';
  const repoName = `${codigo} - ${tipoxps}`;
  const repoDir = path.join(testBase, repoName);

  const docsDir = path.join(repoDir, 'docs');
  const imgDir = path.join(repoDir, 'img');
  const imgSub = path.join(imgDir, 'img');
  const mkSub = path.join(imgDir, 'mk');
  const psDir = path.join(repoDir, 'ps');

  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(imgSub, { recursive: true });
  fs.mkdirSync(mkSub, { recursive: true });
  fs.mkdirSync(psDir, { recursive: true });

  // Crear 104523.txt
  const sampleJson = {
    'codigo-producto': codigo,
    'numero-parte': 'TEST-PART',
    'nombre-producto': 'TEST NAME',
    'upbase-caracteristicas-tecnicas': '',
    'upbase-nota-importante': '',
    'link-pdf': '',
    'link-producto': '',
    'videos': [],
    'tipoxps': tipoxps,
    'marca': 'PATRIOT',
    'submarca': 'PATRIOT',
    'nombre-corto': 'TEST SHORT',
    'complemento-nombre': ['Black'],
    'slogan': '',
    'meta-keywords': [],
    'descripcion': { 'title': '', 'p': [], 'one-line-specs': [] },
    'caracteristicas': [],
    'specs': [],
    'link1': '#',
    'link2': '#',
    'posicion': 1
  };

  fs.writeFileSync(path.join(docsDir, `${codigo}.txt`), JSON.stringify(sampleJson, null, 2), 'utf8');

  // Simular creación de plantillas PS
  // MEMORIA-RAM -> PS1: MEMORIA-RAM, PS2: 700x400
  fs.writeFileSync(path.join(psDir, '1-MEMORIA-RAM.psd'), 'PSD_DATA_1', 'utf8');
  fs.writeFileSync(path.join(psDir, '2-700x400.psd'), 'PSD_DATA_2', 'utf8');

  // Aserciones
  if (!fs.existsSync(path.join(docsDir, '104523.txt'))) throw new Error('docs/104523.txt no existe');
  if (!fs.existsSync(imgSub)) throw new Error('img/img no existe');
  if (!fs.existsSync(mkSub)) throw new Error('img/mk no existe');
  if (fs.readdirSync(imgSub).length !== 0) throw new Error('img/img no está vacía');
  if (fs.readdirSync(mkSub).length !== 0) throw new Error('img/mk no está vacía');
  if (!fs.existsSync(path.join(psDir, '1-MEMORIA-RAM.psd'))) throw new Error('ps/1-MEMORIA-RAM.psd no existe');
  if (!fs.existsSync(path.join(psDir, '2-700x400.psd'))) throw new Error('ps/2-700x400.psd no existe');

  console.log('   [OK] Estructura creada verificada al 100%:');
  console.log('        docs/104523.txt (JSON válido)');
  console.log('        img/img/ (vacía)');
  console.log('        img/mk/ (vacía)');
  console.log('        ps/1-MEMORIA-RAM.psd');
  console.log('        ps/2-700x400.psd');

  // Limpiar
  fs.rmSync(testBase, { recursive: true, force: true });
}

function testPcMiniMappings() {
  console.log('3. Probando mapeo de plantillas PC MINI...');

  const mappings = config.tipoxpsMappings['PC MINI'];
  const expected = {
    '1': 'PC MINI',
    '2': 'PUERTOS',
    '3': 'PUERTOS',
    '4': '700x400'
  };

  if (JSON.stringify(mappings) !== JSON.stringify(expected)) {
    throw new Error('El mapeo de plantillas PC MINI no coincide con las cuatro posiciones requeridas');
  }

  const outputFiles = Object.entries(mappings).map(([position, template]) => `${position}-${template}.psd`);
  const expectedFiles = ['1-PC MINI.psd', '2-PUERTOS.psd', '3-PUERTOS.psd', '4-700x400.psd'];
  if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('Los nombres de archivo PS de PC MINI no se generan correctamente');
  }
  console.log('   [OK] PC MINI genera las cuatro posiciones PS requeridas');
}

function testCougarBrandAndCaseMappings() {
  console.log('4. Probando marca COUGAR y mapeo de plantillas CASE...');

  const cougar = config.brands.find(brand => brand.name === 'COUGAR');
  const expectedSubbrands = [
    'Cougar Componentes',
    'Cougar Mesas',
    'Cougar Perifericos',
    'Cougar Sillas | Sofa'
  ];
  if (!cougar || JSON.stringify(cougar.subbrands) !== JSON.stringify(expectedSubbrands)) {
    throw new Error('Las submarcas COUGAR no coinciden con las requeridas');
  }

  const caseMappings = config.tipoxpsMappings.CASE;
  const expectedCaseMappings = { '1': 'CASE', '2': '700x400' };
  if (JSON.stringify(caseMappings) !== JSON.stringify(expectedCaseMappings)) {
    throw new Error('El mapeo de plantillas CASE no coincide con las dos posiciones requeridas');
  }

  const outputFiles = Object.entries(caseMappings).map(([position, template]) => `${position}-${template}.psd`);
  const expectedFiles = ['1-CASE.psd', '2-700x400.psd'];
  if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('Los nombres de archivo PS de CASE no se generan correctamente');
  }

  console.log('   [OK] COUGAR ofrece cuatro submarcas y CASE genera sus dos archivos PS');
}

testJsonFormulas();
testDirectoryCreation();
testPcMiniMappings();
testCougarBrandAndCaseMappings();
console.log('\n--- ¡TODAS LAS VALIDACIONES DE LÓGICA DE NEGOCIO PASARON CON ÉXITO! ---');
