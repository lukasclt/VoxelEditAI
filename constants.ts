import { BlockDefinition } from './types';

// Standard 16 colors for Minecraft
const COLORS = [
  { name: 'White', hex: '#F9FFFE', data: 0 },
  { name: 'Orange', hex: '#F9801D', data: 1 },
  { name: 'Magenta', hex: '#C74EBD', data: 2 },
  { name: 'Light Blue', hex: '#3AB3DA', data: 3 },
  { name: 'Yellow', hex: '#FED83D', data: 4 },
  { name: 'Lime', hex: '#80C71F', data: 5 },
  { name: 'Pink', hex: '#F38BAA', data: 6 },
  { name: 'Gray', hex: '#474F52', data: 7 },
  { name: 'Light Gray', hex: '#9D9D97', data: 8 },
  { name: 'Cyan', hex: '#169C9C', data: 9 },
  { name: 'Purple', hex: '#8932B8', data: 10 },
  { name: 'Blue', hex: '#3C44AA', data: 11 },
  { name: 'Brown', hex: '#835432', data: 12 },
  { name: 'Green', hex: '#5E7C16', data: 13 },
  { name: 'Red', hex: '#B02E26', data: 14 },
  { name: 'Black', hex: '#1D1D21', data: 15 },
];

const BASE_BLOCKS: BlockDefinition[] = [
  // Natural
  { id: 'minecraft:stone', name: 'Stone', color: '#7D7D7D', legacyId: 1 },
  { id: 'minecraft:granite', name: 'Granite', color: '#956755', legacyId: 1, legacyData: 1 },
  { id: 'minecraft:polished_granite', name: 'Polished Granite', color: '#956755', legacyId: 1, legacyData: 2 },
  { id: 'minecraft:diorite', name: 'Diorite', color: '#EBEBEB', legacyId: 1, legacyData: 3 },
  { id: 'minecraft:polished_diorite', name: 'Polished Diorite', color: '#EBEBEB', legacyId: 1, legacyData: 4 },
  { id: 'minecraft:andesite', name: 'Andesite', color: '#878787', legacyId: 1, legacyData: 5 },
  { id: 'minecraft:polished_andesite', name: 'Polished Andesite', color: '#878787', legacyId: 1, legacyData: 6 },
  { id: 'minecraft:grass_block', name: 'Grass Block', color: '#4FA634', legacyId: 2 },
  { id: 'minecraft:dirt', name: 'Dirt', color: '#866043', legacyId: 3 },
  { id: 'minecraft:coarse_dirt', name: 'Coarse Dirt', color: '#866043', legacyId: 3, legacyData: 1 },
  { id: 'minecraft:podzol', name: 'Podzol', color: '#593F29', legacyId: 3, legacyData: 2 },
  { id: 'minecraft:cobblestone', name: 'Cobblestone', color: '#5F5F5F', legacyId: 4 },
  { id: 'minecraft:mossy_cobblestone', name: 'Mossy Cobblestone', color: '#5F6F5F', legacyId: 48 },
  
  // Woods (Planks)
  { id: 'minecraft:oak_planks', name: 'Oak Planks', color: '#A2824E', legacyId: 5, legacyData: 0 },
  { id: 'minecraft:spruce_planks', name: 'Spruce Planks', color: '#704F32', legacyId: 5, legacyData: 1 },
  { id: 'minecraft:birch_planks', name: 'Birch Planks', color: '#C9B588', legacyId: 5, legacyData: 2 },
  { id: 'minecraft:jungle_planks', name: 'Jungle Planks', color: '#A2735C', legacyId: 5, legacyData: 3 },
  { id: 'minecraft:acacia_planks', name: 'Acacia Planks', color: '#A65B32', legacyId: 5, legacyData: 4 },
  { id: 'minecraft:dark_oak_planks', name: 'Dark Oak Planks', color: '#422B14', legacyId: 5, legacyData: 5 },
  { id: 'minecraft:mangrove_planks', name: 'Mangrove Planks', color: '#743435', legacyId: 5, legacyData: 0 }, // New wood maps to Oak in legacy
  { id: 'minecraft:cherry_planks', name: 'Cherry Planks', color: '#E6A3B3', legacyId: 5, legacyData: 0 },
  { id: 'minecraft:bamboo_planks', name: 'Bamboo Planks', color: '#E2B84D', legacyId: 5, legacyData: 0 },

  // Woods (Logs)
  { id: 'minecraft:oak_log', name: 'Oak Log', color: '#6B5130', legacyId: 17, legacyData: 0 },
  { id: 'minecraft:spruce_log', name: 'Spruce Log', color: '#3A2510', legacyId: 17, legacyData: 1 },
  { id: 'minecraft:birch_log', name: 'Birch Log', color: '#D6D6D4', legacyId: 17, legacyData: 2 },
  { id: 'minecraft:jungle_log', name: 'Jungle Log', color: '#554419', legacyId: 17, legacyData: 3 },
  { id: 'minecraft:acacia_log', name: 'Acacia Log', color: '#635953', legacyId: 162, legacyData: 0 },
  { id: 'minecraft:dark_oak_log', name: 'Dark Oak Log', color: '#2F2113', legacyId: 162, legacyData: 1 },

  // Natural Elements
  { id: 'minecraft:bedrock', name: 'Bedrock', color: '#303030', legacyId: 7 },
  { id: 'minecraft:sand', name: 'Sand', color: '#DBD3A0', legacyId: 12 },
  { id: 'minecraft:red_sand', name: 'Red Sand', color: '#A95822', legacyId: 12, legacyData: 1 },
  { id: 'minecraft:gravel', name: 'Gravel', color: '#8E8B8B', legacyId: 13 },
  { id: 'minecraft:gold_ore', name: 'Gold Ore', color: '#7D7D7D', legacyId: 14 },
  { id: 'minecraft:iron_ore', name: 'Iron Ore', color: '#7D7D7D', legacyId: 15 },
  { id: 'minecraft:coal_ore', name: 'Coal Ore', color: '#7D7D7D', legacyId: 16 },
  { id: 'minecraft:diamond_ore', name: 'Diamond Ore', color: '#7D7D7D', legacyId: 56 },
  { id: 'minecraft:emerald_ore', name: 'Emerald Ore', color: '#7D7D7D', legacyId: 129 },
  { id: 'minecraft:lapis_ore', name: 'Lapis Ore', color: '#7D7D7D', legacyId: 21 },
  { id: 'minecraft:sponge', name: 'Sponge', color: '#C3C453', legacyId: 19 },
  { id: 'minecraft:glass', name: 'Glass', color: '#AADDF0', legacyId: 20 },
  
  // Construction
  { id: 'minecraft:lapis_block', name: 'Lapis Block', color: '#1E438C', legacyId: 22 },
  { id: 'minecraft:sandstone', name: 'Sandstone', color: '#DBD3A0', legacyId: 24 },
  { id: 'minecraft:chiseled_sandstone', name: 'Chiseled Sandstone', color: '#DBD3A0', legacyId: 24, legacyData: 1 },
  { id: 'minecraft:cut_sandstone', name: 'Cut Sandstone', color: '#DBD3A0', legacyId: 24, legacyData: 2 },
  { id: 'minecraft:red_sandstone', name: 'Red Sandstone', color: '#A95822', legacyId: 179 },
  { id: 'minecraft:brick_block', name: 'Bricks', color: '#966C61', legacyId: 45 },
  { id: 'minecraft:bookshelf', name: 'Bookshelf', color: '#A2824E', legacyId: 47 },
  { id: 'minecraft:obsidian', name: 'Obsidian', color: '#14121D', legacyId: 49 },
  { id: 'minecraft:ice', name: 'Ice', color: '#95BFF0', legacyId: 79 },
  { id: 'minecraft:packed_ice', name: 'Packed Ice', color: '#A7C9ED', legacyId: 174 },
  { id: 'minecraft:blue_ice', name: 'Blue Ice', color: '#74A4FF', legacyId: 174 }, // Fallback
  { id: 'minecraft:snow_block', name: 'Snow Block', color: '#F9FEFE', legacyId: 80 },
  { id: 'minecraft:clay', name: 'Clay', color: '#9DA3A9', legacyId: 82 },
  { id: 'minecraft:pumpkin', name: 'Pumpkin', color: '#C67720', legacyId: 86 },
  { id: 'minecraft:jack_o_lantern', name: 'Jack o Lantern', color: '#C67720', legacyId: 91 },
  { id: 'minecraft:netherrack', name: 'Netherrack', color: '#6F3634', legacyId: 87 },
  { id: 'minecraft:soul_sand', name: 'Soul Sand', color: '#514035', legacyId: 88 },
  { id: 'minecraft:glowstone', name: 'Glowstone', color: '#E1C473', legacyId: 89 },
  { id: 'minecraft:stone_bricks', name: 'Stone Bricks', color: '#7D7D7D', legacyId: 98 },
  { id: 'minecraft:mossy_stone_bricks', name: 'Mossy Stone Bricks', color: '#767D76', legacyId: 98, legacyData: 1 },
  { id: 'minecraft:cracked_stone_bricks', name: 'Cracked Stone Bricks', color: '#777777', legacyId: 98, legacyData: 2 },
  { id: 'minecraft:chiseled_stone_bricks', name: 'Chiseled Stone Bricks', color: '#777777', legacyId: 98, legacyData: 3 },
  { id: 'minecraft:end_stone', name: 'End Stone', color: '#DEE3A9', legacyId: 121 },
  { id: 'minecraft:emerald_block', name: 'Emerald Block', color: '#2DCD62', legacyId: 133 },
  { id: 'minecraft:quartz_block', name: 'Quartz Block', color: '#EBE9E2', legacyId: 155 },
  { id: 'minecraft:chiseled_quartz_block', name: 'Chiseled Quartz', color: '#EBE9E2', legacyId: 155, legacyData: 1 },
  { id: 'minecraft:pillar_quartz_block', name: 'Pillar Quartz', color: '#EBE9E2', legacyId: 155, legacyData: 2 },
  { id: 'minecraft:prismarine', name: 'Prismarine', color: '#59958F', legacyId: 168 },
  { id: 'minecraft:prismarine_bricks', name: 'Prismarine Bricks', color: '#609D94', legacyId: 168, legacyData: 1 },
  { id: 'minecraft:dark_prismarine', name: 'Dark Prismarine', color: '#315A5B', legacyId: 168, legacyData: 2 },
  { id: 'minecraft:sea_lantern', name: 'Sea Lantern', color: '#ACCBC9', legacyId: 169 },
  { id: 'minecraft:hay_block', name: 'Hay Bale', color: '#A58C21', legacyId: 170 },
  { id: 'minecraft:coal_block', name: 'Coal Block', color: '#121212', legacyId: 173 },
  { id: 'minecraft:gold_block', name: 'Gold Block', color: '#FCEE4B', legacyId: 41 },
  { id: 'minecraft:iron_block', name: 'Iron Block', color: '#D8D8D8', legacyId: 42 },
  { id: 'minecraft:diamond_block', name: 'Diamond Block', color: '#5DECF5', legacyId: 57 },
];

