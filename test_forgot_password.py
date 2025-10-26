#!/usr/bin/env python3
"""
Test script for forgot password functionality
"""
import requests
import json

# Test configuration
BASE_URL = "http://localhost:8000/api/auth"
TEST_PHONE = "9876543210"  # Replace with a test phone number

def test_forgot_password():
    """Test the forgot password endpoint"""
    print("Testing forgot password endpoint...")
    
    url = f"{BASE_URL}/forgot-password/"
    data = {"phone": TEST_PHONE}
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Forgot password endpoint working!")
            return True
        else:
            print("❌ Forgot password endpoint failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_reset_password():
    """Test the reset password endpoint"""
    print("\nTesting reset password endpoint...")
    
    url = f"{BASE_URL}/reset-password/"
    data = {
        "phone": TEST_PHONE,
        "otp": "123456",  # Test OTP
        "new_password": "newpassword123"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code in [200, 400]:  # 400 is expected for invalid OTP
            print("✅ Reset password endpoint working!")
            return True
        else:
            print("❌ Reset password endpoint failed!")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django server is running.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Forgot Password API Endpoints")
    print("=" * 50)
    
    forgot_success = test_forgot_password()
    reset_success = test_reset_password()
    
    print("\n" + "=" * 50)
    if forgot_success and reset_success:
        print("🎉 All tests passed! Forgot password functionality is working.")
    else:
        print("⚠️  Some tests failed. Check the server logs for details.")
