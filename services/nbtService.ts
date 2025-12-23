import pako from 'pako';
import { VoxelMap } from '../types';
import { BLOCKS } from '../constants';

// Minimal NBT Writer helper class
// This implements a subset of NBT required for Sponge Schematics (.schem) and Classic (.schematic)
class NBTWriter {
  buffer: number[] = [];

  writeByte(val: number) {
    this.buffer.push(val & 0xFF);
  }

  writeShort(val: number) {
    this.buffer.push((val >> 8) & 0xFF);
    this.buffer.push(val & 0xFF);
  }

  writeInt(val: number) {
    this.buffer.push((val >> 24) & 0xFF);
    this.buffer.push((val >> 16) & 0xFF);
    this.buffer.push((val >> 8) & 0xFF);
    this.buffer.push(val & 0xFF);
  }

  writeString(str: string) {
    const utf8 = new TextEncoder().encode(str);
    this.writeShort(utf8.length);
    utf8.forEach(b => this.buffer.push(b));
  }

  // VarInt for BlockData in Schem format
  writeVarInt(value: number) {
    while ((value & -128) !== 0) {
      this.writeByte((value & 127) | 128);
      value >>>= 7;
    }
    this.writeByte(value);
  }

  writeTagType(type: number, name: string) {
    this.writeByte(type);
    this.writeString(name);
  }

  toUint8Array() {
    return new Uint8Array(this.buffer);
  }
}

const TAG_END = 0;
const TAG_BYTE = 1;
const TAG_SHORT = 2;
const TAG_INT = 3;
const TAG_LONG = 4;
const TAG_FLOAT = 5;
const TAG_DOUBLE = 6;
const TAG_BYTE_ARRAY = 7;
const TAG_STRING = 8;
const TAG_LIST = 9;
const TAG_COMPOUND = 10;
const TAG_INT_ARRAY = 11;

// --- MODERN .SCHEM (Sponge) ---
export const generateSchemFile = (blocks: VoxelMap): Uint8Array => {
  // 1. Calculate Bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  if (blocks.size === 0) {
    minX = 0; minY = 0; minZ = 0;
    maxX = 0; maxY = 0; maxZ = 0;
  } else {
    for (const v of blocks.values()) {
      minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); minZ = Math.min(minZ, v.z);
      maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
    }
  }

  const width = (maxX - minX) + 1;
  const height = (maxY - minY) + 1;
  const length = (maxZ - minZ) + 1;

  // 2. Build Palette
  const palette: Record<string, number> = { "minecraft:air": 0 };
  let nextPaletteId = 1;

  blocks.forEach((block) => {
    if (!palette.hasOwnProperty(block.blockId)) {
      palette[block.blockId] = nextPaletteId++;
    }
  });

  // 3. Build Block Data
  const blockDataWriter = new NBTWriter();
  
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        // Find block at absolute pos
        const absX = x + minX;
        const absY = y + minY;
        const absZ = z + minZ;
        const key = `${absX},${absY},${absZ}`;
        const block = blocks.get(key);
        
        const paletteId = block ? palette[block.blockId] : 0;
        blockDataWriter.writeVarInt(paletteId);
      }
    }
  }
  const blockDataBuffer = blockDataWriter.toUint8Array();

  // 4. Write Main NBT Structure
  const nbt = new NBTWriter();
  
  nbt.writeTagType(TAG_COMPOUND, "Schematic");
  nbt.writeTagType(TAG_INT, "Version");
  nbt.writeInt(2); // Sponge Schematic v2
  nbt.writeTagType(TAG_INT, "DataVersion");
  nbt.writeInt(3465); // 1.20.1
  nbt.writeTagType(TAG_COMPOUND, "Metadata");
    nbt.writeTagType(TAG_STRING, "Author");
    nbt.writeString("VoxelEdit AI");
    nbt.writeTagType(TAG_INT, "Date");
    nbt.writeInt(Date.now());
  nbt.writeByte(TAG_END);
  nbt.writeTagType(TAG_SHORT, "Width");
  nbt.writeShort(width);
  nbt.writeTagType(TAG_SHORT, "Height");
  nbt.writeShort(height);
  nbt.writeTagType(TAG_SHORT, "Length");
  nbt.writeShort(length);
  nbt.writeTagType(TAG_INT_ARRAY, "Offset");
  nbt.writeInt(3); // Array length
  nbt.writeInt(minX);
  nbt.writeInt(minY);
  nbt.writeInt(minZ);
  nbt.writeTagType(TAG_COMPOUND, "Palette");
  for (const [key, val] of Object.entries(palette)) {
    nbt.writeTagType(TAG_INT, key);
    nbt.writeInt(val);
  }
  nbt.writeByte(TAG_END);
  nbt.writeTagType(TAG_BYTE_ARRAY, "BlockData");
  nbt.writeInt(blockDataBuffer.length);
  blockDataBuffer.forEach(b => nbt.writeByte(b));
  nbt.writeByte(TAG_END);

  const rawNBT = nbt.toUint8Array();
  return pako.gzip(rawNBT);
};

