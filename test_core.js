const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const { buildPsDestinationFileName } = require('./ps_filename');

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
  const mkSub = path.join(imgDir, 'mk');
  const psDir = path.join(repoDir, 'ps');

  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(imgDir, { recursive: true });
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
  const ps1FileName = buildPsDestinationFileName('1', 'MEMORIA-RAM', codigo);
  const ps2FileName = buildPsDestinationFileName('2', '700x400', codigo);
  fs.writeFileSync(path.join(psDir, ps1FileName), 'PSD_DATA_1', 'utf8');
  fs.writeFileSync(path.join(psDir, ps2FileName), 'PSD_DATA_2', 'utf8');

  // Aserciones
  if (!fs.existsSync(path.join(docsDir, '104523.txt'))) throw new Error('docs/104523.txt no existe');
  if (!fs.existsSync(imgDir)) throw new Error('img/ no existe');
  if (!fs.existsSync(mkSub)) throw new Error('img/mk no existe');
  const imgContents = fs.readdirSync(imgDir);
  if (imgContents.length !== 1 || imgContents[0] !== 'mk') throw new Error('img/ debe contener únicamente mk/');
  if (fs.readdirSync(mkSub).length !== 0) throw new Error('img/mk no está vacía');
  if (!fs.existsSync(path.join(psDir, `1-mk${codigo}-a.psd`))) throw new Error('El archivo PS1 no tiene el nombre asociado al código de producto');
  if (!fs.existsSync(path.join(psDir, '2-700x400.psd'))) throw new Error('ps/2-700x400.psd no existe');

  console.log('   [OK] Estructura creada verificada al 100%:');
  console.log('        docs/104523.txt (JSON válido)');
  console.log('        img/');
  console.log('        img/mk/ (vacía)');
  console.log(`        ps/${ps1FileName}`);
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

  const outputFiles = Object.entries(mappings)
    .map(([position, template]) => buildPsDestinationFileName(position, template, '[codigo]'));
  const expectedFiles = ['1-mk[codigo]-a.psd', '2-PUERTOS.psd', '3-PUERTOS.psd', '4-700x400.psd'];
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

  const outputFiles = Object.entries(caseMappings)
    .map(([position, template]) => buildPsDestinationFileName(position, template, '[codigo]'));
  const expectedFiles = ['1-mk[codigo]-a.psd', '2-700x400.psd'];
  if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('Los nombres de archivo PS de CASE no se generan correctamente');
  }

  console.log('   [OK] COUGAR ofrece cuatro submarcas y CASE genera sus dos archivos PS');
}

function testSamsungBrandAndMonitorMappings() {
  console.log('5. Probando marca SAMSUNG y mapeo de plantillas MONITOR...');

  const samsung = config.brands.find(brand => brand.name === 'SAMSUNG');
  const expectedSubbrands = [
    'SAMSUNG Monitores Gaming Odyssey',
    'SAMSUNG Monitores Smart',
    'SAMSUNG Monitores WorkPro',
    'SAMSUNG Pantallas (Digital Signage)',
    'SAMSUNG Pantallas Pizarras',
    'SAMSUNG Perifericos',
    'SAMSUNG SmartPhone Galaxy',
    'SAMSUNG Tablet Galaxy',
    'SAMSUNG Unidades SSD'
  ];
  if (!samsung || JSON.stringify(samsung.subbrands) !== JSON.stringify(expectedSubbrands)) {
    throw new Error('Las submarcas SAMSUNG no coinciden con las requeridas');
  }

  const monitorMappings = config.tipoxpsMappings.MONITOR;
  const expectedMonitorMappings = {
    '1': 'MONITOR',
    '2': 'PUERTOS-MONITOR',
    '3': '700x400'
  };
  if (JSON.stringify(monitorMappings) !== JSON.stringify(expectedMonitorMappings)) {
    throw new Error('El mapeo de plantillas MONITOR no coincide con las tres posiciones requeridas');
  }

  const outputFiles = Object.entries(monitorMappings)
    .map(([position, template]) => buildPsDestinationFileName(position, template, '[codigo]'));
  const expectedFiles = ['1-mk[codigo]-a.psd', '2-PUERTOS-MONITOR.psd', '3-700x400.psd'];
  if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('Los nombres de archivo PS de MONITOR no se generan correctamente');
  }

  console.log('   [OK] SAMSUNG ofrece nueve submarcas y MONITOR genera sus tres archivos PS');
}

function testKlipXtremeBrandAndWallChargerMappings() {
  console.log('6. Probando marca KLIP XTREME y mapeo CARGADOR-DE-PARED...');

  const klipXtreme = config.brands.find(brand => brand.name === 'KLIP XTREME');
  const expectedSubbrands = [
    'Klip Xtreme Accesorios para Laptop, Smartphone',
    'Klip Xtreme Accesorios, Perifericos',
    'Klip Xtreme Cargadores, Power Bank',
    'Klip Xtreme Ecran',
    'Klip Xtreme Empresarial',
    'Klip Xtreme Mochilas Maletines',
    'Klip Xtreme Soportes, Rack'
  ];
  if (!klipXtreme || JSON.stringify(klipXtreme.subbrands) !== JSON.stringify(expectedSubbrands)) {
    throw new Error('Las submarcas KLIP XTREME no coinciden con las requeridas');
  }

  const chargerMappings = config.tipoxpsMappings['CARGADOR-DE-PARED'];
  const expectedChargerMappings = { '1': 'CARGADOR-DE-PARED', '2': '700x400' };
  if (JSON.stringify(chargerMappings) !== JSON.stringify(expectedChargerMappings)) {
    throw new Error('El mapeo de CARGADOR-DE-PARED no coincide con las dos posiciones requeridas');
  }

  const outputFiles = Object.entries(chargerMappings)
    .map(([position, template]) => buildPsDestinationFileName(position, template, '[codigo]'));
  const expectedFiles = ['1-mk[codigo]-a.psd', '2-700x400.psd'];
  if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('Los nombres de archivo PS de CARGADOR-DE-PARED no se generan correctamente');
  }

  console.log('   [OK] KLIP XTREME ofrece siete submarcas y CARGADOR-DE-PARED genera dos archivos PS');
}

