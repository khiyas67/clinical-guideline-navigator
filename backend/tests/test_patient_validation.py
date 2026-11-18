import pytest
from app.services.patient_validator import (
    validate_patient_name,
    validate_indian_mobile,
    validate_email_address,
    validate_age_value,
    validate_complete_patient_payload
)

def test_patient_name_validation():
    # Valid names
    ok, err, norm = validate_patient_name("Aarav Sharma")
    assert ok and norm == "Aarav Sharma"

    ok, err, norm = validate_patient_name("Dr. Priya Nair-Deshmukh")
    assert ok and norm == "Dr. Priya Nair-Deshmukh"

    ok, err, norm = validate_patient_name("Mary-Jane O'Connor")
    assert ok and norm == "Mary-Jane O'Connor"

    # Invalid names
    ok, err, _ = validate_patient_name("")
    assert not ok and "required" in err.lower()

    ok, err, _ = validate_patient_name("   ")
    assert not ok and "required" in err.lower()

    ok, err, _ = validate_patient_name("A")
    assert not ok and "at least 2 characters" in err.lower()

    ok, err, _ = validate_patient_name("Aarav123")
    assert not ok and "numbers" in err.lower()

    ok, err, _ = validate_patient_name("Priya@Home!")
    assert not ok and "special characters" in err.lower()

def test_indian_mobile_validation():
    # Valid Indian numbers
    ok, err, norm = validate_indian_mobile("9876543210")
    assert ok and norm == "+91 9876543210"

    ok, err, norm = validate_indian_mobile("+91 9876543210")
    assert ok and norm == "+91 9876543210"

    ok, err, norm = validate_indian_mobile("919876543210")
    assert ok and norm == "+91 9876543210"

    ok, err, norm = validate_indian_mobile("09876543210")
    assert ok and norm == "+91 9876543210"

    ok, err, norm = validate_indian_mobile("+91-78901-23456")
    assert ok and norm == "+91 7890123456"

    # Optional check
    ok, err, norm = validate_indian_mobile("", required=False)
    assert ok and norm is None

    # Invalid numbers
    ok, err, _ = validate_indian_mobile("98765")
    assert not ok and "10 digits" in err.lower()

    ok, err, _ = validate_indian_mobile("987654321099")
    assert not ok and "10 digits" in err.lower()

    ok, err, _ = validate_indian_mobile("5876543210") # starts with 5
    assert not ok and "begin with 6, 7, 8, or 9" in err.lower()

    ok, err, _ = validate_indian_mobile("98765abcde")
    assert not ok and "letters" in err.lower()

    ok, err, _ = validate_indian_mobile("+1 5551234567")
    assert not ok and "only indian country code" in err.lower()

def test_email_validation():
    # Valid emails
    ok, err, norm = validate_email_address("doctor@hospital.com")
    assert ok and norm == "doctor@hospital.com"

    ok, err, norm = validate_email_address("dr.sharma@health.gov.in")
    assert ok and norm == "dr.sharma@health.gov.in"

    # Optional check
    ok, err, norm = validate_email_address("", required=False)
    assert ok and norm is None

    # Invalid emails
    ok, err, _ = validate_email_address("doctor")
    assert not ok and "@" in err

    ok, err, _ = validate_email_address("doctor@")
    assert not ok and "domain" in err.lower()

    ok, err, _ = validate_email_address("@hospital.com")
    assert not ok and "mailbox" in err.lower()

    ok, err, _ = validate_email_address("doctor@hospital")
    assert not ok and "top-level" in err.lower()

    ok, err, _ = validate_email_address(" doctor@hospital.com")
    assert not ok and "leading or trailing" in err.lower()

    ok, err, _ = validate_email_address("doc tor@hospital.com")
    assert not ok and "spaces" in err.lower()

def test_age_validation():
    # Valid ages
    ok, err, norm = validate_age_value(45)
    assert ok and norm == 45

    ok, err, norm = validate_age_value("62")
    assert ok and norm == 62

    # Invalid ages
    ok, err, _ = validate_age_value(-5)
    assert not ok and "negative" in err.lower()

    ok, err, _ = validate_age_value(0)
    assert not ok and "at least 1" in err.lower()

    ok, err, _ = validate_age_value(150)
    assert not ok and "between 1 and 125" in err.lower()

    ok, err, _ = validate_age_value("abc")
    assert not ok and "valid whole number" in err.lower()

def test_complete_patient_payload():
    valid_payload = {
        "full_name": "Aarav Sharma",
        "age": 45,
        "contact": "+91 9876543210",
        "email": "aarav.sharma@example.com",
        "gender": "Male",
        "medical_conditions": ["Hypertension"],
    }
    is_valid, errors, normalized = validate_complete_patient_payload(valid_payload)
    assert is_valid
    assert not errors
    assert normalized["full_name"] == "Aarav Sharma"
    assert normalized["age"] == 45
    assert normalized["contact"] == "+91 9876543210"

    invalid_payload = {
        "full_name": "Aarav123",
        "age": -10,
        "contact": "12345",
        "email": "invalid-email",
    }
    is_valid, errors, _ = validate_complete_patient_payload(invalid_payload)
    assert not is_valid
    assert "full_name" in errors
    assert "age" in errors
    assert "contact" in errors
    assert "email" in errors

