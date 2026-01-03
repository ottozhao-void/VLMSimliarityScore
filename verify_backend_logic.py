
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from fastapi.testclient import TestClient
    from main import app
except ImportError as e:
    print(f"Import Error: {e}")
    print("Please ensure fastapi, httpx, and project dependencies are installed.")
    sys.exit(1)

def verify_backend():
    print("Initializing TestClient...")
    client = TestClient(app)

    # 1. Load Model (Use a small one for speed, or assume default)
    # Using a string that maps to a real model or just relying on existing model if loaded?
    # The app global 'state' persists.
    # Let's try to load 'Xenova/clip-vit-base-patch32' which is small ~600MB? 
    # Or just use "openai/clip-vit-large-patch14" (default) but it might take time.
    # We'll assume the user might have loaded a model or we trigger it.
    print("Loading model (this may take time)...")
    load_res = client.post("/api/load_model", json={"model_id": "Xenova/clip-vit-base-patch32", "use_gpu": False})
    if load_res.status_code != 200:
        print(f"Failed to load model: {load_res.json()}")
        # Proceeding anyway might fail
    else:
        print("Model loaded successfully.")

    # 2. Test Scalar: Text vs Text
    print("\n[Test 1] Scalar: Text vs Text")
    data = {
        "source_a_type": "Text",
        "source_b_type": "Text",
        "source_a_text": "A photo of a cat",
        "source_b_text": "A photo of a dog",
        "reparam_sigma": 0.0,
        "text_embed_type": "projected"
    }
    res = client.post("/api/predict", data=data)
    if res.status_code == 200:
        json_res = res.json()
        print(f"Success. Type: {json_res.get('type')}, Score: {json_res.get('score')}")
        assert json_res.get('type') == 'scalar'
        assert 'score' in json_res
    else:
        print(f"Failed: {res.status_code} {res.text}")

    # 3. Test Reparameterization
    print("\n[Test 2] Reparameterization: Text vs Text (Sigma=1.0)")
    data["reparam_sigma"] = 1.0
    res_sigma = client.post("/api/predict", data=data)
    if res_sigma.status_code == 200:
        json_res = res_sigma.json()
        print(f"Success. Type: {json_res.get('type')}, Score: {json_res.get('score')}")
        assert json_res.get('type') == 'scalar'
    else:
        print(f"Failed: {res_sigma.status_code} {res_sigma.text}")

    # 4. Test Pooler Output
    print("\n[Test 3] Text Embed Type: Pooler Output")
    data["reparam_sigma"] = 0.0
    data["text_embed_type"] = "pooler_output"
    res_pooler = client.post("/api/predict", data=data)
    if res_pooler.status_code == 200:
        json_res = res_pooler.json()
        print(f"Success. Type: {json_res.get('type')}, Score: {json_res.get('score')}")
    else:
        print(f"Failed: {res_pooler.status_code} {res_pooler.text}")

    # 5. Test Random vs Random (Scalar)
    print("\n[Test 4] Generic: Random vs Random")
    data = {
        "source_a_type": "Random",
        "source_b_type": "Random",
    }
    res_rand = client.post("/api/predict", data=data) 
    if res_rand.status_code == 200:
        json_res = res_rand.json()
        print(f"Success. Type: {json_res.get('type')}, Score: {json_res.get('score')}")
    else:
        print(f"Failed: {res_rand.status_code} {res_rand.text}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    verify_backend()
