"""
PLDT Broadband Repair — Customer Lookup Script

Looks up a customer by phone number from the built-in customer database.

Usage:
    python lookup_customer.py --phone <mobile_number>

Options:
    --phone       Customer mobile number (required)

Returns JSON:
    Found:    {"code": 1000, "name": "...", "address": "..."}
    Not found: {"code": 1001, "message": "Customer not found"}

Example:
    python lookup_customer.py --phone "13800001030"
"""

import sys
import json
import argparse


# ============================================================
# Built-in Customer Database
# ============================================================

CUSTOMERS = [
    {"phone": "13800001001", "name": "Alex Zhang", "address": "34 Bayani Road, Barangay Western Bicutan, Taguig City, Metro Manila"},
    {"phone": "13800001002", "name": "Natalie Li", "address": "901 EDSA, Barangay Wack-Wack, Mandaluyong City, Metro Manila"},
    {"phone": "13800001003", "name": "Fiona Wang", "address": "15 Luna Street, Barangay Poblacion, Muntinlupa City, Metro Manila"},
    {"phone": "13800001004", "name": "Jason Chen", "address": "345 Sucat Road, Barangay San Dionisio, Paranaque City, Metro Manila"},
    {"phone": "13800001005", "name": "Kevin Sun", "address": "Unit 7D, Avida Towers, 9th Avenue, Barangay Bonifacio Global City, Taguig City, Metro Manila"},
    {"phone": "13800001006", "name": "Sophie Liu", "address": "34 Bonifacio Drive, Barangay Fort Bonifacio, Taguig City, Metro Manila"},
    {"phone": "13800001007", "name": "Tom Zhou", "address": "Unit 5B, Emerald Tower, Garnet Road, Barangay San Isidro, Paranaque City, Metro Manila"},
    {"phone": "13800001008", "name": "Grace Qian", "address": "Block 8 Lot 5, Villa Cecilia Subdivision, Barangay Mayamot, Antipolo City, Rizal"},
    {"phone": "13800001009", "name": "Mia Zhao", "address": "72 Dela Rosa Street, Barangay Pio Del Pilar, Makati City, Metro Manila"},
    {"phone": "13800001010", "name": "David Wu", "address": "23 Katipunan Avenue, Barangay Loyola Heights, Quezon City, Metro Manila"},
    {"phone": "13800001011", "name": "Helen Huang", "address": "Unit 12C, Pacific Plaza, Ayala Avenue, Barangay San Lorenzo, Makati City, Metro Manila"},
    {"phone": "13800001012", "name": "Brian Xu", "address": "Block 5 Lot 20, Parkplace Village, Barangay BF Homes, Paranaque City, Metro Manila"},
    {"phone": "13800001013", "name": "Ryan Ma", "address": "890 Aurora Boulevard, Barangay Marilag, Quezon City, Metro Manila"},
    {"phone": "13800001014", "name": "Mary Zhu", "address": "102 C5 Road, Barangay Ugong, Pasig City, Metro Manila"},
    {"phone": "13800001015", "name": "Henry Hu", "address": "456 Marcos Highway, Barangay Mayamot, Antipolo City, Rizal"},
    {"phone": "13800001016", "name": "Eric Gao", "address": "Unit 21A, The Columns, Sen. Gil Puyat Avenue, Barangay Bel-Air, Makati City, Metro Manila"},
    {"phone": "13800001017", "name": "Linda Lin", "address": "456 Quezon Boulevard, Barangay Poblacion, Quezon City, Metro Manila"},
    {"phone": "13800001018", "name": "Oscar He", "address": "Unit 3A, One Oasis, Ortigas Avenue Extension, Barangay Sta. Lucia, Pasig City, Metro Manila"},
    {"phone": "13800001019", "name": "Ivy Song", "address": "789 Alabang-Zapote Road, Barangay Ayala Alabang, Muntinlupa City, Metro Manila"},
    {"phone": "13800001020", "name": "Frank Tang", "address": "789 Aguinaldo Highway, Barangay San Roque, Pasig City, Metro Manila"},
    {"phone": "13800001021", "name": "Chris Deng", "address": "Block 1 Lot 8, Greenwoods Village, Barangay San Juan, Cainta, Rizal"},
    {"phone": "13800001022", "name": "Penny Fang", "address": "67 Timog Avenue, Barangay South Triangle, Quezon City, Metro Manila"},
    {"phone": "13800001023", "name": "Coco Qin", "address": "1012 Mabini Street, Barangay Malate, Manila City, Metro Manila"},
    {"phone": "13800001024", "name": "Victor Xie", "address": "88 Roxas Boulevard, Barangay San Rafael, Pasay City, Metro Manila"},
    {"phone": "13800001025", "name": "Yvonne Luo", "address": "567 Shaw Boulevard, Barangay Kapitolyo, Pasig City, Metro Manila"},
    {"phone": "13800001026", "name": "Patrick Pan", "address": "88 Sampaguita Street, Barangay Holy Spirit, Quezon City, Metro Manila"},
    {"phone": "13800001027", "name": "George Jiang", "address": "15 Macapagal Boulevard, Barangay Tambo, Paranaque City, Metro Manila"},
    {"phone": "13800001028", "name": "Danny Ye", "address": "123 Rizal Avenue, Barangay San Antonio, Makati City, Metro Manila"},
    {"phone": "13800001029", "name": "Wendy Wei", "address": "Block 3 Lot 12, Camella Homes, Barangay Santo Tomas, Taguig City, Metro Manila"},
    {"phone": "13800001030", "name": "Ray Cao", "address": "567 Commonwealth Avenue, Barangay Batasan Hills, Quezon City, Metro Manila"},
]


def normalize_phone(phone):
    """Normalize phone number for comparison: keep only digits and leading +"""
    phone = phone.strip()
    if phone.startswith("+"):
        return "+" + "".join(c for c in phone[1:] if c.isdigit())
    return "".join(c for c in phone if c.isdigit())


def lookup_customer(phone):
    """
    Search for a customer by phone number in the built-in database.

    Args:
        phone: Phone number to search for

    Returns:
        dict: Contains code, and name/address if found, or message if not
    """
    normalized_input = normalize_phone(phone)

    for user in CUSTOMERS:
        if normalize_phone(user["phone"]) == normalized_input:
            return {
                "code": 1000,
                "name": user["name"],
                "address": user["address"],
            }

    return {
        "code": 1001,
        "message": "Customer not found",
    }


def main():
    parser = argparse.ArgumentParser(description="PLDT Customer Lookup")
    parser.add_argument("--phone", required=True, help="Customer mobile number")
    args = parser.parse_args()

    result = lookup_customer(args.phone)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    if result["code"] == 1000:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
