# ==========================================================
# BANK REQUEST TYPES
# ==========================================================

BANK_REQUEST_TYPES = {

    "TRANSACTION_DETAILS": {
        "name": "Transaction Details",
        "subject": "Request for Transaction Details",
    },

    "ACCOUNT_DETAILS": {
        "name": "Account Holder Details",
        "subject": "Request for Account Holder Details",
    },

    "KYC_DETAILS": {
        "name": "KYC Details",
        "subject": "Request for KYC Information",
    },
}


# ==========================================================
# TELECOM REQUEST TYPES
# ==========================================================

TELECOM_REQUEST_TYPES = {

    "SUBSCRIBER_DETAILS": {
        "name": "Subscriber Details",
        "subject": "Request for Subscriber Information",
    },

    "CDR": {
        "name": "Call Detail Records",
        "subject": "Request for Call Detail Records",
    },

    "LOCATION_DATA": {
        "name": "Location Information",
        "subject": "Request for Location Information",
    },
}


# ==========================================================
# PLATFORM REQUEST TYPES
# ==========================================================

PLATFORM_REQUEST_TYPES = {

    "ACCOUNT_DETAILS": {
        "name": "Account Information",
        "subject": "Request for Account Information",
    },

    "IP_LOGS": {
        "name": "IP Logs",
        "subject": "Request for IP / Login Information",
    },

    "ACTIVITY_DATA": {
        "name": "Platform Activity",
        "subject": "Request for Platform Activity Information",
    },
}


# ==========================================================
# ALL REQUEST TYPES
# ==========================================================

REQUEST_TYPES = {

    "BANK": BANK_REQUEST_TYPES,

    "TELECOM": TELECOM_REQUEST_TYPES,

    "PLATFORM": PLATFORM_REQUEST_TYPES,
}