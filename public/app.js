// Estado global de la aplicación
const state = {
  config: null,
  activeComplementos: new Set(),
  videos: [],
  lastCreatedRepo: null
};

// Elementos DOM
const dom = {
  form: document.getElementById('productForm'),
  downloadPath: document.getElementById('downloadPath'),
  btnBrowseBaseFolder: document.getElementById('btnBrowseBaseFolder'),
  btnOpenBaseFolder: document.getElementById('btnOpenBaseFolder'),
  previewFolderText: document.getElementById('previewFolderText'),
  codigoProducto: document.getElementById('codigoProducto'),
  codeCounter: document.getElementById('codeCounter'),
  numeroParte: document.getElementById('numeroParte'),
  nombreProducto: document.getElementById('nombreProducto'),
  tipoxps: document.getElementById('tipoxps'),
  upbaseCaracteristicasTecnicas: document.getElementById('upbaseCaracteristicasTecnicas'),
  upbaseNotaImportante: document.getElementById('upbaseNotaImportante'),
  psTemplatesContainer: document.getElementById('psTemplatesContainer'),
  marca: document.getElementById('marca'),
  submarca: document.getElementById('submarca'),
  nombreCorto: document.getElementById('nombreCorto'),
  nombreCortoHint: document.getElementById('nombreCortoHint'),
  btnAutoShortName: document.getElementById('btnAutoShortName'),
  complementosPills: document.getElementById('complementosPills'),
  customComplementoInput: document.getElementById('customComplementoInput'),
  btnAddComplemento: document.getElementById('btnAddComplemento'),
  fullDisplayName: document.getElementById('fullDisplayName'),
  linkPdf: document.getElementById('linkPdf'),
  linkProducto: document.getElementById('linkProducto'),
  btnOpenPdfLink: document.getElementById('btnOpenPdfLink'),
  btnOpenProductLink: document.getElementById('btnOpenProductLink'),
  previewLink1: document.getElementById('previewLink1'),
  previewLink2: document.getElementById('previewLink2'),
  videoInputsContainer: document.getElementById('videoInputsContainer'),
  btnAddVideo: document.getElementById('btnAddVideo'),
  btnResetForm: document.getElementById('btnResetForm'),
  btnSubmit: document.getElementById('btnSubmit'),
  templateStatusPill: document.getElementById('templateStatusPill'),

  // Inspector
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  tabJsonCode: document.getElementById('tabJsonCode'),
  jsonStats: document.getElementById('jsonStats'),
  jsonPreviewCode: document.getElementById('jsonPreviewCode'),
  btnCopyJson: document.getElementById('btnCopyJson'),
  treePreviewContainer: document.getElementById('treePreviewContainer'),
  historyListContainer: document.getElementById('historyListContainer'),
  historyCount: document.getElementById('historyCount'),

  // Modals
  successModal: document.getElementById('successModal'),
  createdRepoFullPath: document.getElementById('createdRepoFullPath'),
  createdFilesSummary: document.getElementById('createdFilesSummary'),
  modalWarningsContainer: document.getElementById('modalWarningsContainer'),
  btnOpenCreatedLocation: document.getElementById('btnOpenCreatedLocation'),
  btnCloseSuccessModal: document.getElementById('btnCloseSuccessModal'),

  settingsModal: document.getElementById('settingsModal'),
  btnOpenSettings: document.getElementById('btnOpenSettings'),
  btnCloseSettingsModal: document.getElementById('btnCloseSettingsModal'),
  btnCancelSettings: document.getElementById('btnCancelSettings'),
  settingsForm: document.getElementById('settingsForm'),
  settingTemplatePath: document.getElementById('settingTemplatePath'),
  settingDownloadPath: document.getElementById('settingDownloadPath'),
  mappingsTable: document.getElementById('mappingsTable').querySelector('tbody'),

  toast: document.getElementById('toastNotification')
};

function trimManualTextInputs(form) {
  const trimInput = (input) => {
    if (input.id === 'customComplementoInput') return;

    const trimmedValue = input.value.trim();
    if (trimmedValue !== input.value) {
      input.value = trimmedValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  form.addEventListener('focusout', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      trimInput(event.target);
    }
  });

  form.addEventListener('submit', () => {
    form.querySelectorAll('input, textarea').forEach(trimInput);
  }, true);
}

