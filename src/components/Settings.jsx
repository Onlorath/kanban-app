import { useRef } from 'react'

const BACKGROUNDS = [
  { id: 'default', label: 'Varsayılan', value: null, preview: null },
  { id: 'gradient1', label: 'Gece Mavisi', value: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #0d47a1 100%)', preview: '#1a237e' },
  { id: 'gradient2', label: 'Orman Yeşili', value: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)', preview: '#2d6a4f' },
  { id: 'gradient3', label: 'Gün Batımı', value: 'linear-gradient(135deg, #6a1b4d 0%, #c62828 50%, #e65100 100%)', preview: '#c62828' },
  { id: 'gradient4', label: 'Mor Bulut', value: 'linear-gradient(135deg, #311b92 0%, #6a1b9a 50%, #ab47bc 100%)', preview: '#6a1b9a' },
  { id: 'gradient5', label: 'Okyanus', value: 'linear-gradient(135deg, #004d61 0%, #00796b 50%, #26a69a 100%)', preview: '#00796b' },
  { id: 'gradient6', label: 'Kömür', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', preview: '#16213e' },
]

export default function Settings({ settings, onUpdate, onClose }) {
  const fileRef = useRef(null)

  const handleBackgroundSelect = (value) => {
    onUpdate({ ...settings, background: value, backgroundUrl: '', backgroundImage: '' })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seçin.')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalı.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      onUpdate({
        ...settings,
        background: null,
        backgroundUrl: '',
        backgroundImage: ev.target.result,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleUrlApply = (url) => {
    if (url.trim()) {
      onUpdate({ ...settings, background: null, backgroundUrl: url.trim(), backgroundImage: '' })
    }
  }

  const hasCustomImage = settings.backgroundImage || settings.backgroundUrl

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Ayarlar</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Arka Plan */}
          <div className="settings-section">
            <h3 className="settings-section-title">Arka Plan</h3>

            <div className="bg-grid">
              {BACKGROUNDS.map((bg) => (
                <div
                  key={bg.id}
                  className={`bg-option ${settings.background === bg.value && !hasCustomImage ? 'active' : ''}`}
                  onClick={() => handleBackgroundSelect(bg.value)}
                >
                  <div
                    className="bg-preview"
                    style={{ background: bg.preview || 'var(--bg)', backgroundImage: bg.value || 'none' }}
                  />
                  <span className="bg-label">{bg.label}</span>
                </div>
              ))}
            </div>

            {/* Dosya yükleme */}
            <div className="bg-upload-section">
              <label className="settings-section-subtitle">Özel Resim</label>
              <div className="bg-upload-row">
                <label className="btn btn-primary bg-upload-btn">
                  📁 Dosyadan Seç
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input-hidden"
                  />
                </label>
                {settings.backgroundImage && (
                  <button
                    className="btn btn-danger"
                    onClick={() => onUpdate({ ...settings, backgroundImage: '' })}
                  >
                    Kaldır
                  </button>
                )}
              </div>

              {settings.backgroundImage && (
                <div className="bg-upload-preview">
                  <img src={settings.backgroundImage} alt="Seçilen arka plan" className="bg-preview-large" />
                </div>
              )}

              {/* URL ile ekleme */}
              <div className="bg-url-row">
                <span className="bg-or-divider">veya URL ile ekle</span>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleUrlApply(e.target.value)
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
              </div>

              {settings.backgroundUrl && !settings.backgroundImage && (
                <div className="bg-current-url">
                  Mevcut URL: <a href={settings.backgroundUrl} target="_blank" rel="noreferrer">{settings.backgroundUrl.substring(0, 50)}...</a>
                  <button className="btn btn-sm btn-danger" onClick={() => onUpdate({ ...settings, backgroundUrl: '' })}>Kaldır</button>
                </div>
              )}
            </div>
          </div>

          {/* Şeffaflık */}
          <div className="settings-section">
            <h3 className="settings-section-title">Kolon Şeffaflığı</h3>
            <div className="settings-row">
              <input
                type="range"
                min="50"
                max="100"
                value={settings.boardOpacity ?? 95}
                onChange={(e) => onUpdate({ ...settings, boardOpacity: Number(e.target.value) })}
                className="settings-range"
              />
              <span className="settings-range-value">{settings.boardOpacity ?? 95}%</span>
            </div>
          </div>

          {/* Bildirimler */}
          <div className="settings-section">
            <h3 className="settings-section-title">Bildirimler</h3>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled !== false}
                onChange={(e) => onUpdate({ ...settings, notificationsEnabled: e.target.checked })}
              />
              <span>Zamanı yaklaşan görevler için bildirim gönder</span>
            </label>
          </div>

          {/* Sıfırla */}
          <div className="settings-section">
            <h3 className="settings-section-title">Veri</h3>
            <button
              className="btn btn-danger-solid"
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
            >
              Tüm Verileri Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
