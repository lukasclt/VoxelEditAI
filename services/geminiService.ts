import { Voxel } from "../types";
import { BLOCKS } from "../constants";

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Helper to format blocks for the AI to understand the current state
const formatBlocksForContext = (blocks: Voxel[]): string => {
  // We limit the context to avoid hitting token limits with large structures
  // A compact string representation: "x,y,z:id"
  const MAX_BLOCKS_CONTEXT = 2000;
  
  if (blocks.length === 0) return "The world is currently empty.";
  
  const blockList = blocks.slice(0, MAX_BLOCKS_CONTEXT).map(b => 
    `{x:${b.x},y:${b.y},z:${b.z},id:"${b.blockId}"}`
  ).join(",");

  if (blocks.length > MAX_BLOCKS_CONTEXT) {
    return `Current structure (truncated to first ${MAX_BLOCKS_CONTEXT} blocks): [${blockList}]`;
  }
  
  return `Current structure: [${blockList}]`;
};

export const editStructure = async (
  currentBlocks: Voxel[],
  prompt: string, 
  apiKey: string, 
  model: string,
  size: number = 32
): Promise<{ voxels: Voxel[], message: string }> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  try {
    const availableBlocks = BLOCKS.map(b => b.id).join(', ');
    const currentContext = formatBlocksForContext(currentBlocks);

    const systemPrompt = `
      You are a Minecraft Voxel Editor AI.
      
      Your goal is to MODIFY the current voxel structure based on the user's request, or CREATE a new one if asked.
      
      CONTEXT:
      ${currentContext}
      
      INSTRUCTIONS:
      1. Analyze the 'Current structure' and the user's 'Prompt'.
      2. Return the FULL updated list of blocks. If you change a block, use the same coordinates with the new ID. If you remove a block, simply omit it from the list.
      3. Coordinates are integers.
      4. Use ONLY these valid block IDs: ${availableBlocks}.
      5. Keep the structure within size ${size}x${size}x${size}.
      
      OUTPUT FORMAT:
      You must return a JSON object strictly following this schema:
      {
        "message": "A short description of what you did (e.g., 'Replaced stone with wood')",
        "blocks": [ 
          { "x": number, "y": number, "z": number, "blockId": string }
        ]
      }
      
      Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "VoxelEdit AI"
      },
      body: JSON.stringify({
        model: model || 'xiaomi/mimo-v2-flash:free',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errData.error?.message || response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    const cleanContent = content.replace(/```json\n?|```/g, "").trim();
    
    let json;
    try {
      json = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI JSON:", cleanContent);
      throw new Error("AI returned invalid JSON. Try a simpler prompt.");
    }
    
    if (json.blocks && Array.isArray(json.blocks)) {
      const validBlocks = json.blocks.filter((b: any) => BLOCKS.some(def => def.id === b.blockId));
      return {
        voxels: validBlocks,
        message: json.message || "Structure updated."
      };
    }
    
    return { voxels: currentBlocks, message: "No changes made." };

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to edit structure.");
  }
};

// Legacy function kept for the modal if needed, but we can reuse logic
export const generateStructure = async (
  prompt: string, 
  apiKey: string, 
  model: string,
  size: number = 32
): Promise<Voxel[]> => {
  const result = await editStructure([], prompt, apiKey, model, size);
  return result.voxels;
};
