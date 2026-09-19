import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

from app.main import PipelineRequest, execute_pipeline

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"status": "FAILED", "error": "No input JSON received"}))
            sys.exit(1)

        payload = json.loads(input_data)
        req = PipelineRequest(**payload)
        res = execute_pipeline(req)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"status": "FAILED", "error": str(e)}))
        sys.exit(1)
