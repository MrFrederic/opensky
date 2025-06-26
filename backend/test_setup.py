"""
Basic test to verify the backend setup
"""

def test_imports():
    """Test that all main modules can be imported"""
    try:
        # Test model imports
        from app.models import User, Equipment, Manifest, Load, Jump, Base
        from app.schemas import UserResponse, EquipmentResponse
        from app.crud import user, equipment, manifest
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False

def test_schemas():
    """Test that Pydantic schemas work correctly"""
    try:
        from app.schemas.users import UserCreate
        from app.models.base import UserStatus
        
        # Test creating a schema instance
        user_data = UserCreate(
            telegram_id="123456789",
            first_name="Test",
            last_name="User",
            status=UserStatus.NEWBY
        )
        
        assert user_data.first_name == "Test"
        assert user_data.status == UserStatus.NEWBY
        
        print("✓ Pydantic schemas working correctly")
        return True
    except Exception as e:
        print(f"✗ Schema error: {e}")
        return False

def test_database_models():
    """Test that models are defined correctly"""
    try:
        from app.models import User
        from app.models.base import UserStatus
        
        # Test enum values
        assert UserStatus.NEWBY == "newby"
        assert UserStatus.INSTRUCTOR == "instructor"
        
        # Test that model has expected attributes
        assert hasattr(User, 'telegram_id')
        assert hasattr(User, 'first_name')
        assert hasattr(User, 'status')
        
        print("✓ Database models working correctly")
        return True
    except Exception as e:
        print(f"✗ Database models error: {e}")
        return False

def run_tests():
    """Run all basic tests"""
    print("Running basic backend tests...\n")
    
    tests = [
        test_imports,
        test_schemas,
        test_database_models
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Backend setup looks good.")
    else:
        print("❌ Some tests failed. Check the setup.")

if __name__ == "__main__":
    run_tests()