const createColoredBlocks = (baseId: string, baseName: string, legacyId: number) => {
  return COLORS.map(c => ({
    id: `minecraft:${c.name.toLowerCase().replace(' ', '_')}_${baseId}`,
    name: `${c.name} ${baseName}`,
    color: c.hex,
    legacyId: legacyId,
    legacyData: c.data
  }));
};

const WOOL_BLOCKS = createColoredBlocks('wool', 'Wool', 35);
const GLASS_BLOCKS = createColoredBlocks('stained_glass', 'Stained Glass', 95);
const CONCRETE_BLOCKS = createColoredBlocks('concrete', 'Concrete', 251);
const TERRACOTTA_BLOCKS = createColoredBlocks('terracotta', 'Terracotta', 159);
// Note: Standard Terracotta (uncolored) is ID 172 in legacy. 
// Hardened Clay is 172. Stained Clay is 159.
// The helper above creates "White Terracotta", etc. We also need plain Terracotta.
const PLAIN_TERRACOTTA = { id: 'minecraft:terracotta', name: 'Terracotta', color: '#976153', legacyId: 172 };

export const BLOCKS: BlockDefinition[] = [
  ...BASE_BLOCKS,
  PLAIN_TERRACOTTA,
  ...WOOL_BLOCKS,
  ...CONCRETE_BLOCKS,
  ...GLASS_BLOCKS,
  ...TERRACOTTA_BLOCKS
];

export const WORLD_SIZE = 32;
export const DEFAULT_CAMERA_POS = [20, 20, 20] as const;
