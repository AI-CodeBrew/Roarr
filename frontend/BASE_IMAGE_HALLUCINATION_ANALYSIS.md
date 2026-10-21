# Base Image Generation Hallucination Analysis

## Current Payload Structure

### Code Location
- **File**: `app/routes/app.api.generate-images.jsx`
- **Function**: `generateImageWithGemini()` (lines 427-548)
- **Base Image Prompts**: `app/lib/prompts.js` (lines 9-59)

### Current Payload Sent to Gemini API

```javascript
// Contents array structure (lines 432-482):
contents = [
  // Each reference image as separate Content object
  { role: "user", parts: [{ inlineData: { mimeType, data: base64 } }] }, // Image 1
  { role: "user", parts: [{ inlineData: { mimeType, data: base64 } }] }, // Image 2
  // ... more images
  
  // Intermediate text message (LINE 476)
  { role: "user", parts: [{ text: "These are the base product images for reference" }] },
  
  // Actual prompt (LINE 479-482)
  { role: "user", parts: [{ text: BASE_IMAGE_PROMPT_FRONT/ANGLE/FEATURE }] }
]

// Generation config (lines 486-502)
generationConfig = {
  responseModalities: ["IMAGE"],
  imageConfig: {
    aspectRatio: "1:1",
    imageSize: "1K" // For pro models
  }
}

// NO SYSTEM INSTRUCTION IS SET (CRITICAL ISSUE)
```

### Current Base Image Prompts

#### Front Image Prompt
```
## YOUR TASK
You have received multiple reference images of a product. Generate a NEW studio photograph of this EXACT same product from the front. Use ONLY what you can see in the reference images—reproduce it exactly.

## STRICT FIDELITY RULES (NO HALLUCINATION):
- Reproduce ONLY what is visible in the reference images
- Exact shape, proportions, dimensions, materials, and surface finishes (ONLY as seen in references)
- Exact colors with no shifts or stylization (ONLY colors visible in references)
- Exact labels, text, logos, and branding—ONLY what is visible, sharp and undistorted
- All components present—do not add, remove, or modify any part
- Do NOT invent packaging, labels, or design elements not visible in the reference images
- If you cannot see something clearly in the references, do not invent it

## SHOT
Front-facing view: product centered, fully visible, on pure white background with soft shadow. Photorealistic studio quality.
```

#### Angle Image Prompt
```
## YOUR TASK
You have received multiple reference images of a product. Generate a NEW studio photograph of this EXACT same product from the side. Use ONLY what you can see in the reference images—reproduce it exactly. If the references show multiple items (like a bottle and box), show them in the same arrangement (side-by-side) viewed from the side.

## STRICT FIDELITY RULES (NO HALLUCINATION):
[... same rules as front ...]

## SHOT
Side view showing both front face and one side clearly visible. Product fully visible, on pure white background with soft shadow. Photorealistic studio quality.
```

#### Feature Image Prompt
```
## YOUR TASK
You have received multiple reference images of a product. Generate a NEW studio photograph focusing on one distinctive feature of this EXACT same product. Use ONLY what you can see in the reference images to identify and reproduce the most recognizable feature exactly.

## STRICT FIDELITY RULES (NO HALLUCINATION):
[... same rules as front ...]

## SHOT
Close-up of the most distinctive feature filling the frame. Pure white background. Photorealistic studio quality.
```

## Issues Identified

### 1. **CRITICAL: No System Instruction**
- **Issue**: The Gemini API supports `systemInstruction` parameter, but it's not being used
- **Impact**: Without a system instruction, the model doesn't have persistent context about fidelity requirements
- **Location**: `generateImageWithGemini()` function - no `systemInstruction` in model initialization or `generateContent()` call
- **Evidence**: Lines 429, 508-511 in `app/routes/app.api.generate-images.jsx`

### 2. **Confusing Intermediate Text Message**
- **Issue**: Line 476 sends: `"These are the base product images for reference"`
- **Problem**: This message is ambiguous and might confuse the model about what to do with the images
- **Impact**: The model might interpret this as "use these as inspiration" rather than "reproduce exactly"

### 3. **Prompt Structure Could Be Stronger**
- **Issue**: While prompts have good fidelity rules, they could be more explicit about:
  - What constitutes hallucination (adding elements not in references)
  - Explicit prohibition of creative interpretation
  - Emphasis on pixel-perfect reproduction where possible