trimManualTextInputs(dom.form);
trimManualTextInputs(dom.settingsForm);

// Notificación Toast
function showToast(message, duration = 3000) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  setTimeout(() => dom.toast.classList.remove('show'), duration);
}

// Cargar configuración desde el servidor
async function loadServerConfig() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    state.config = data;

    // Actualizar indicador de plantillas W:\
    if (data.templatePathConnected) {
      dom.templateStatusPill.className = 'status-pill connected';
      dom.templateStatusPill.querySelector('.status-text').textContent = 'W:\\ Conectado';
      dom.templateStatusPill.title = `Plantillas disponibles en ${data.templatePath}`;
    } else {
      dom.templateStatusPill.className = 'status-pill disconnected';
      dom.templateStatusPill.querySelector('.status-text').textContent = 'W:\\ Sin conexión';
      dom.templateStatusPill.title = `No se pudo acceder a ${data.templatePath}. Verifique la unidad de red.`;
    }

    // Ruta de descarga por defecto
    if (!dom.downloadPath.value) {
      dom.downloadPath.value = data.downloadPath || 'C:\\Repositorios_Productos';
    }

    // Renderizar marcas en select
    renderBrandsSelect(data.brands);

    // Renderizar complementos
    renderComplementos(data.complementos || ['Black', 'Negro', 'White', 'Blanco']);

    // Renderizar historial
    renderHistory(data.history || []);

    // Renderizar mappings en modal de ajustes
    renderMappingsTable(data.tipoxpsMappings || {});

    // Actualizar previsualización inicial
    updateLivePreview();
  } catch (err) {
    console.error('Error cargando configuración:', err);
    showToast('Error conectando con el servidor');
  }
}

// Renderizar select de marcas
function renderBrandsSelect(brands) {
  if (!brands) return;
  dom.marca.innerHTML = '<option value="">(Seleccione una marca)</option>';
  brands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.name;
    opt.textContent = b.keyword ? `${b.name} (${b.keyword})` : b.name;
    dom.marca.appendChild(opt);
  });
}

// Actualizar submarcas al cambiar marca
dom.marca.addEventListener('change', () => {
  const selectedBrandName = dom.marca.value;
  dom.submarca.innerHTML = '';

  if (!selectedBrandName || !state.config) {
    dom.submarca.innerHTML = '<option value="">(Seleccione primero una marca)</option>';
    dom.submarca.disabled = true;
    updateLivePreview();
    return;
  }

  const brandObj = state.config.brands.find(b => b.name === selectedBrandName);
  if (brandObj && brandObj.subbrands && brandObj.subbrands.length > 0) {
    dom.submarca.disabled = false;
    dom.submarca.innerHTML = '<option value="">(Seleccione una submarca)</option>';
    brandObj.subbrands.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      dom.submarca.appendChild(opt);
    });
  } else {
    dom.submarca.disabled = true;
    dom.submarca.innerHTML = '<option value="">(Sin submarcas registradas)</option>';
  }

  updateLivePreview();
});

// Renderizar complementos interactivos
function renderComplementos(list) {
  dom.complementosPills.innerHTML = '';
  list.forEach(item => {
    const pill = document.createElement('div');
    pill.className = `pill-item ${state.activeComplementos.has(item) ? 'active' : ''}`;
    pill.textContent = item;
    pill.addEventListener('click', () => {
      if (state.activeComplementos.has(item)) {
        state.activeComplementos.delete(item);
        pill.classList.remove('active');
      } else {
        state.activeComplementos.add(item);
        pill.classList.add('active');
      }
      updateLivePreview();
    });
    dom.complementosPills.appendChild(pill);
  });
}

// Agregar complemento personalizado
dom.btnAddComplemento.addEventListener('click', () => {
  const val = dom.customComplementoInput.value;
  if (!val.trim()) return;
  state.activeComplementos.add(val);
  if (state.config && !state.config.complementos.includes(val)) {
    state.config.complementos.push(val);
  }
  renderComplementos(state.config ? state.config.complementos : Array.from(state.activeComplementos));
  dom.customComplementoInput.value = '';
  updateLivePreview();
});

dom.customComplementoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    dom.btnAddComplemento.click();
  }
});

// Videos dinámicos
dom.btnAddVideo.addEventListener('click', () => {
  addVideoInput('');
});

