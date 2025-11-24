// ContainerModel.jsx
import { useGLTF } from '@react-three/drei'
import { useMemo, memo, useCallback } from 'react'
import * as THREE from 'three'

// Константы размеров контейнера для точного позиционирования
const CONTAINER_SIZE = { width: 6, height: 2.5, depth: 2.5 }

// Смещения для позиционирования стен относительно центра контейнера
const WALL_OFFSETS = {
  wall_front: [0, 0, CONTAINER_SIZE.depth/2],
  wall_back: [0, 0, -CONTAINER_SIZE.depth/2],
  wall_right: [CONTAINER_SIZE.width/2, 0, 0],
  wall_left: [-CONTAINER_SIZE.width/2, 0, 0],
  roof: [0, CONTAINER_SIZE.height/2, 0]
}

// Нормали для определения направления добавления новых контейнеров
const WALL_NORMALS = {
  wall_front: [0, 0, 1],
  wall_back: [0, 0, -1],
  wall_right: [1, 0, 0],
  wall_left: [-1, 0, 0],
  roof: [0, 1, 0]
}

// Базовые части контейнера, которые всегда отображаются
const BASE_PARTS = ['Container_Base', 'Floor_V1', 'Roof_V1', 'Camera']

// Стороны стен для динамического выбора типа
const WALL_SIDES = ['Front', 'Back', 'Left', 'Right']

/**
 * Компонент 3D модели контейнера с поддержкой выбора и модификаций
 * Оптимизирован с помощью memo и useMemo для предотвращения лишних ререндеров
 */
function ContainerModel({
  containerId,
  position = [0,0,0],
  selectedContainerId,
  onSelectContainer,
  selectedWallId,
  onSelectWall,
  wallTypes = {},
  ...props
}) {
  // Загрузка 3D модели контейнера
  const { scene } = useGLTF('/models/container.glb')

  // Мемоизация всех мешей модели для быстрого доступа
  const allMeshes = useMemo(() => {
    const list = {}
    scene.traverse((obj) => {
      if (obj.isMesh) {
        list[obj.name] = obj
      }
    })
    return list
  }, [scene])

  /**
   * Фабрика материалов с поддержкой выделения цветом
   * Создает клоны материалов для избежания мутаций
   */
  const createMaterial = useMemo(() => {
    // Цвета для визуального выделения
    const selectedColor = new THREE.Color('#3399ff')
    const wallSelectedColor = new THREE.Color('#ff4f4f')
    
    return (originalMaterial, isSelected, isWallSelected) => {
      if (!originalMaterial) return originalMaterial
      
      // Клонируем материал для изоляции изменений
      const material = originalMaterial.clone()
      
      // Применяем цвета выделения если необходимо
      if (isSelected) {
        if (Array.isArray(material)) {
          // Обработка массива материалов (для сложных объектов)
          return material.map(mat => {
            const clonedMat = mat.clone()
            clonedMat.color = isWallSelected ? wallSelectedColor : selectedColor
            return clonedMat
          })
        } else {
          // Обработка одиночного материала
          material.color = isWallSelected ? wallSelectedColor : selectedColor
        }
      }
      
      return material
    }
  }, [])

  /**
   * Определяет видимые меши на основе выбранных типов стен
   * Оптимизирует отображение показывая только нужные варианты
   */
  const visibleMeshes = useMemo(() => {
    const visible = {}
    
    // Всегда показываем базовые части
    BASE_PARTS.forEach(name => {
      if (allMeshes[name]) visible[name] = allMeshes[name]
    })

    // Динамически выбираем меши стен на основе выбранного типа
    WALL_SIDES.forEach(side => {
      const wallBaseName = `wall_${side.toLowerCase()}`
      const selectedType = wallTypes[wallBaseName] || 'V1'
      
      // Определяем паттерн имени меша в зависимости от типа стены
      const meshPattern = `Wall_${side}_${
        selectedType === 'Door' ? 'Door' : 
        selectedType === 'Window' ? 'Window' : 'V1'
      }`
      
      // Фильтруем меши по паттерну имени
      Object.keys(allMeshes).forEach(meshName => {
        if (meshName.startsWith(meshPattern)) {
          visible[meshName] = allMeshes[meshName]
        }
      })
    })

    return visible
  }, [allMeshes, wallTypes])

  // Флаг выбран ли текущий контейнер
  const isSelected = selectedContainerId === containerId

  /**
   * Обработчик клика по мешам контейнера
   * Останавливает всплытие чтобы не срабатывал сброс выбора на канвасе
   */
  const handleMeshClick = useCallback((e, baseName) => {
    e.stopPropagation() // Критически важно: предотвращаем всплытие до канваса
    
    if (!isSelected) {
      // Выбор контейнера если он еще не выбран
      onSelectContainer(containerId)
    } else if (baseName.includes('wall') || baseName === 'roof') {
      // Выбор конкретной стены или крыши
      onSelectWall({
        containerId,
        name: baseName,
        offset: WALL_OFFSETS[baseName],
        normal: WALL_NORMALS[baseName]
      })
    }
  }, [containerId, isSelected, onSelectContainer, onSelectWall])

  return (
    <group {...props} position={position}>
      {Object.entries(visibleMeshes).map(([name, mesh]) => {
        // Определяем базовое имя для группировки логики выделения
        let baseName = name
        if (name.startsWith('Wall_')) {
          const parts = name.split('_')
          if (parts.length >= 2) {
            baseName = `wall_${parts[1].toLowerCase()}`
          }
        } else if (name === 'Roof_V1') {
          baseName = 'roof'
        }

        // Проверяем выделена ли конкретная стена
        const isWallSelected = isSelected && selectedWallId === baseName
        
        // Создаем материал с учетом выделения
        const material = createMaterial(mesh.material, isSelected, isWallSelected)

        return (
          <mesh
            key={name}
            geometry={mesh.geometry}
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
            material={material}
            castShadow
            receiveShadow
            onClick={(e) => handleMeshClick(e, baseName)}
            onPointerOver={(e) => e.stopPropagation()}
            onPointerOut={(e) => e.stopPropagation()}
          />
        )
      })}
    </group>
  )
}

// Экспортируем с memo для оптимизации - перерисовывается только при изменении props
export default memo(ContainerModel)