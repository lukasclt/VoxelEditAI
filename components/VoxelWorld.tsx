import React, { useState, useRef } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ToolType, Voxel, VoxelMap } from '../types';
import { BLOCKS } from '../constants';

interface VoxelWorldProps {
  blocks: VoxelMap;
  selectedBlockId: string;
  tool: ToolType;
  onPlaceBlock: (x: number, y: number, z: number) => void;
  onRemoveBlock: (x: number, y: number, z: number) => void;
}

const HoverBox = ({ position }: { position: [number, number, number] | null }) => {
  if (!position) return null;
  return (
    <mesh position={position}>
      <boxGeometry args={[1.05, 1.05, 1.05]} />
      <meshBasicMaterial color="white" wireframe opacity={0.8} transparent />
    </mesh>
  );
};

const VoxelInstanced = ({ blocks }: { blocks: VoxelMap }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const blockArray = Array.from(blocks.values());
  
  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    const tempObject = new THREE.Object3D();
    
    blockArray.forEach((voxel, i) => {
      tempObject.position.set(voxel.x, voxel.y, voxel.z);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      const blockDef = BLOCKS.find(b => b.id === voxel.blockId) || BLOCKS[0];
      meshRef.current!.setColorAt(i, new THREE.Color(blockDef.color));
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [blocks]);

  if (blockArray.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, blockArray.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial />
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

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.intersections.length) {
      setHoverPos(null);
      return;
    }

    const intersect = e.intersections[0];
    const { point, face } = intersect;
    
    if (!face) return;

    // Calculate integer grid position
    // If placing, we add normal. If removing/picking, we take the block position directly (floor).
    
    const pos = new THREE.Vector3().copy(point);
    
    // Slight offset to ensure we are inside the intended block volume for floor/ceil logic
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
    
    // Prevent placing intersecting the camera? Optional.
    if (e.delta > 5) return; // Ignore drags

    const [x, y, z] = hoverPos;

    if (tool === ToolType.PLACE) {
      onPlaceBlock(x, y, z);
    } else if (tool === ToolType.REMOVE) {
      onRemoveBlock(x, y, z);
    }
  };

  // Invisible Plane for ground interaction (placing first block)
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
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      
      {/* Existing Blocks */}
      {/* We need to render individual meshes for interaction OR use raycasting on instanced mesh */}
      {/* For editing simplicity, rendering individual meshes is easier to click, but slower. */}
      {/* Let's use a hybrid: Instanced for display, but we raycast against it? */}
      {/* React-three-fiber handles events on InstancedMesh mostly, but finding *which* instance is tricky without instanceId */}
      
      {/* Simplification: Render individual cubes if < 2000 blocks, otherwise switch to Instanced. 
          Given user constraints, let's stick to individual meshes for interaction reliability in a generated MVP. */}
      
      {Array.from(blocks.values()).map((voxel) => {
        const blockDef = BLOCKS.find(b => b.id === voxel.blockId);
        return (
          <mesh 
            key={`${voxel.x},${voxel.y},${voxel.z}`} 
            position={[voxel.x, voxel.y, voxel.z]}
            onClick={handleClick}
            onPointerMove={handlePointerMove}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={blockDef?.color || 'pink'} />
          </mesh>
        );
      })}

      {/* Helper for placing on empty space (ground level) */}
      <GroundPlane />

      <HoverBox position={hoverPos} />

      <Grid position={[0, -0.5, 0]} infiniteGrid fadeDistance={50} cellColor="#555" sectionColor="#888" />
      <Sky sunPosition={[100, 20, 100]} />
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