function addVideoInput(value = '') {
  const row = document.createElement('div');
  row.className = 'video-input-row';

  const input = document.createElement('input');
  input.type = 'url';
  input.className = 'form-input form-input-sm text-sm';
  input.placeholder = 'https://www.youtube.com/watch?v=...';
  input.value = value;
  input.addEventListener('input', updateLivePreview);

  const btnDel = document.createElement('button');
  btnDel.type = 'button';
  btnDel.className = 'btn-remove-video';
  btnDel.textContent = '✕';
  btnDel.title = 'Eliminar video';
  btnDel.addEventListener('click', () => {
    row.remove();
    updateLivePreview();
  });

  row.appendChild(input);
  row.appendChild(btnDel);
  dom.videoInputsContainer.appendChild(row);
  input.focus();
  updateLivePreview();
}

// Auto-sugerir Nombre Corto
dom.btnAutoShortName.addEventListener('click', () => {
  let name = dom.nombreProducto.value.trim();
  const tipo = dom.tipoxps.value;

  if (!name) {
    showToast('Ingrese primero el Nombre de Producto');
    return;
  }

  // Quitar el tipo del inicio si coincide
  if (tipo && tipo !== 'N/A') {
    const formattedTipo = tipo.replace(/-/g, ' ');
    const regex = new RegExp(`^${formattedTipo}\\s*`, 'i');
    if (regex.test(name)) {
      name = name.replace(regex, '').trim();
    }
  }

  dom.nombreCorto.value = name;
  updateShortNameHint();
  updateLivePreview();
  if (name.length > 30) {
    showToast('El nombre corto supera los 30 caracteres. Debe corregirlo.');
  } else {
    showToast('Nombre corto auto-sugerido');
  }
});

function updateShortNameHint() {
  const length = dom.nombreCorto.value.length;
  const exceedsLimit = length > 30;
  dom.nombreCortoHint.textContent = exceedsLimit
    ? `Tiene ${length}/30 caracteres. Corrija el nombre corto antes de continuar.`
    : `Máximo 30 caracteres (${length}/30).`;
  dom.nombreCortoHint.classList.toggle('invalid', exceedsLimit);
}

dom.nombreCorto.addEventListener('input', updateShortNameHint);

// Validación y contador de 6 dígitos para código de producto
dom.codigoProducto.addEventListener('input', (e) => {
  // Limpiar no numéricos
  let val = e.target.value.replace(/\D/g, '').slice(0, 6);
  e.target.value = val;

  dom.codeCounter.textContent = `${val.length}/6 dígitos`;
  if (val.length === 6) {
    dom.codeCounter.className = 'digit-counter valid';
  } else {
    dom.codeCounter.className = 'digit-counter';
  }

  updateLivePreview();
});

// Escuchadores de eventos para actualización reactiva
[
  dom.numeroParte,
  dom.nombreProducto,
  dom.tipoxps,
  dom.upbaseCaracteristicasTecnicas,
  dom.upbaseNotaImportante,
  dom.submarca,
  dom.nombreCorto,
  dom.linkPdf,
  dom.linkProducto,
  dom.downloadPath
].forEach(el => {
  el.addEventListener('input', updateLivePreview);
  el.addEventListener('change', updateLivePreview);
});

// Cálculo reactivo de JSON y previsualización
function getFormData() {
  const codigo = dom.codigoProducto.value.trim();
  const parte = dom.numeroParte.value.trim();
  const nombre = dom.nombreProducto.value.trim();
  const tipoxps = dom.tipoxps.value;
  const upbaseCaracteristicasTecnicas = dom.upbaseCaracteristicasTecnicas.value.trim();
  const upbaseNotaImportante = dom.upbaseNotaImportante.value.trim();
  const marca = dom.marca.value;
  const submarca = dom.submarca.value;
  const nombreCorto = dom.nombreCorto.value.trim();
  const linkPdf = dom.linkPdf.value.trim();
  const linkProducto = dom.linkProducto.value.trim();

  // Fórmulas especificadas:
  // link1: link-pdf || link-producto || "#"
  // link2: link-producto || link-pdf || "#"
  const link1 = linkPdf || linkProducto || '#';
  const link2 = linkProducto || linkPdf || '#';

  const videos = Array.from(dom.videoInputsContainer.querySelectorAll('input'))
    .map(i => i.value.trim())
    .filter(Boolean);

  const complementos = Array.from(state.activeComplementos);

  return {
    codigo,
    parte,
    nombre,
    tipoxps,
    upbaseCaracteristicasTecnicas,
    upbaseNotaImportante,
    marca,
    submarca,
    nombreCorto,
    complementos,
    linkPdf,
    linkProducto,
    link1,
    link2,
    videos,
    downloadPath: dom.downloadPath.value.trim()
  };
}