// --- CLASSIC .SCHEMATIC (MCEdit) ---
export const generateClassicSchematicFile = (blocks: VoxelMap): Uint8Array => {
  // 1. Calculate Bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  if (blocks.size === 0) {
    minX = 0; minY = 0; minZ = 0;
    maxX = 0; maxY = 0; maxZ = 0;
  } else {
    for (const v of blocks.values()) {
      minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); minZ = Math.min(minZ, v.z);
      maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
    }
  }

  const width = (maxX - minX) + 1;
  const height = (maxY - minY) + 1;
  const length = (maxZ - minZ) + 1;

  // 2. Build Byte Arrays
  // Standard format: Y Z X order
  const totalSize = width * height * length;
  const blockArray = new Uint8Array(totalSize);
  const dataArray = new Uint8Array(totalSize);

  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        const absX = x + minX;
        const absY = y + minY;
        const absZ = z + minZ;
        const key = `${absX},${absY},${absZ}`;
        const block = blocks.get(key);
        
        const index = (y * length + z) * width + x;
        
        if (block) {
          const def = BLOCKS.find(b => b.id === block.blockId);
          blockArray[index] = def ? def.legacyId : 1; 
          dataArray[index] = def ? (def.legacyData || 0) : 0;
        } else {
          blockArray[index] = 0; // Air
          dataArray[index] = 0;
        }
      }
    }
  }

  // 3. Write NBT
  const nbt = new NBTWriter();
  nbt.writeTagType(TAG_COMPOUND, "Schematic");
  
  nbt.writeTagType(TAG_SHORT, "Width");
  nbt.writeShort(width);
  nbt.writeTagType(TAG_SHORT, "Height");
  nbt.writeShort(height);
  nbt.writeTagType(TAG_SHORT, "Length");
  nbt.writeShort(length);

  nbt.writeTagType(TAG_STRING, "Materials");
  nbt.writeString("Alpha");

  nbt.writeTagType(TAG_BYTE_ARRAY, "Blocks");
  nbt.writeInt(blockArray.length);
  blockArray.forEach(b => nbt.writeByte(b));

  nbt.writeTagType(TAG_BYTE_ARRAY, "Data");
  nbt.writeInt(dataArray.length);
  dataArray.forEach(b => nbt.writeByte(b));

  // Required empty lists for compatibility
  nbt.writeTagType(TAG_LIST, "Entities");
  nbt.writeByte(TAG_COMPOUND); // Type of list elements
  nbt.writeInt(0); // Length 0

  nbt.writeTagType(TAG_LIST, "TileEntities");
  nbt.writeByte(TAG_COMPOUND);
  nbt.writeInt(0);

  nbt.writeByte(TAG_END);

  const rawNBT = nbt.toUint8Array();
  return pako.gzip(rawNBT);
};