### 4. **No Explicit Negative Instructions**
- **Issue**: Prompts don't explicitly state what NOT to do in a separate section
- **Missing**: Clear examples of what would be considered hallucination

### 5. **Model Selection**
- **Current**: Uses `gemini-3-pro-image-preview` with fallback to `gemini-2.5-flash-image-preview`
- **Note**: Pro model should have better fidelity, but without system instruction, both may hallucinate

## Recommendations

### 1. **Add System Instruction (HIGH PRIORITY)**

Add a persistent system instruction that emphasizes fidelity:

```javascript
const SYSTEM_INSTRUCTION = `You are a precision product photography generator. Your ONLY job is to reproduce EXACTLY what you see in reference images. 

CRITICAL RULES:
- NEVER add, modify, or invent any visual elements
- NEVER change colors, shapes, text, logos, or branding
- NEVER add packaging, labels, or design elements not visible in references
- If something is unclear in references, reproduce it as-is, do NOT invent details
- Your output must be a photorealistic studio photograph that matches the reference images exactly`;
```

**Implementation**:
```javascript
// In generateImageWithGemini(), line 429:
const model = genAI.getGenerativeModel({ 
  model: modelName,
  systemInstruction: SYSTEM_INSTRUCTION  // ADD THIS
});
```

### 2. **Remove or Improve Intermediate Text Message**

**Option A: Remove it entirely**
```javascript
// Remove line 476 - images speak for themselves
```

**Option B: Make it more explicit**
```javascript
// Replace line 476 with:
contents.push({
  role: "user",
  parts: [{ text: "Reproduce these reference images exactly. Do not add, modify, or invent any elements." }],
});
```

### 3. **Strengthen Base Image Prompts**

Add explicit negative instructions section:

```javascript
export const BASE_IMAGE_PROMPT_FRONT = `
## YOUR TASK
You have received multiple reference images of a product. Generate a NEW studio photograph of this EXACT same product from the front. Use ONLY what you can see in the reference images—reproduce it exactly.

## STRICT FIDELITY RULES (NO HALLUCINATION):
- Reproduce ONLY what is visible in the reference images
- Exact shape, proportions, dimensions, materials, and surface finishes (ONLY as seen in references)
- Exact colors with no shifts or stylization (ONLY colors visible in references)
- Exact labels, text, logos, and branding—ONLY what is visible, sharp and undistorted
- All components present—do not add, remove, or modify any part
- Do NOT invent packaging, labels, or design elements not visible in the reference images
- If you cannot see something clearly in the references, do not invent it

## EXPLICIT PROHIBITIONS (WHAT NOT TO DO):
- DO NOT add decorative elements, patterns, or graphics not in references
- DO NOT change text, fonts, or label layouts
- DO NOT modify product shape, size, or proportions
- DO NOT add shadows, reflections, or effects beyond what's requested
- DO NOT stylize or artistic interpretation—this is documentary photography
- DO NOT fill in missing details—if it's not visible, don't invent it
- DO NOT "improve" or "enhance" the design—reproduce exactly as-is

## SHOT
Front-facing view: product centered, fully visible, on pure white background with soft shadow. Photorealistic studio quality.
`;
```

### 4. **Add Explicit Fidelity Check in Prompt**

Add a final reminder at the end of each prompt:

```javascript
## FINAL CHECK
Before generating, verify:
1. Every visual element matches the reference images exactly
2. No new elements have been added
3. No existing elements have been modified or removed
4. Colors, text, and branding are identical to references
```

### 5. **Consider Temperature/Determinism Settings**

If Gemini image models support temperature or similar parameters, set them to lower values for more deterministic, less creative output.

## Implementation Priority

1. **IMMEDIATE**: Add system instruction (biggest impact)
2. **HIGH**: Remove/improve intermediate text message
3. **MEDIUM**: Strengthen prompts with explicit prohibitions
4. **LOW**: Add final check reminder

## Testing Recommendations

After implementing changes:
1. Test with products that have clear branding/text
2. Test with products that have multiple components
3. Compare before/after outputs for hallucination
4. Check if system instruction reduces creative interpretation
5. Verify that explicit prohibitions improve fidelity



