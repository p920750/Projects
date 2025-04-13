from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
import time
import re
from supabase import create_client, Client

# Gemini API Setup
GEMINI_API_KEY = "AIzaSyBjWbCU9ler4HsHDLOKhSDz3mtRA3_uXEU"
genai.configure(api_key=GEMINI_API_KEY)

# Supabase Setup
SUPABASE_URL = "https://syaegtheiicdppvtoraj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YWVndGhlaWljZHBwdnRvcmFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg4MDM3MCwiZXhwIjoyMDU5NDU2MzcwfQ.4qDzMsaQfZ4G1rAqcSfeoBhZQ1F3_bfuBfg5mE81hfA"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    message: str = None
    disease_name: str = None
    query: str = None
    user_id: str = None  # optional for multi-user support

def extract_possible_disease(text: str) -> str:
    # Try to extract a proper disease name from freeform text
    match = re.search(r"^(.*?)\,", text)
    if match:
        return match.group(1).strip()
    else:
        # Fallback: extract first sentence
        return text.split('.')[0].strip()

@app.post("/query")
async def query_gemini(request: QueryRequest):
    model_name = "gemini-1.5-flash-8b"

    for attempt in range(3):
        try:
            model = genai.GenerativeModel(model_name)
            user_msg = request.message.lower() if request.message else ""

            # 🔁 Handle Cure Request
            if "what is the solution" in user_msg or "what is the cure" in user_msg:
                response = supabase.table("disease_history").select("*").order("created_at", desc=True).limit(1).execute()

                if response.data:
                    last_entry = response.data[0]
                    disease_name = last_entry['disease_name']
                    disease_info = last_entry['disease_info']
                    print(f"[🧠] Last entry: {disease_name}")

                    if "healthy" in disease_name.lower() or "no disease" in disease_name.lower():
                        return {
                            "response": f"No disease found. '{disease_name}' suggests the plant is healthy. Please describe symptoms for accurate diagnosis."
                        }

                    # If disease name is unknown, try extracting from disease_info
                    if disease_name.lower() == "unknown":
                        extracted_name = extract_possible_disease(disease_info)
                        print(f"[🩺] Extracted disease name from info: {extracted_name}")
                        disease_name = extracted_name

                    prompt = f"What is the cure for the plant disease '{disease_name}'? Please explain in 2-3 sentences including common treatment and prevention methods."
                    gemini_response = model.generate_content(prompt)
                    return {"response": gemini_response.text.strip()}
                else:
                    return {"response": "No previous disease info found. Please ask for a prediction first."}

            # 🧠 Handle normal query
            if request.disease_name:
                prompt = f"Provide a concise description of the plant disease '{request.disease_name}', including symptoms and basic treatment recommendations in 2-3 sentences."
            elif request.message:
                prompt = request.message
            else:
                return {"response": "No valid query provided"}

            response = model.generate_content(prompt)
            final_response = response.text.strip()
            print("Final Gemini response:\n", final_response)

            # ✅ Extract disease name
            match = re.search(r"Top Prediction:\s*(.*?)\s*\((\d+\.\d+%)\)", final_response)
            disease_name = match.group(1).strip() if match else "Unknown"

            # 📤 Save to Supabase
            data_to_insert = {
                "user_id": request.user_id or "anonymous",
                "disease_name": disease_name,
                "disease_info": final_response
            }

            supabase.table("disease_history").insert(data_to_insert).execute()
            print(f"[📤] Disease info saved to Supabase.")

            return {"response": final_response}

        except Exception as e:
            error_msg = str(e)
            print(f"Attempt {attempt + 1}: Error - {error_msg}")
            if "Model is not yet loaded" in error_msg and attempt < 2:
                time.sleep(2)
            else:
                return {"response": f"Error: {error_msg}", "error": True}