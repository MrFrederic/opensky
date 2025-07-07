#!/usr/bin/env python3
"""
Script to create test users for the dropzone management system via API.
This script connects to a running Docker container and creates users via HTTP API calls.
"""

import sys
import os
import json
import getpass
from random import choice, randint
from typing import List, Optional
import requests
from faker import Faker

# Initialize Faker for generating realistic test data
fake = Faker()

# API Configuration
API_BASE_URL = "http://localhost/api/v1"
HEADERS = {"Content-Type": "application/json"}

# User roles enum (matching the backend)
class UserRole:
    TANDEM_JUMPER = "tandem_jumper"
    AFF_STUDENT = "aff_student"
    SPORT_PAID = "sport_paid"
    SPORT_FREE = "sport_free"
    TANDEM_INSTRUCTOR = "tandem_instructor"
    AFF_INSTRUCTOR = "aff_instructor"
    ADMINISTRATOR = "administrator"


def get_access_token() -> str:
    """Prompt user for access token"""
    print("Please provide an admin access token to create users.")
    print("You can obtain this by logging in as an admin user through the API.")
    token = input("Enter access token: ").strip()
    
    if not token:
        print("Access token is required!")
        sys.exit(1)
    
    return token


def verify_token(token: str) -> bool:
    """Verify the access token by making a test API call"""
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE_URL}/users/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print(f"Authenticated as: {user_data.get('first_name', '')} {user_data.get('last_name', '')}")
            return True
        else:
            print(f"Token verification failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {str(e)}")
        return False


def create_user_via_api(token: str, user_data: dict) -> Optional[dict]:
    """Create a user via API call"""
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(f"{API_BASE_URL}/users/", json=user_data, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_detail = response.json().get("detail", "Unknown error") if response.content else "Unknown error"
            print(f"Error creating user: {response.status_code} - {error_detail}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Network error creating user: {str(e)}")
        return None


def create_test_users(token: str, num_users: int = 50):
    """Create test users with various roles and attributes via API"""
    
    # Role distribution (weights for realistic distribution)
    role_weights = {
        UserRole.TANDEM_JUMPER: 40,  # Most users are tandem jumpers
        UserRole.AFF_STUDENT: 20,    # Some AFF students
        UserRole.SPORT_PAID: 15,     # Some sport jumpers (paid)
        UserRole.SPORT_FREE: 10,     # Some sport jumpers (free)
        UserRole.TANDEM_INSTRUCTOR: 8,  # Few tandem instructors
        UserRole.AFF_INSTRUCTOR: 5,     # Fewer AFF instructors
        UserRole.ADMINISTRATOR: 2       # Very few administrators
    }
    
    # Create a weighted list of roles
    roles_list = []
    for role, weight in role_weights.items():
        roles_list.extend([role] * weight)
    
    created_users = []
    
    print(f"Creating {num_users} test users...")
    
    for i in range(num_users):
        # Generate user data
        first_name = fake.first_name()
        last_name = fake.last_name()
        
        # Generate unique telegram_id (using a prefix to avoid conflicts)
        telegram_id = f"test_{randint(100000, 999999)}"
        
        # Sometimes include username, email, phone (optional fields)
        username = fake.user_name() if choice([True, False]) else None
        email = fake.email() if choice([True, False]) else None
        phone = fake.phone_number() if choice([True, False]) else None
        
        # Select a random role
        role = choice(roles_list)
        
        # Create user data for API
        user_data = {
            "telegram_id": telegram_id,
            "first_name": first_name,
            "last_name": last_name,
            "roles": [role]
        }
        
        # Add optional fields if they exist
        if username:
            user_data["username"] = username
        if email:
            user_data["email"] = email
        if phone:
            user_data["phone"] = phone
        
        # Create the user via API
        user = create_user_via_api(token, user_data)
        
        if user:
            created_users.append(user)
            print(f"Created user {i+1}/{num_users}: {first_name} {last_name} ({role}) - ID: {user.get('id')}")
        else:
            print(f"Failed to create user {i+1}/{num_users}: {first_name} {last_name}")
    
    print(f"\nSuccessfully created {len(created_users)} test users!")
    
    # Print summary by role
    role_counts = {}
    for user in created_users:
        user_roles = user.get('roles', [])
        for role_info in user_roles:
            role = role_info.get('role') if isinstance(role_info, dict) else role_info
            role_counts[role] = role_counts.get(role, 0) + 1
    
    print("\nUser distribution by role:")
    for role, count in role_counts.items():
        print(f"  {role}: {count} users")


def create_admin_user(token: str):
    """Create a single admin user for testing via API"""
    
    # Check if we can already access admin endpoints (meaning we're already admin)
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE_URL}/users/?limit=1", headers=headers)
        if response.status_code != 200:
            print("Current token doesn't have admin privileges to create admin user.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error checking admin privileges: {str(e)}")
        return None
    
    # Admin user data
    admin_data = {
        "telegram_id": "admin_test_123",
        "first_name": "Admin",
        "last_name": "User",
        "username": "admin_test",
        "email": "admin@test.com",
        "phone": "+1234567890",
        "roles": [UserRole.ADMINISTRATOR]
    }
    
    admin_user = create_user_via_api(token, admin_data)
    
    if admin_user:
        print(f"Created admin user: {admin_user.get('first_name')} {admin_user.get('last_name')} - ID: {admin_user.get('id')}")
        return admin_user
    else:
        print("Failed to create admin user (may already exist)")
        return None


