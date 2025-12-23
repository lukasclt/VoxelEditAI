export interface BlockDefinition {
  id: string; // e.g., "minecraft:stone"
  name: string;
  color: string;
  legacyId: number; // For .schematic format
  legacyData?: number; // For .schematic format subtypes (metadata)
  texture?: string; // Optional URL for future expansion
}

export interface Voxel {
  x: number;
  y: number;
  z: number;
  blockId: string;
}

export type VoxelMap = Map<string, Voxel>;

export enum ToolType {
  PLACE = 'PLACE',
  REMOVE = 'REMOVE',
  PICK = 'PICK'
}

export interface GenerationConfig {
  prompt: string;
  size: number;
  theme?: string;
}

export interface SchematicMetadata {
  width: number;
  height: number;
  length: number;
  palette: Record<string, number>;
  blockData: Uint8Array;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
