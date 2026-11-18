"""
Patient validation service enforcing demographic, Indian mobile number,
email, name, and age rules for Clinical Navigator.
"""

import re
from typing import Dict, Any, Tuple, Optional

# RFC 5322 compliant regex
RFC_EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)

def validate_patient_name(name: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates patient full name.
    - Required
    - No numbers
    - Minimum 2 alphabetic characters, max 100 characters
    - Allows standard Indian & international names (letters, spaces, dots, hyphens, apostrophes)
    """
    if not name or not name.strip():
        return False, "Patient full name is required.", None

    trimmed = name.strip()

    if len(trimmed) < 2:
        return False, "Patient name must be at least 2 characters.", None

    if len(trimmed) > 100:
        return False, "Patient name cannot exceed 100 characters.", None

    if any(char.isdigit() for char in trimmed):
        return False, "Patient name cannot contain numbers.", None

    if not re.match(r"^[a-zA-Z\s.'\-]+$", trimmed):
        return False, "Patient name contains invalid special characters.", None

    letters = re.findall(r"[a-zA-Z]", trimmed)
    if len(letters) < 2:
        return False, "Patient name must contain at least 2 alphabetic letters.", None

    return True, None, trimmed

def validate_indian_mobile(phone: Optional[str], required: bool = False) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates Indian Mobile Numbers.
    - Must be a 10-digit number starting with 6, 7, 8, or 9
    - Optional prefix: +91, 91, or leading 0
    - Rejects alphabetic characters, symbols, or whitespace-only
    - Normalizes to: +91 XXXXXXXXXX
    """
    if phone is None or phone == "":
        if required:
            return False, "Contact number is required.", None
        return True, None, None

    trimmed = phone.strip()
    if not trimmed:
        if required:
            return False, "Contact number cannot be empty or whitespace.", None
        return True, None, None

    if any(c.isalpha() for c in trimmed):
        return False, "Contact number cannot contain letters.", None

    cleaned = re.sub(r"[\s\-\(\)]", "", trimmed)

    if not re.match(r"^\+?\d+$", cleaned):
        return False, "Contact number contains invalid symbols. Only digits, hyphens, and optional +91 are allowed.", None

    digits = cleaned
    if digits.startswith("+91"):
        digits = digits[3:]
    elif digits.startswith("91") and len(digits) == 12:
        digits = digits[2:]
    elif digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    elif digits.startswith("+"):
        return False, "Only Indian country code (+91) is supported.", None

    if len(digits) < 10:
        return False, f"Indian mobile number has only {len(digits)} digits; exactly 10 digits are required.", None

    if len(digits) > 10:
        return False, f"Indian mobile number has {len(digits)} digits; exactly 10 digits are required (excluding +91).", None

    if not digits[0] in "6789":
        return False, "Indian mobile numbers must begin with 6, 7, 8, or 9.", None

    return True, None, f"+91 {digits}"

def validate_email_address(email: Optional[str], required: bool = False) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates email format strictly.
    - Rejects leading/trailing whitespace
    - Rejects internal whitespace
    - Requires valid local and domain parts
    - TLD must be alphabetic and >= 2 chars
    """
    if email is None or email == "":
        if required:
            return False, "Email address is required.", None
        return True, None, None

    if not email.strip():
        if required:
            return False, "Email address cannot be empty or whitespace.", None
        return True, None, None

    if email.startswith(" ") or email.endsWith(" ") if hasattr(email, "endsWith") else (email.startswith(" ") or email.endswith(" ") or email.startswith("\t") or email.endswith("\t")):
        return False, "Email address must not contain leading or trailing spaces.", None

    if re.search(r"\s", email):
        return False, "Email address must not contain spaces.", None

    if email.count("@") != 1:
        return False, "Email must contain exactly one '@' symbol.", None

    local_part, domain_part = email.split("@")

    if not local_part:
        return False, "Email must have a mailbox name before the '@' symbol.", None

    if len(local_part) > 64:
        return False, "Email mailbox name before '@' cannot exceed 64 characters.", None

    if not domain_part:
        return False, "Email must have a domain name after the '@' symbol.", None

    if "." not in domain_part:
        return False, "Email domain must include a top-level domain (e.g. .com, .org, .in).", None

    if domain_part.startswith(".") or domain_part.endswith("."):
        return False, "Email domain cannot start or end with a dot.", None

    domain_labels = domain_part.split(".")
    tld = domain_labels[-1]

    if len(tld) < 2 or not tld.isalpha():
        return False, "Email top-level domain must contain at least 2 letters (e.g. .com, .in).", None

    for label in domain_labels:
        if not label:
            return False, "Email domain contains consecutive dots.", None
        if not re.match(r"^[a-zA-Z0-9-]+$", label):
            return False, "Email domain contains invalid characters.", None

    if not RFC_EMAIL_REGEX.match(email):
        return False, "Please enter a valid email address (e.g. doctor@hospital.com).", None

    return True, None, email.strip().lower()

def validate_age_value(age: Any) -> Tuple[bool, Optional[str], Optional[int]]:
    """
    Validates age numeric integer.
    - Whole number
    - 1 to 125
    - Rejects negative, zero, and arbitrary text
    """
    if age is None or age == "":
        return False, "Patient age is required.", None

    try:
        val = int(age)
    except (ValueError, TypeError):
        return False, "Age must be a valid whole number.", None

    if val < 0:
        return False, "Age cannot be a negative number.", None

    if val == 0:
        return False, "Age must be at least 1 year.", None

    if val > 125:
        return False, "Age must be a realistic number between 1 and 125.", None

    return True, None, val

def validate_complete_patient_payload(data: Dict[str, Any]) -> Tuple[bool, Dict[str, str], Dict[str, Any]]:
    """
    Validates the entire patient record.
    Returns (is_valid, errors_dict, normalized_dict).
    """
    errors: Dict[str, str] = {}
    normalized: Dict[str, Any] = {}

    # 1. Full name (required)
    name_ok, name_err, norm_name = validate_patient_name(data.get("full_name") or data.get("name"))
    if not name_ok:
        errors["full_name"] = name_err or "Invalid name"
    else:
        normalized["full_name"] = norm_name

    # 2. Age (required)
    age_input = data.get("age")
    if age_input is None and data.get("date_of_birth"):
        # Calculate from DOB if age not directly given
        try:
            from datetime import date
            dob_parts = [int(p) for p in str(data["date_of_birth"]).split("-")]
            birth_date = date(dob_parts[0], dob_parts[1], dob_parts[2])
            today = date.today()
            calc_age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            age_input = calc_age
        except Exception:
            pass

    age_ok, age_err, norm_age = validate_age_value(age_input)
    if not age_ok:
        errors["age"] = age_err or "Invalid age"
    else:
        normalized["age"] = norm_age

    # 3. Contact number (Indian Mobile)
    contact_ok, contact_err, norm_contact = validate_indian_mobile(data.get("contact"), required=False)
    if not contact_ok:
        errors["contact"] = contact_err or "Invalid contact number"
    else:
        normalized["contact"] = norm_contact

    # 4. Email address
    email_ok, email_err, norm_email = validate_email_address(data.get("email"), required=False)
    if not email_ok:
        errors["email"] = email_err or "Invalid email"
    else:
        normalized["email"] = norm_email

    # 5. Date of birth (optional)
    dob = data.get("date_of_birth")
    if dob:
        try:
            from datetime import date
            parts = [int(p) for p in str(dob).split("-")]
            d = date(parts[0], parts[1], parts[2])
            if d > date.today():
                errors["date_of_birth"] = "Date of birth cannot be in the future."
            else:
                normalized["date_of_birth"] = str(dob)
        except Exception:
            errors["date_of_birth"] = "Invalid date format (expected YYYY-MM-DD)."

    # 6. Gender
    gender = data.get("gender")
    if gender:
        normalized["gender"] = str(gender)

    # 7. Other lists
    normalized["medical_conditions"] = data.get("medical_conditions", [])
    normalized["allergies"] = data.get("allergies", [])
    normalized["medications"] = data.get("medications", [])
    normalized["address"] = (data.get("address") or "").strip() or None
    normalized["medical_history"] = (data.get("medical_history") or "").strip() or None

    return len(errors) == 0, errors, normalized