def create_admin_user_interactive(token: str):
    """Interactive function to create admin user"""
    print("\nDo you want to create an admin user? (y/n): ", end="")
    choice = input().lower().strip()
    
    if choice in ['y', 'yes']:
        print("Creating admin user...")
        return create_admin_user(token)
    else:
        print("Skipping admin user creation.")
        return None


def main():
    """Main function to run the script"""
    # Check if required libraries are available
    try:
        import requests
        from faker import Faker
    except ImportError as e:
        print(f"Required library not found: {e}")
        print("Installing required packages...")
        os.system("pip install requests faker")
        try:
            import requests
            from faker import Faker
        except ImportError:
            print("Failed to install required packages. Please install manually:")
            print("pip install requests faker")
            sys.exit(1)
    
    print("Dropzone Management System - API Test User Creator")
    print("=" * 55)
    print("This script creates test users via API calls to a running Docker container.")
    print("Make sure your backend container is running on http://localhost:8000")
    print()
    
    # Get and verify access token
    token = get_access_token()
    
    print("\nVerifying access token...")
    if not verify_token(token):
        print("Invalid or expired access token. Please try again.")
        sys.exit(1)
    
    print("\nAccess token verified successfully!")
    
    # Ask about creating admin user
    create_admin_user_interactive(token)
    
    # Allow user to specify number of users
    if len(sys.argv) > 1:
        try:
            num_users = int(sys.argv[1])
            if num_users <= 0:
                print("Number of users must be positive. Using default (10).")
                num_users = 10
        except ValueError:
            print("Invalid number of users. Using default (10).")
            num_users = 10
    else:
        # Ask user for number of users
        print(f"\nHow many test users do you want to create? (default: 10): ", end="")
        user_input = input().strip()
        if user_input:
            try:
                num_users = int(user_input)
                if num_users <= 0:
                    print("Number of users must be positive. Using default (10).")
                    num_users = 10
            except ValueError:
                print("Invalid input. Using default (10).")
                num_users = 10
        else:
            num_users = 10

    print(f"\nCreating {num_users} test users...")
    
    # Create test users
    create_test_users(token, num_users)
    
    print("\nTest user creation completed!")
    print("\nYou can now use the created users to test your application.")


if __name__ == "__main__":
    main()
