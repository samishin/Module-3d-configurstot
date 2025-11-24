// App.jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useState, Suspense, useEffect, useCallback } from 'react'
import ContainerModel from './ContainerModel'
import SidePanel from './SidePanel'
import './index.css'

// Предзагрузка модели контейнера
useGLTF.preload('/models/container.glb')

// Константы цен в рублях
const PRICE_CONFIG = {
  BASE_CONTAINER: 100000, // Базовая стоимость контейнера
  WALL_V1: 0, // Базовая стена
  WALL_WINDOW: 15000, // Стена с окном
  WALL_DOOR: 20000, // Стена с дверью
  ROOF: 0 // Крыша (базовая)
}

export default function App() {
  const [selectedContainerId, setSelectedContainerId] = useState(null)
  const [selectedWall, setSelectedWall] = useState(null)
  const [containers, setContainers] = useState([{ id: 1, position: [0,0,0] }])
  const [wallTypes, setWallTypes] = useState({})
  const [showEnvironment, setShowEnvironment] = useState(true)
  const [showSidePanel, setShowSidePanel] = useState(true)

  const containerSize = { width: 6, height: 2.5, depth: 2.5 }

  // Обработчик выбора контейнера
  const handleSelectContainer = useCallback((id) => {
    console.log('Selecting container:', id); // Для отладки
    setSelectedContainerId(id)
    setSelectedWall(null)
  }, [])

  // Обработчик выбора стены
  const handleSelectWall = useCallback((wall) => {
    console.log('Selecting wall:', wall); // Для отладки
    setSelectedWall(wall)
  }, [])

  // Обработчик сброса выбора при клике в пустое место
  const handleDeselectAll = useCallback((event) => {
    // Проверяем, что клик был именно по канвасу (а не по его дочерним элементам)
    if (event.target === event.currentTarget) {
      console.log('Deselecting all'); // Для отладки
      setSelectedContainerId(null)
      setSelectedWall(null)
    }
  }, [])

  // Добавление нового контейнера
  const handleAddContainer = () => {
    if (!selectedWall) {
      alert('Сначала выберите стену или крышу!')
      return
    }

    const baseContainer = containers.find(c => c.id === selectedWall.containerId) || containers.find(c => c.id === selectedContainerId)
    if (!baseContainer) return

    const [bx, by, bz] = baseContainer.position
    const [ox, oy, oz] = selectedWall.offset
    const [nx, ny, nz] = selectedWall.normal

    const newX = bx + ox + nx * containerSize.width / 2
    const newY = by + oy + ny * containerSize.height / 2
    const newZ = bz + oz + nz * containerSize.depth / 2

    const newContainer = { id: Date.now(), position: [newX, newY, newZ] }
    setContainers([...containers, newContainer])
  }

  // Удаление контейнера
  const handleRemoveContainer = () => {
    if (!selectedContainerId) return

    setContainers(containers.filter(c => c.id !== selectedContainerId))
    
    setWallTypes(prev => {
      const newTypes = {...prev}
      delete newTypes[selectedContainerId]
      return newTypes
    })
    
    setSelectedContainerId(null)
    setSelectedWall(null)
  }

  // Изменение типа стены
  const handleWallTypeChange = (wallName, newType) => {
    if (!selectedContainerId || !selectedWall) return
    
    setWallTypes(prev => ({
      ...prev,
      [selectedContainerId]: {
        ...prev[selectedContainerId],
        [wallName]: newType
      }
    }))
  }

  // Расчет общей стоимости в рублях
  const calculateTotalPrice = useCallback(() => {
    let total = 0
    
    containers.forEach(container => {
      // Базовая стоимость контейнера
      total += PRICE_CONFIG.BASE_CONTAINER
      
      // Стоимость модификаций стен
      const containerWalls = wallTypes[container.id] || {}
      Object.values(containerWalls).forEach(wallType => {
        if (wallType === 'Window') total += PRICE_CONFIG.WALL_WINDOW
        if (wallType === 'Door') total += PRICE_CONFIG.WALL_DOOR
      })
    })
    
    return total
  }, [containers, wallTypes])

  // Генерация PDF схемы сборки
  const generateAssemblyPDF = () => {
    // Создаем временную ссылку для скачивания
    const link = document.createElement('a')
    
    // В реальном приложении здесь будет генерация PDF на основе данных контейнеров
    // Сейчас создаем простой текстовый файл с информацией о сборке
    const assemblyData = {
      totalContainers: containers.length,
      containers: containers.map((container, index) => ({
        id: container.id,
        position: container.position,
        walls: wallTypes[container.id] || {}
      })),
      totalPrice: calculateTotalPrice(),
      generationDate: new Date().toLocaleString('ru-RU')
    }
    
    const content = `Схема сборки контейнеров\n\n` +
                   `Общее количество: ${assemblyData.totalContainers}\n` +
                   `Общая стоимость: ${assemblyData.totalPrice.toLocaleString('ru-RU')} руб.\n` +
                   `Дата генерации: ${assemblyData.generationDate}\n\n` +
                   `Детали сборки:\n${assemblyData.containers.map(container => 
                     `Контейнер ${container.id}: позиция [${container.position.join(', ')}]`
                   ).join('\n')}`
    
    const blob = new Blob([content], { type: 'application/pdf' })
    link.href = URL.createObjectURL(blob)
    link.download = `схема-сборки-контейнеров-${Date.now()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    alert('PDF схема сборки генерируется и будет скачана...')
  }

  return (
    <div className="app-layout">
      {/* Тумблеры управления */}
      <div className="controls-toggles">
        <label className="toggle-item">
          <input 
            type="checkbox" 
            checked={showEnvironment}
            onChange={(e) => setShowEnvironment(e.target.checked)}
          />
          <span>Окружение</span>
        </label>
        <label className="toggle-item">
          <input 
            type="checkbox" 
            checked={showSidePanel}
            onChange={(e) => setShowSidePanel(e.target.checked)}
          />
          <span>Панель управления</span>
        </label>
      </div>

      <div className="canvas-wrapper" onClick={handleDeselectAll}>
        <Canvas 
          camera={{ position: [12,8,12], fov: 45 }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5,10,5]} intensity={1} />
          
          <Suspense fallback={null}>
            {showEnvironment && (
              <Environment
                files="/noon_grass_4k.hdr"
                background
                ground={{
                  height: 3,
                  radius: 100,
                  scale: 100
                }}
              />
            )}
          </Suspense>

          {containers.map((c) => (
            <ContainerModel
              key={c.id}
              containerId={c.id}
              position={c.position}
              selectedContainerId={selectedContainerId}
              selectedWallId={selectedWall?.name}
              onSelectContainer={handleSelectContainer}
              onSelectWall={handleSelectWall}
              wallTypes={wallTypes[c.id] || {}}
            />
          ))}

          <OrbitControls
            makeDefault
            minDistance={20}
            maxDistance={40}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </div>

      {showSidePanel && (
        <SidePanel
          selectedWall={selectedWall}
          selectedContainerId={selectedContainerId}
          onAddContainer={handleAddContainer}
          onRemoveContainer={handleRemoveContainer}
          onWallTypeChange={handleWallTypeChange}
          onGeneratePDF={generateAssemblyPDF}
          wallTypes={wallTypes[selectedContainerId] || {}}
          totalPrice={calculateTotalPrice()}
        />
      )}
    </div>
  )
}