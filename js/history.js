// FloraID — History Module

const History = {
  async init() {
    await this.loadHistory();
  },

  async loadHistory() {
    const container = document.getElementById('history-grid');
    if (!container) return;

    try {
      const { data, error } = await supabase
        .from('identifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <span class="empty-icon">🌱</span>
            <h3>Aún no has identificado plantas</h3>
            <p>Sube tu primera foto para comenzar a crear tu colección botánica</p>
            <a href="app.html" class="btn btn-primary mt-2">
              📸 Identificar mi primera planta
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      data.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'glass-card history-card animate-fade-in-up';
        card.style.animationDelay = `${index * 80}ms`;

        const commonNames = item.common_names ? item.common_names.slice(0, 2).join(', ') : '';
        const scorePercent = item.score ? (item.score * 100).toFixed(1) : '0';
        const date = new Date(item.created_at).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        // Get an image from raw_result if available
        let imageHtml = '';
        if (item.raw_result?.results?.[0]?.images?.[0]?.url) {
          const imgUrl = item.raw_result.results[0].images[0].url.m || item.raw_result.results[0].images[0].url.s;
          if (imgUrl) {
            imageHtml = `<img class="history-card-image" src="${imgUrl}" alt="${item.plant_name}" loading="lazy">`;
          }
        }

        if (!imageHtml) {
          imageHtml = `<div class="history-card-placeholder">🌿</div>`;
        }

        card.innerHTML = `
          ${imageHtml}
          <div class="history-card-body">
            <div class="history-card-name">${item.plant_name}</div>
            ${commonNames ? `<div class="history-card-common">${commonNames}</div>` : ''}
            <div class="history-card-meta">
              <span>${date} · ${item.organ || 'auto'}</span>
              <span class="history-card-score">${scorePercent}%</span>
            </div>
          </div>
        `;

        container.appendChild(card);
      });

    } catch (error) {
      console.error('Error loading history:', error);
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <span class="empty-icon">⚠️</span>
          <h3>Error al cargar el historial</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
};
