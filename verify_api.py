import requests
import sys

def test_api():
    url = "http://localhost:8000/api/predict"
    
    # Create a dummy image for testing
    from PIL import Image
    import io
    
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    # 1. Test Random Image + Text
    print("Testing Random Image + Text...")
    try:
        response = requests.post(url, data={"image_source": "Random", "text_source": "Text", "text": "A red square"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code != 200:
             print("FAILED")
    except Exception as e:
        print(f"FAILED: {e}")

    # 2. Test Image + Random Text
    print("\nTesting Image + Random Text...")
    try:
        files = {'image': ('test.png', img_byte_arr, 'image/png')}
        response = requests.post(url, data={"image_source": "Image", "text_source": "Random"}, files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code != 200:
             print("FAILED")
    except Exception as e:
        print(f"FAILED: {e}")

    # 3. Test Random Both
    print("\nTesting Random Both...")
    try:
        response = requests.post(url, data={"image_source": "Random", "text_source": "Random"})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code != 200:
             print("FAILED")
    except Exception as e:
        print(f"FAILED: {e}")
        
    # 4. Test Standard
    print("\nTesting Standard Image + Text...")
    try:
        files = {'image': ('test.png', img_byte_arr, 'image/png')}
        response = requests.post(url, data={"image_source": "Image", "text_source": "Text", "text": "A red square"}, files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code != 200:
             print("FAILED")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_api()
