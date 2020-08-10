/**
 * supported browsers 
 * Firefox Chrome Safari(Safari iOS >9) Edge
 */

admins = {
    username: "string"
    password: "string"
}

voter = {
    username: "string"
    password: "string"
}

elections = {
    "name": "string",
    "start": "date",
    "end": "date",
    "status": "string",
    "positions": {
        "president": {
            "candidates": {
                "name": "string",
                "picture": {
                    data: "base64 encoded file",
                    type: "string"
                },
                "votes": "integer"
            }
        },
        "vicePresident": {
            "candidates": {}
        },
        "generalSecretary": {
            "candidates": {}
        },
        "financialSecretary": {
            "candidates": {}
        },
        "welfareChairperson": {
            "candidates": {}
        },
        "organa": {
            "candidates": {}
        },
        "assistOrgana": {
            "candidates": {}
        }
    }
}