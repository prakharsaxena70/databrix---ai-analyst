import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inspectionFile = formData.get("inspection_report") as File;
    const thermalFile = formData.get("thermal_report") as File;

    if (!inspectionFile) {
      return NextResponse.json(
        { error: "Inspection report is required" },
        { status: 400 }
      );
    }

    // Read file contents
    const inspectionBuffer = Buffer.from(await inspectionFile.arrayBuffer());
    const inspectionText = await extractTextFromPDF(inspectionBuffer);

    let thermalText = "";
    if (thermalFile) {
      const thermalBuffer = Buffer.from(await thermalFile.arrayBuffer());
      thermalText = await extractTextFromPDF(thermalBuffer);
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: "Gemini API key not configured",
          message: "Please add GEMINI_API_KEY environment variable in Vercel"
        },
        { status: 500 }
      );
    }

    // Generate DDR using Gemini
    const ddrReport = await generateDDR(inspectionText, thermalText);

    return NextResponse.json({
      status: "success",
      report: ddrReport,
      metadata: {
        inspection_filename: inspectionFile.name,
        thermal_filename: thermalFile?.name || null,
      },
    });
  } catch (error) {
    console.error("DDR Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate DDR report" },
      { status: 500 }
    );
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const text = buffer.toString("utf-8");
    const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, " ");
    return cleanText.length > 100 ? cleanText : "PDF text extraction requires additional libraries";
  } catch (error) {
    return "Error extracting PDF text";
  }
}

async function generateDDR(
  inspectionText: string,
  thermalText: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `You are an expert building diagnostics analyst for UrbanRoof.
Generate a Detailed Diagnostic Report (DDR) based on the following source documents.

=== INSPECTION REPORT ===
${inspectionText.slice(0, 15000)}

=== THERMAL REPORT ===
${thermalText ? thermalText.slice(0, 15000) : "Not provided"}

=== STRICT RULES ===
1. NEVER INVENT FACTS: Only use information present in the source documents.
2. MISSING INFORMATION: Write "Not Available" for any missing details.
3. CONFLICTS: Describe conflicts clearly. Never write "None identified" if you listed conflicts.
4. UNIQUE CONTENT PER AREA:
   - Each area must have unique Severity Assessment reasoning
   - Each area must have unique Recommended Actions (minimum 3)
   - Each area must have unique Probable Root Cause
   - Never copy-paste the same text across areas

=== OUTPUT STRUCTURE ===
Generate a JSON object with this structure:

{
  "property_issue_summary": {
    "summary": "One clear paragraph",
    "key_findings": ["Finding 1", "Finding 2"]
  },
  "areas": [
    {
      "area_name": "Area Name",
      "severity": "Immediate|Moderate|Low",
      "observation": {
        "visual": "What was seen",
        "thermal": "What thermal showed"
      },
      "probable_root_cause": "Specific cause",
      "severity_assessment": {
        "cold_spot_temp": "Temperature",
        "hotspot_temp": "Temperature",
        "reasoning": "Unique reasoning"
      },
      "recommended_actions": ["Action 1", "Action 2", "Action 3"],
      "additional_notes": {
        "thermal_images": ["Image references"],
        "source_linkage": "Source info"
      },
      "missing_information": ["What's unknown"],
      "conflicts": "None identified. OR list conflicts",
      "supporting_images": ["Images OR 'Image Not Available'"]
    }
  ],
  "root_cause_table": [{"area": "", "root_cause": "", "evidence": ""}],
  "severity_table": [{"area": "", "severity": "", "reasoning": ""}],
  "actions_table": [{"area": "", "action": "", "priority": "", "reasoning": ""}],
  "additional_notes": {
    "safety_concerns": [],
    "patterns": [],
    "building_implications": ""
  },
  "missing_information": [],
  "conflicting_details": []
}

Generate the complete DDR JSON now:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Extract JSON from response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("JSON parse error:", e);
  }

  // Return raw text if JSON parsing fails
  return { raw_response: text };
}