function computeProductJson(data) {
  return {
    'codigo-producto': data.codigo || '',
    'numero-parte': data.parte || '',
    'nombre-producto': data.nombre || '',
    'upbase-caracteristicas-tecnicas': data.upbaseCaracteristicasTecnicas || '',
    'upbase-nota-importante': data.upbaseNotaImportante || '',
    'link-pdf': data.linkPdf || '',
    'link-producto': data.linkProducto || '',
    'videos': data.videos,
    'tipoxps': data.tipoxps || '',
    'marca': data.marca || '',
    'submarca': data.submarca || '',
    'nombre-corto': data.nombreCorto || '',
    'complemento-nombre': data.complementos,
    'slogan': '',
    'meta-keywords': [],
    'descripcion': {
      'title': '',
      'p': [],
      'one-line-specs': []
    },
    'caracteristicas': [],
    'specs': [],
    'link1': data.link1,
    'link2': data.link2,
    'posicion': 1
  };
}

function updateLivePreview() {
  const data = getFormData();
  const json = computeProductJson(data);

  // 1. Previsualización de carpeta de repositorio: "[codigo] - [tipo de producto]"
  const folderName = `${data.codigo || '------'} - ${data.tipoxps || 'N/A'}`;
  dom.previewFolderText.textContent = folderName;

  // 2. Previsualización de fórmulas de enlaces
  dom.previewLink1.textContent = data.link1;
  dom.previewLink2.textContent = data.link2;

  // 3. Previsualización de nombre con complementos
  if (data.nombre) {
    const compText = data.complementos.length > 0 ? ` [${data.complementos.join(', ')}]` : '';
    dom.fullDisplayName.textContent = `${data.nombre}${compText}`;
  } else {
    dom.fullDisplayName.textContent = '-';
  }

  // 4. Previsualización de plantillas Photoshop asociadas
  renderPsTemplatesPreview(data.tipoxps);

  // 5. Previsualización de JSON en inspector
  dom.tabJsonCode.textContent = data.codigo ? `${data.codigo}.txt` : 'codigo.txt';
  const jsonStr = JSON.stringify(json, null, 2);
  dom.jsonPreviewCode.textContent = jsonStr;

  const lines = jsonStr.split('\n').length;
  const bytes = new Blob([jsonStr]).size;
  dom.jsonStats.textContent = `${lines} líneas • ${bytes} bytes`;

  // 6. Previsualización de Árbol de Carpetas
  renderFolderTreePreview(folderName, data.codigo, data.tipoxps);
}

// Renderizar previsualización de plantillas PS
function renderPsTemplatesPreview(tipo) {
  dom.psTemplatesContainer.innerHTML = '';
  if (!tipo || !state.config) return;

  const mappings = state.config.tipoxpsMappings[tipo] || {};
  const entries = Object.entries(mappings).filter(([pos, name]) => name && name.trim());

  if (entries.length === 0) {
    dom.psTemplatesContainer.innerHTML = '<span class="text-muted text-xs">Sin plantillas Photoshop asociadas a este tipo.</span>';
    return;
  }

  entries.forEach(([pos, name]) => {
    const tag = document.createElement('span');
    tag.className = 'ps-tag';
    tag.innerHTML = `🖼️ <strong>PS${pos}:</strong> ${pos}-${name}.psd`;
    dom.psTemplatesContainer.appendChild(tag);
  });
}

