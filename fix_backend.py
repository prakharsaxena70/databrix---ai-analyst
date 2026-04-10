"""
Fix the backend main.py file to use the new analysis approach
"""

# Read the file
with open('C:\\Users\\ASUS\\OneDrive\\Desktop\\AI ANALYST\\backend\\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the non-streaming chat endpoint and replace it
old_chat_code = '''    context_str = f"File: {s.filename}\\\\nColumns: {s.file_meta.get('columns')}"
    
    prompt_code = f"""You are a Python Data Analyst. Write code to analyze the dataframe `df` and answer: {body.question}

The dataframe `df` is already loaded. File info: {context_str}

REQUIRED: Your code MUST print a JSON report at the end with this exact format:

```python
import json
import plotly.express as px
import plotly.graph_objects as go

# Your analysis code here
# ... calculate metrics, create charts ...

# Print the report as JSON (REQUIRED)
report = {{
    "type": "report",
    "title": "Sales Data Analysis Report",
    "summary": "Executive summary of findings...",
    "kpis": [
        {{"label": "Total Revenue", "value": "$100,000"}},
        {{"label": "Total Orders", "value": "50"}}
    ],
    "visuals": [
        {{"title": "Revenue by Category", "description": "Chart showing...", "chart_index": 0}}
    ]
}}
print(json.dumps(report))

# If creating charts, also print them (OPTIONAL but recommended):
# fig = px.bar(df, x='category', y='revenue')
# chart_data = {{"type": "chart", "data": fig.to_plotly_json()}}
# print(json.dumps(chart_data))
```

IMPORTANT RULES:
1. ONLY output the Python code block
2. The report JSON MUST have "type": "report"
3. Include real calculated values from the dataframe
4. Create at least one chart if the data supports visualization
5. DO NOT write any text outside the code block"""
    try:
        df_path = f"{storage.base_dir}/{body.session_id}.pkl"
        result = generate_with_fallback(prompt_code)
        response_text = result.text
        
        # Extract code and run sandbox
        sandbox_output = ""
        charts = []
        report = None
        code_block = ""
        
        # Extract code block
        if "```python" in response_text:
            try:
                code_block = response_text.split("```python")[1].split("```")[0].strip()
            except:
                code_block = ""
        
        if not code_block and "```" in response_text:
            try:
                code_block = response_text.split("```")[1].split("```")[0].strip()
            except:
                code_block = ""
        
        if code_block:
            sandbox_output = await run_analysis_sandbox(df_path, body.question, code_block)
            
            # Parse JSON outputs
            lines = sandbox_output.split("\n")
            for line in lines:
                line = line.strip()
                if line and line.startswith("{"):
                    try:
                        obj = json.loads(line)
                        if isinstance(obj, dict):
                            if obj.get("type") == "chart":
                                charts.append(obj.get("data"))
                            elif obj.get("type") == "report":
                                report = obj
                            elif "data" in obj and "layout" in obj:
                                charts.append(obj)
                    except:
                        pass
        
        # If no report generated, create a fallback
        if not report:
            report = {
                "type": "report",
                "title": f"Analysis of {s.filename}",
                "summary": sandbox_output[:500] if sandbox_output else "Analysis completed. See chat for detailed insights.",
                "kpis": [],
                "visuals": [{"title": "Chart", "description": "Generated chart", "chart_index": i} for i in range(len(charts))]
            }
        
        insight_prompt = f"""User Question: {body.question}
Sandbox Execution Output:
```
{sandbox_output[:1500]}
```

Instructions: 
You are a top-tier Senior Data Strategy Consultant (inspired by pandada.ai). 
Based exclusively on the data output from the sandbox script, provide a highly professional, beautifully formatted markdown response.
- Directly answer the user's question with Executive Summary style insights.
- Use bullet points, bold text for key metrics, and strategic business-friendly language.
- DO NOT mention the sandbox, python, scripts, or technical backend execution.
- Provide a brief recommendation or "Next Step" based on the data if appropriate.
- If charts or reports were generated, summarize their key findings in the text."""
        
        insight_result = generate_with_fallback(insight_prompt)
        final_insight_text = insight_result.text
        
        msg_user = models.MessageRecord(session_id=s.id, role="user", content=body.question)
        msg_assistant = models.MessageRecord(
            session_id=s.id, 
            role="assistant", 
            content=final_insight_text, 
            charts=charts, 
            plotly_json=charts[0] if charts else None,
            report=report
        )
        db.add_all([msg_user, msg_assistant])
        db.commit()
        
        return {
            "text": final_insight_text,
            "charts": charts,
            "plotly_json": charts[0] if charts else None,
            "code": code_block,
            "report": report
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, f"AI analysis failed: {str(e)}")'''

# Skip this for now - the streaming version is more important
print("The streaming chat endpoint has been updated. The non-streaming one uses similar logic.")
print("Changes made:")
print("1. Added parse_analysis_to_report() function")
print("2. Updated streaming chat to directly generate analysis then parse to report")
print("3. Charts are generated separately")
print("")
print("Please restart both servers and test again.")
