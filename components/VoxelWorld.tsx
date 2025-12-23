import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ToolType, VoxelMap, Voxel } from '../types';
import { BLOCKS } from '../constants';

interface VoxelWorldProps {
  blocks: VoxelMap;
  selectedBlockId: string;
  tool: ToolType;
  onPlaceBlock: (x: number, y: number, z: number) => void;
  onRemoveBlock: (x: number, y: number, z: number) => void;
}

const TEXTURE_BASE_URL = 'https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.20.1/assets/minecraft/textures/block/';

// Helper to resolve texture URL based on block ID
const getTextureUrl = (blockId: string) => {
  const name = blockId.replace('minecraft:', '');
  
  // Custom mappings for common blocks that need specific textures
  const mapping: Record<string, string> = {
    'grass_block': 'grass_block_side',
    'stone': 'stone',
    'dirt': 'dirt',
    'cobblestone': 'cobblestone',
    'oak_log': 'oak_log',
    'spruce_log': 'spruce_log',
    'birch_log': 'birch_log',
    'jungle_log': 'jungle_log',
    'acacia_log': 'acacia_log',
    'dark_oak_log': 'dark_oak_log',
    'oak_planks': 'oak_planks',
    'spruce_planks': 'spruce_planks',
    'birch_planks': 'birch_planks',
    'jungle_planks': 'jungle_planks',
    'acacia_planks': 'acacia_planks',
    'dark_oak_planks': 'dark_oak_planks',
    'bricks': 'bricks',
    'bookshelf': 'bookshelf',
    'gold_block': 'gold_block',
    'iron_block': 'iron_block',
    'diamond_block': 'diamond_block',
    'stone_bricks': 'stone_bricks',
    'mossy_stone_bricks': 'mossy_stone_bricks',
    'cracked_stone_bricks': 'cracked_stone_bricks',
    'chiseled_stone_bricks': 'chiseled_stone_bricks',
    'glass': 'glass', // Glass needs transparency handling
    'sand': 'sand',
    'red_sand': 'red_sand',
    'gravel': 'gravel',
    'bedrock': 'bedrock',
    'obsidian': 'obsidian',
    'snow_block': 'snow',
    'ice': 'ice',
    'packed_ice': 'packed_ice',
    'blue_ice': 'blue_ice',
    'clay': 'clay',
    'pumpkin': 'pumpkin_side',
    'jack_o_lantern': 'jack_o_lantern',
    'netherrack': 'netherrack',
    'soul_sand': 'soul_sand',
    'glowstone': 'glowstone',
    'end_stone': 'end_stone',
    'emerald_block': 'emerald_block',
    'quartz_block': 'quartz_block_side',
    'prismarine': 'prismarine',
    'sea_lantern': 'sea_lantern',
    'hay_block': 'hay_block_side',
    'coal_block': 'coal_block',
    'white_wool': 'white_wool',
    // We can add generic handling for colored wools/concrete etc below
  };

  if (mapping[name]) return `${TEXTURE_BASE_URL}${mapping[name]}.png`;

  // Generic fallbacks
  if (name.includes('wool')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('concrete')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('terracotta')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('stained_glass')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('ore')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('granite')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('diorite')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('andesite')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('log')) return `${TEXTURE_BASE_URL}${name}.png`;
  if (name.includes('planks')) return `${TEXTURE_BASE_URL}${name}.png`;

  // Default to just the name
  return `${TEXTURE_BASE_URL}${name}.png`;
};

const BlockInstancedGroup = ({ blockId, positions }: { blockId: string, positions: Voxel[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Load Texture
  const textureUrl = getTextureUrl(blockId);
  // We use suspense-safe loading. If it fails, we might want a fallback, but useTexture doesn't handle error elegantly without ErrorBoundary. 
  // For MVP, we assume standard blocks load.
  const texture = useTexture(textureUrl, (tex) => {
    if (tex instanceof THREE.Texture) {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
    }
  });

  const blockDef = BLOCKS.find(b => b.id === blockId);
  const isTinted = blockId.includes('grass') || blockId.includes('leaves') || blockId.includes('fern') || blockId.includes('water');
  
  // Determine color: White (untinted) by default, or specific color if tinted
  const color = new THREE.Color(isTinted && blockDef ? blockDef.color : '#FFFFFF');
  const isTransparent = blockId.includes('glass') || blockId.includes('ice');

  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    const tempObject = new THREE.Object3D();
    
    positions.forEach((pos, i) => {
      tempObject.position.set(pos.x, pos.y, pos.z);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [positions, color]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={texture} 
        transparent={isTransparent} 
        opacity={isTransparent ? 0.6 : 1}
        alphaTest={isTransparent ? 0 : 0.5} // Cutout for things like leaves/glass
        side={isTransparent ? THREE.DoubleSide : THREE.FrontSide}
      />
    </instancedMesh>
  );
};

const SceneContent = ({ 
  blocks, 
  tool, 
  onPlaceBlock, 
  onRemoveBlock 
}: VoxelWorldProps) => {
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
  
  // Group blocks by ID for instanced rendering
  const groupedBlocks = useMemo(() => {
    const groups: Record<string, Voxel[]> = {};
    blocks.forEach((voxel) => {
      if (!groups[voxel.blockId]) groups[voxel.blockId] = [];
      groups[voxel.blockId].push(voxel);
    });
    return groups;
  }, [blocks]);

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.intersections.length) {
      setHoverPos(null);
      return;
    }

    const intersect = e.intersections[0];
    const { point, face } = intersect;
    
    if (!face) return;

    const pos = new THREE.Vector3().copy(point);
    
    if (tool === ToolType.PLACE) {
       pos.add(face.normal.clone().multiplyScalar(0.5));
    } else {
       pos.sub(face.normal.clone().multiplyScalar(0.5));
    }

    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);
    const z = Math.floor(pos.z);
    
    setHoverPos([x, y, z]);
  };

  const handlePointerOut = () => setHoverPos(null);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!hoverPos) return;
    if (e.delta > 5) return;

    const [x, y, z] = hoverPos;

    if (tool === ToolType.PLACE) {
      onPlaceBlock(x, y, z);
    } else if (tool === ToolType.REMOVE) {
      onRemoveBlock(x, y, z);
    }
  };

  // Invisible Plane for ground interaction
  const GroundPlane = () => (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.5, 0]} 
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      visible={false}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial />
    </mesh>
  );

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[20, 30, 20]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      
      <group 
        onPointerMove={handlePointerMove} 
        onPointerOut={handlePointerOut} 
        onClick={handleClick}
      >
        {Object.entries(groupedBlocks).map(([blockId, positions]) => (
          <Suspense key={blockId} fallback={null}>
            <BlockInstancedGroup 
              blockId={blockId} 
              positions={positions} 
            />
          </Suspense>
        ))}
      </group>

      <GroundPlane />

      {hoverPos && (
        <mesh position={hoverPos}>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial color="white" wireframe opacity={0.5} transparent />
        </mesh>
      )}

      <Grid 
        position={[0, -0.5, 0]} 
        infiniteGrid 
        fadeDistance={50} 
        cellColor="#666" 
        sectionColor="#888" 
        cellSize={1} 
        sectionSize={10} 
      />
      <Sky sunPosition={[80, 20, 80]} />
      <Environment preset="city" />
    </>
  );
};

const VoxelWorld: React.FC<VoxelWorldProps> = (props) => {
  return (
    <Canvas shadows camera={{ position: [10, 10, 10], fov: 45 }}>
      <SceneContent {...props} />
      <OrbitControls makeDefault />
    </Canvas>
  );
};

export default VoxelWorld;