// Renderizar árbol de carpetas
function renderFolderTreePreview(folderName, codigo, tipoxps) {
  const container = dom.treePreviewContainer;
  container.innerHTML = '';

  const rootDiv = document.createElement('div');
  rootDiv.className = 'tree-node font-bold';
  rootDiv.innerHTML = `📁 <span style="color:#58a6ff;">${folderName}</span>`;
  container.appendChild(rootDiv);

  // docs
  const docsDiv = document.createElement('div');
  docsDiv.className = 'tree-node tree-indent-1';
  docsDiv.innerHTML = `📁 <strong>docs/</strong>`;
  container.appendChild(docsDiv);

  const txtDiv = document.createElement('div');
  txtDiv.className = 'tree-node tree-indent-2';
  txtDiv.innerHTML = `📄 <span style="color:#7ee787;">${codigo || '[codigo]'}.txt</span> <span class="tree-badge tree-badge-ready">JSON generado</span>`;
  container.appendChild(txtDiv);

  // img
  const imgDiv = document.createElement('div');
  imgDiv.className = 'tree-node tree-indent-1';
  imgDiv.innerHTML = `📁 <strong>img/</strong>`;
  container.appendChild(imgDiv);

  const imgSubDiv = document.createElement('div');
  imgSubDiv.className = 'tree-node tree-indent-2';
  imgSubDiv.innerHTML = `📁 img/ <span class="tree-badge tree-badge-empty">vacía</span>`;
  container.appendChild(imgSubDiv);

  const mkSubDiv = document.createElement('div');
  mkSubDiv.className = 'tree-node tree-indent-2';
  mkSubDiv.innerHTML = `📁 mk/ <span class="tree-badge tree-badge-empty">vacía</span>`;
  container.appendChild(mkSubDiv);

  // ps
  const psDiv = document.createElement('div');
  psDiv.className = 'tree-node tree-indent-1';
  psDiv.innerHTML = `📁 <strong>ps/</strong>`;
  container.appendChild(psDiv);

  const mappings = (state.config && state.config.tipoxpsMappings[tipoxps]) || {};
  const psEntries = Object.entries(mappings).filter(([pos, name]) => name && name.trim());

  if (psEntries.length === 0) {
    const emptyPs = document.createElement('div');
    emptyPs.className = 'tree-node tree-indent-2 text-muted';
    emptyPs.innerHTML = `(No se copiarán archivos .psd)`;
    container.appendChild(emptyPs);
  } else {
    psEntries.forEach(([pos, name]) => {
      const fileDiv = document.createElement('div');
      fileDiv.className = 'tree-node tree-indent-2';
      fileDiv.innerHTML = `🖼️ <span style="color:#d2a8ff;">${pos}-${name}.psd</span> <span class="tree-badge tree-badge-ready">desde W:\\</span>`;
      container.appendChild(fileDiv);
    });
  }
}

// Historial
function renderHistory(history) {
  dom.historyCount.textContent = history.length;
  dom.historyListContainer.innerHTML = '';

  if (history.length === 0) {
    dom.historyListContainer.innerHTML = `
      <div class="text-center text-muted" style="padding: 40px 10px;">
        <p>No hay repositorios generados recientemente.</p>
        <span class="text-xs">Los repositorios creados se listarán aquí para acceso rápido.</span>
      </div>
    `;
    return;
  }

  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item';

    const dateStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' +
                    new Date(item.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit' });

    card.innerHTML = `
      <div class="history-top">
        <span class="history-code">${item.codigo}</span>
        <span class="history-time">${dateStr}</span>
      </div>
      <div class="history-title" title="${item.nombre}">
        ${item.nombre}
      </div>
      <div class="text-xs text-muted" style="font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        📁 ${item.repoDir}
      </div>
      <div class="history-actions">
        <button type="button" class="btn btn-secondary btn-sm btn-open-hist" data-path="${encodeURIComponent(item.repoDir)}">
          📂 Abrir ubicación
        </button>
      </div>
    `;

    card.querySelector('.btn-open-hist').addEventListener('click', (e) => {
      const targetPath = decodeURIComponent(e.currentTarget.dataset.path);
      openFolderInWindows(targetPath);
    });

    dom.historyListContainer.appendChild(card);
  });
}

// Abrir carpeta en explorador de Windows vía API
async function openFolderInWindows(folderPath) {
  try {
    const res = await fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath })
    });
    const result = await res.json();
    if (result.success) {
      showToast('Abriendo ubicación en Windows Explorer...');
    } else {
      showToast(`Error: ${result.error || 'No se pudo abrir'}`);
    }
  } catch (err) {
    console.error('Error abriendo carpeta:', err);
    showToast('Error al conectar con el explorador');
  }
}

// Botón de abrir carpeta base
dom.btnOpenBaseFolder.addEventListener('click', () => {
  const p = dom.downloadPath.value.trim();
  if (!p) return showToast('Ingrese una ruta válida');
  openFolderInWindows(p);
});

