import asyncio
import os
import tempfile
import textwrap
import traceback

import subprocess

def _run_sync(script_path: str):
    return subprocess.run(
        ["python", script_path],
        capture_output=True,
        text=True,
        timeout=30.0
    )

async def run_analysis_sandbox(df_path: str, user_question: str, generated_code: str) -> str:
    """
    Executes AI-generated pandas code locally in a subprocess to prevent massive 
    context/memory overload, ensuring mathematical accuracy.
    The script writes stats/JSON to stdout and we capture it.
    """
    # Provide a safe skeleton wrapper with all necessary imports
    wrapper_code = f"""import pandas as pd
import json
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

# Load the exact dataframe
df = pd.read_pickle(r"{df_path}")

# Sandbox injected code
{generated_code}
"""

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(wrapper_code)
        script_path = f.name
    
    try:
        proc = await asyncio.to_thread(_run_sync, script_path)
        
        output = proc.stdout.strip()
        errors = proc.stderr.strip()
        
        if proc.returncode != 0:
            error_output = f"Execution Error:\n{errors}\n\nStdout:\n{output}"
            print(f"[Sandbox] Error: {error_output[:500]}")
            return error_output
        
        if not output:
            return "Warning: No output from sandbox"
        
        return output
    except subprocess.TimeoutExpired:
        return "Error: Code execution timed out after 30 seconds."
    except Exception as e:
        return f"Sandbox error: {str(e)}"
    finally:
        try:
            os.remove(script_path)
        except:
            pass
