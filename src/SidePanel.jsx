// SidePanel.jsx
import React, { memo } from 'react'

// Кэшируем данные превью
const WALL_PREVIEWS = [
  { type: 'V1', label: 'Базовая', image: '/previews/base.jpg', price: 0 },
  { type: 'Window', label: 'С окном', image: '/previews/window.jpg', price: 15000 },
  { type: 'Door', label: 'С дверью', image: '/previews/door.jpg', price: 20000 }
]

function SidePanel({
  selectedWall,
  selectedContainerId,
  onAddContainer,
  onRemoveContainer,
  onWallTypeChange,
  onGeneratePDF,
  wallTypes,
  totalPrice
}) {
  const currentWallType = selectedWall ? wallTypes[selectedWall.name] || 'V1' : null

  return (
    <div className="side-panel">
      <h2>Панель управления</h2>

      {/* Блок стоимости */}
      <div className="price-section">
        <h3>💰 Общая стоимость</h3>
        <div className="total-price">
          {totalPrice.toLocaleString('ru-RU')} руб.
        </div>
        <p className="price-breakdown">
          {Math.floor(totalPrice / 1000)} тыс. рублей
        </p>
      </div>

      <div className="action-buttons">
        <button 
          onClick={onAddContainer} 
          disabled={!selectedWall}
          title="Добавить контейнер к выбранной стене"
        >
          ➕ Добавить контейнер
        </button>

        <button 
          onClick={onRemoveContainer} 
          disabled={!selectedContainerId}
          title="Удалить выбранный контейнер"
        >
          🗑️ Удалить контейнер
        </button>

        {/* Кнопка генерации PDF */}
        <button 
          onClick={onGeneratePDF}
          title="Скачать схему сборки в PDF"
          className="pdf-button"
        >
          📄 Скачать схему (PDF)
        </button>
      </div>

      {selectedWall && selectedWall.name !== 'roof' && (
        <div className="wall-controls">
          <h3>Тип стены</h3>
          <div className="wall-previews">
            {WALL_PREVIEWS.map(({ type, label, image, price }) => (
              <div 
                key={type}
                className={`preview-item ${currentWallType === type ? 'active' : ''}`}
                onClick={() => onWallTypeChange(selectedWall.name, type)}
                title={`${label} - ${price > 0 ? `+${price.toLocaleString('ru-RU')} руб.` : 'базовая цена'}`}
              >
                <img src={image} alt={label} />
                <div className="preview-info">
                  <span>{label}</span>
                  {price > 0 && (
                    <span className="price-badge">+{price.toLocaleString('ru-RU')} ₽</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedWall && selectedWall.name === 'roof' && (
        <div className="wall-info">
          <h3>🏠 Выбрана крыша</h3>
          <p>Можно добавить контейнер сверху</p>
        </div>
      )}

      {/* Статус выбора */}
      <div className="selection-status">
        <p>
          {selectedContainerId 
            ? `Выбран контейнер #${selectedContainerId}` 
            : 'Контейнер не выбран'}
        </p>
        {selectedWall && (
          <p>Выбрана: {selectedWall.name.replace('wall_', 'стена ').replace('roof', 'крыша')}</p>
        )}
        <p className="hint">💡 Кликните в пустом месте для сброса выбора</p>
      </div>
    </div>
  )
}

export default memo(SidePanel)