dom.btnBrowseBaseFolder.addEventListener('click', async () => {
  const button = dom.btnBrowseBaseFolder;
  button.disabled = true;
  button.textContent = 'Buscando...';

  try {
    const res = await fetch('/api/select-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialPath: dom.downloadPath.value.trim() })
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      showToast(`Error: ${result.error || 'No se pudo seleccionar la carpeta'}`);
      return;
    }
    if (result.cancelled) return;

    dom.downloadPath.value = result.path;
    dom.downloadPath.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (err) {
    console.error('Error seleccionando carpeta de destino:', err);
    showToast('Error al abrir el selector de carpetas');
  } finally {
    button.disabled = false;
    button.textContent = '📁 Buscar';
  }
});

function openLinkInBrowser(input) {
  const value = input.value.trim();
  if (!value) {
    showToast('Ingrese primero el enlace que desea verificar');
    input.focus();
    return;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    showToast('Ingrese un enlace válido que comience con http:// o https://');
    input.focus();
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    showToast('Solo se pueden abrir enlaces HTTP o HTTPS');
    input.focus();
    return;
  }

  window.open(url.href, '_blank', 'noopener,noreferrer');
}

dom.btnOpenPdfLink.addEventListener('click', () => openLinkInBrowser(dom.linkPdf));
dom.btnOpenProductLink.addEventListener('click', () => openLinkInBrowser(dom.linkProducto));

// Pestañas del Inspector
dom.tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.tabBtns.forEach(b => b.classList.remove('active'));
    dom.tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.dataset.tab;
    document.getElementById(targetId).classList.add('active');
  });
});

// Copiar JSON
dom.btnCopyJson.addEventListener('click', () => {
  const code = dom.jsonPreviewCode.textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast('JSON copiado al portapapeles');
  }).catch(() => {
    showToast('No se pudo copiar');
  });
});

// Limpiar Formulario
dom.btnResetForm.addEventListener('click', () => {
  if (confirm('¿Está seguro de que desea limpiar todos los campos del formulario?')) {
    dom.form.reset();
    state.activeComplementos.clear();
    dom.videoInputsContainer.innerHTML = '';
    renderComplementos(state.config ? state.config.complementos : ['Black', 'Negro', 'White', 'Blanco']);
    dom.codeCounter.textContent = '0/6 dígitos';
    dom.codeCounter.className = 'digit-counter';
    dom.submarca.innerHTML = '<option value="">(Seleccione primero una marca)</option>';
    dom.submarca.disabled = true;
    updateLivePreview();
    showToast('Formulario restablecido');
  }
});

