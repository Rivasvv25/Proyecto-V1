// FloraID — Plant Identification Module

const Identify = {
  selectedFile: null,
  selectedOrgan: 'auto',

  init() {
    this.setupUploadZone();
    this.setupOrganSelector();
    this.setupIdentifyButton();
  },

  setupUploadZone() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    if (!zone || !fileInput) return;

    // Click to upload
    zone.addEventListener('click', (e) => {
      if (e.target.closest('.remove-btn')) return;
      fileInput.click();
    });

    // File selected
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFile(e.dataTransfer.files[0]);
      }
    });

    // Remove button
    const removeBtn = document.getElementById('remove-image');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearImage();
      });
    }
  },

  handleFile(file) {
    if (!file.type.startsWith('image/')) {
      this.showAlert('Por favor selecciona una imagen (JPEG o PNG)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showAlert('La imagen no debe superar los 10 MB', 'error');
      return;
    }

    this.selectedFile = file;
    const zone = document.getElementById('upload-zone');
    const preview = document.getElementById('preview-image');

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      zone.classList.add('has-image');
    };
    reader.readAsDataURL(file);

    // Enable identify button
    const btn = document.getElementById('identify-btn');
    if (btn) btn.disabled = false;
  },

  clearImage() {
    this.selectedFile = null;
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const btn = document.getElementById('identify-btn');

    zone.classList.remove('has-image');
    fileInput.value = '';
    if (btn) btn.disabled = true;

    // Hide results
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) resultsSection.classList.add('hidden');
  },

  setupOrganSelector() {
    const options = document.querySelectorAll('.organ-option');
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        options.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.selectedOrgan = opt.dataset.organ;
      });
    });
  },

  setupIdentifyButton() {
    const btn = document.getElementById('identify-btn');
    if (!btn) return;

    btn.addEventListener('click', () => this.identify());
  },

  async identify() {
    if (!this.selectedFile) {
      this.showAlert('Primero selecciona una imagen', 'error');
      return;
    }

    const btn = document.getElementById('identify-btn');
    const loading = document.getElementById('loading-overlay');
    const resultsSection = document.getElementById('results-section');

    try {
      // Show loading
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Identificando...';
      if (loading) loading.classList.remove('hidden');

      // Get session token
      const session = await Auth.getSession();
      if (!session) {
        window.location.href = 'index.html';
        return;
      }

      // Build form data
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('organ', this.selectedOrgan);
      formData.append('save', 'true');

      // Call edge function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/identify-plant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al identificar la planta');
      }

      const result = await response.json();
      this.displayResults(result);

    } catch (error) {
      this.showAlert(error.message || 'Error al identificar la planta', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '🔍 Identificar Planta';
      if (loading) loading.classList.add('hidden');
    }
  },

  displayResults(data) {
    const section = document.getElementById('results-section');
    const container = document.getElementById('results-container');
    const bestMatch = document.getElementById('best-match');

    if (!section || !container) return;

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Show best match
    if (bestMatch && data.bestMatch) {
      bestMatch.textContent = data.bestMatch;
      bestMatch.parentElement.classList.remove('hidden');
    }

    // Clear old results
    container.innerHTML = '';

    if (!data.results || data.results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🤷</span>
          <h3>No se encontraron resultados</h3>
          <p>Intenta con una imagen más clara o desde otro ángulo</p>
        </div>
      `;
      return;
    }

    // Render results
    data.results.forEach((result, index) => {
      const species = result.species || {};
      const scientificName = species.scientificNameWithoutAuthor || 'Desconocida';
      const commonNames = species.commonNames ? species.commonNames.slice(0, 3).join(', ') : '';
      const family = species.family?.scientificName || '';
      const score = result.score || 0;
      const scorePercent = (score * 100).toFixed(1);

      // Get reference images
      const images = result.images || [];
      const imageHtml = images.slice(0, 3).map(img => {
        const url = img.url?.m || img.url?.s || '';
        return url ? `<img src="${url}" alt="${scientificName}" loading="lazy">` : '';
      }).join('');

      const card = document.createElement('div');
      card.className = 'glass-card result-card animate-fade-in-up';
      card.style.animationDelay = `${index * 100}ms`;
      card.innerHTML = `
        <div class="result-rank">${index + 1}</div>
        ${imageHtml ? `<div class="result-images">${imageHtml}</div>` : ''}
        <div class="result-info">
          <div class="result-name">${scientificName}</div>
          ${commonNames ? `<div class="result-common">${commonNames}</div>` : ''}
          ${family ? `<div class="result-family">Familia: ${family}</div>` : ''}
          <div class="confidence-bar">
            <div class="fill" style="width: ${scorePercent}%"></div>
          </div>
        </div>
        <div class="result-score">
          <div class="score-value">${scorePercent}%</div>
          <div class="score-label">confianza</div>
        </div>
      `;

      container.appendChild(card);
    });

    this.showAlert('¡Planta identificada y guardada en tu historial! 🌿', 'success');
  },

  showAlert(message, type = 'error') {
    const alert = document.getElementById('alert');
    if (!alert) return;

    alert.textContent = message;
    alert.className = `alert alert-${type} show`;

    setTimeout(() => {
      alert.classList.remove('show');
    }, 5000);
  }
};
