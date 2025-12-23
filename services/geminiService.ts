import { Voxel } from "../types";
import { BLOCKS } from "../constants";

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export const generateStructure = async (
  prompt: string, 
  apiKey: string, 
  model: string,
  size: number = 10
): Promise<Voxel[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in settings.");
  }

  try {
    const availableBlocks = BLOCKS.map(b => b.id).join(', ');

    const systemPrompt = `
      You are a Minecraft architecture expert. 
      Generate a 3D voxel structure based on the user's prompt.
      
      Output format: Strictly valid JSON.
      Structure: { "blocks": [ { "x": number, "y": number, "z": number, "blockId": string } ] }
      
      Constraints:
      - Max size: ${size}x${size}x${size}
      - Coordinates should be centered around 0,0,0 or start at 0,0,0.
      - Use ONLY these block IDs: ${availableBlocks}.
      - Be creative but structural.
      - Do NOT include markdown formatting (like \`\`\`json), just the raw JSON string.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required by OpenRouter
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
      throw new Error(`OpenRouter API Error: ${response.status} - ${errData.error?.message || response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    
    // Cleanup potential markdown wrappers if the model ignores the instruction
    const cleanContent = content.replace(/```json\n?|```/g, "").trim();
    
    const json = JSON.parse(cleanContent);
    
    if (json.blocks && Array.isArray(json.blocks)) {
      // Validate IDs
      return json.blocks.filter((b: any) => BLOCKS.some(def => def.id === b.blockId));
    }
    
    return [];

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate structure.");
  }
};