// Envío del Formulario (Crear Repositorio)
dom.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = getFormData();

  // Validaciones
  if (!/^\d{6}$/.test(data.codigo)) {
    showToast('El código de producto debe tener exactamente 6 dígitos numéricos');
    dom.codigoProducto.focus();
    return;
  }

  if (!data.parte) {
    showToast('El número de parte es obligatorio');
    dom.numeroParte.focus();
    return;
  }

  if (!data.nombre) {
    showToast('El nombre de producto es obligatorio');
    dom.nombreProducto.focus();
    return;
  }

  if (!data.nombreCorto) {
    showToast('El nombre corto es obligatorio');
    dom.nombreCorto.focus();
    return;
  }

  if (data.nombreCorto.length > 30) {
    showToast('El nombre corto supera los 30 caracteres. Debe corregirlo.');
    dom.nombreCorto.focus();
    return;
  }

  if (!data.tipoxps) {
    showToast('Debe seleccionar el Tipo de Producto (tipoxps)');
    dom.tipoxps.focus();
    return;
  }

  // Deshabilitar botón durante proceso
  dom.btnSubmit.disabled = true;
  dom.btnSubmit.textContent = '⏳ Creando Repositorio...';

  try {
    const payload = {
      codigoProducto: data.codigo,
      numeroParte: data.parte,
      nombreProducto: data.nombre,
      upbaseCaracteristicasTecnicas: data.upbaseCaracteristicasTecnicas,
      upbaseNotaImportante: data.upbaseNotaImportante,
      linkPdf: data.linkPdf,
      linkProducto: data.linkProducto,
      videos: data.videos,
      tipoxps: data.tipoxps,
      marca: data.marca,
      submarca: data.submarca,
      nombreCorto: data.nombreCorto,
      complementoNombre: data.complementos,
      downloadPath: data.downloadPath
    };

    const res = await fetch('/api/create-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!result.success) {
      showToast(`Error: ${result.error || 'No se pudo crear el repositorio'}`);
      return;
    }

    // Éxito: Guardar referencia para botón Abrir
    state.lastCreatedRepo = result.repoPath;

    // Mostrar Modal de Éxito
    dom.createdRepoFullPath.textContent = result.repoPath;

    dom.createdFilesSummary.innerHTML = `
      <div class="file-item-summary">📁 <strong>docs/</strong> &rarr; 📄 ${result.txtFile.split(/[\\/]/).pop()} (JSON generado)</div>
      <div class="file-item-summary">📁 <strong>img/</strong> &rarr; img/ (vacía), mk/ (vacía)</div>
    `;

    if (result.copiedFiles && result.copiedFiles.length > 0) {
      result.copiedFiles.forEach(f => {
        const icon = f.status === 'copied' ? '🖼️' : '⚠️';
        const note = f.status === 'copied' ? '(Copiado de W:\\)' : '(Generado como referencia)';
        const row = document.createElement('div');
        row.className = 'file-item-summary';
        row.innerHTML = `${icon} <strong>ps/</strong> &rarr; ${f.name} <span class="text-xs text-muted">${note}</span>`;
        dom.createdFilesSummary.appendChild(row);
      });
    }

    if (result.warnings && result.warnings.length > 0) {
      dom.modalWarningsContainer.style.display = 'block';
      dom.modalWarningsContainer.innerHTML = result.warnings.map(w => `<div>⚠️ ${w}</div>`).join('');
    } else {
      dom.modalWarningsContainer.style.display = 'none';
    }

    dom.successModal.classList.add('active');

    // Recargar configuración e historial
    await loadServerConfig();

  } catch (err) {
    console.error('Error generando repositorio:', err);
    showToast('Error de conexión al crear repositorio');
  } finally {
    dom.btnSubmit.disabled = false;
    dom.btnSubmit.innerHTML = '🚀 Crear Repositorio <span class="kbd-hint">Ctrl + Enter</span>';
  }
});

// Botón "Abrir ubicación" en Modal de Éxito
dom.btnOpenCreatedLocation.addEventListener('click', () => {
  if (state.lastCreatedRepo) {
    openFolderInWindows(state.lastCreatedRepo);
  }
});

dom.btnCloseSuccessModal.addEventListener('click', () => {
  dom.successModal.classList.remove('active');
});

// Modal de Configuración / Ajustes
dom.btnOpenSettings.addEventListener('click', () => {
  if (state.config) {
    dom.settingTemplatePath.value = state.config.templatePath || 'W:\\PLANTILLAS_EDICION_LUIS';
    dom.settingDownloadPath.value = state.config.downloadPath || dom.downloadPath.value;
  }
  dom.settingsModal.classList.add('active');
});

dom.btnCloseSettingsModal.addEventListener('click', () => {
  dom.settingsModal.classList.remove('active');
});

dom.btnCancelSettings.addEventListener('click', () => {
  dom.settingsModal.classList.remove('active');
});

function renderMappingsTable(mappings) {
  dom.mappingsTable.innerHTML = '';
  Object.entries(mappings).forEach(([tipo, slots]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${tipo}</strong></td>
      <td><code>${slots['1'] ? `1-${slots['1']}.psd` : '-'}</code></td>
      <td><code>${slots['2'] ? `2-${slots['2']}.psd` : '-'}</code></td>
      <td><code>${slots['3'] ? `3-${slots['3']}.psd` : '-'}</code></td>
      <td><code>${slots['4'] ? `4-${slots['4']}.psd` : '-'}</code></td>
    `;
    dom.mappingsTable.appendChild(tr);
  });
}

dom.settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const templatePath = dom.settingTemplatePath.value.trim();
  const downloadPath = dom.settingDownloadPath.value.trim();

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templatePath,
        downloadPath
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast('Ajustes guardados correctamente');
      dom.settingsModal.classList.remove('active');
      await loadServerConfig();
    } else {
      showToast('Error al guardar ajustes');
    }
  } catch (err) {
    showToast('Error al conectar con servidor');
  }
});

// Atajo de teclado: Ctrl + Enter para enviar
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    dom.btnSubmit.click();
  }
});

// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  loadServerConfig();
});