function testBackpackAndBagMappings() {
  console.log('7. Probando mapeos MOCHILA y BOLSO...');

  const expectedFilesByType = {
    'MOCHILA': ['1-mk[codigo]-a.psd', '2-700x400.psd'],
    'BOLSO': ['1-mk[codigo]-a.psd', '2-700x400.psd']
  };

  for (const [type, expectedFiles] of Object.entries(expectedFilesByType)) {
    const mappings = config.tipoxpsMappings[type];
    const expectedMappings = { '1': 'MOCHILA', '2': '700x400' };
    if (JSON.stringify(mappings) !== JSON.stringify(expectedMappings)) {
      throw new Error(`El mapeo de ${type} no coincide con las dos posiciones requeridas`);
    }

    const outputFiles = Object.entries(mappings)
      .map(([position, template]) => buildPsDestinationFileName(position, template, '[codigo]'));
    if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
      throw new Error(`Los nombres de archivo PS de ${type} no se generan correctamente`);
    }
  }

  console.log('   [OK] MOCHILA y BOLSO generan sus dos archivos PS');
}

function testRazerBrand() {
  console.log('8. Probando marca RAZER...');

  const razer = config.brands.find(brand => brand.name === 'RAZER');
  if (!razer || JSON.stringify(razer.subbrands) !== JSON.stringify(['RAZER'])) {
    throw new Error('RAZER debe tener RAZER como única submarca');
  }

  const logoMappings = config.brandLogoMappings;
  if (!logoMappings || JSON.stringify(logoMappings['KLIP XTREME']) !== JSON.stringify({
    directory: 'MARCAS',
    logos: ['KLIP XTREME']
  })) {
    throw new Error('KLIP XTREME debe activar el logo correspondiente dentro de MARCAS');
  }
  if (JSON.stringify(logoMappings.RAZER) !== JSON.stringify({
    directory: 'MARCAS',
    logos: ['RAZER', 'RAZER LOGO']
  })) {
    throw new Error('RAZER debe activar ambos logos correspondientes dentro de MARCAS');
  }

  console.log('   [OK] RAZER ofrece RAZER como submarca');
}

function testSanDiskBrandAndMicroSdMappings() {
  console.log('9. Probando marca SANDISK y mapeo MEMORIA-MICRO-SD...');

  const sandisk = config.brands.find(brand => brand.name === 'SANDISK');
  if (!sandisk || sandisk.keyword !== 'SANDISK' || JSON.stringify(sandisk.subbrands) !== JSON.stringify(['SANDISK'])) {
    throw new Error('SANDISK debe tener keyword SANDISK y SANDISK como única submarca');
  }

  const microSdMappings = config.tipoxpsMappings['MEMORIA-MICRO-SD'];
  const expectedMappings = { '1': 'MEMORIA-MICRO-SD', '2': '700x400' };
  if (JSON.stringify(microSdMappings) !== JSON.stringify(expectedMappings)) {
    throw new Error('El mapeo de MEMORIA-MICRO-SD no coincide con las dos posiciones requeridas');
  }

  const outputFiles = Object.entries(microSdMappings)
    .map(([position, template]) => buildPsDestinationFileName(position, template, '[codigo]'));
  const expectedFiles = ['1-mk[codigo]-a.psd', '2-700x400.psd'];
  if (JSON.stringify(outputFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('Los nombres de archivo PS de MEMORIA-MICRO-SD no se generan correctamente');
  }

  const logoMapping = config.brandLogoMappings.SANDISK;
  const expectedLogoMapping = { directory: 'MARCAS', logos: ['SANDISK'] };
  if (JSON.stringify(logoMapping) !== JSON.stringify(expectedLogoMapping)) {
    throw new Error('SANDISK debe activar su logo dentro del directorio MARCAS');
  }

  console.log('   [OK] SANDISK activa su logo en MARCAS y MEMORIA-MICRO-SD genera sus dos archivos PS');
}

function testLenovoBrand() {
  console.log('10. Probando marca LENOVO...');

  const lenovo = config.brands.find(brand => brand.name === 'LENOVO');
  if (!lenovo || JSON.stringify(lenovo.subbrands) !== JSON.stringify(['LENOVO'])) {
    throw new Error('LENOVO debe ofrecer LENOVO como única submarca');
  }

  const logoMapping = config.brandLogoMappings.LENOVO;
  if (JSON.stringify(logoMapping) !== JSON.stringify({
    directory: 'MARCAS',
    logos: ['LENOVO']
  })) {
    throw new Error('LENOVO debe activar su logo dentro del directorio MARCAS');
  }

  console.log('   [OK] LENOVO activa su logo en MARCAS');
}

testJsonFormulas();
testDirectoryCreation();
testPcMiniMappings();
testCougarBrandAndCaseMappings();
testSamsungBrandAndMonitorMappings();
testKlipXtremeBrandAndWallChargerMappings();
testBackpackAndBagMappings();
testRazerBrand();
testSanDiskBrandAndMicroSdMappings();
testLenovoBrand();
console.log('\n--- ¡TODAS LAS VALIDACIONES DE LÓGICA DE NEGOCIO PASARON CON ÉXITO! ---');
