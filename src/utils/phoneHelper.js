export const DIAL_CODES = [
    { dialCode: "+1", countryCode: "us" },
    { dialCode: "+7", countryCode: "ru" },
    { dialCode: "+20", countryCode: "eg" },
    { dialCode: "+27", countryCode: "za" },
    { dialCode: "+30", countryCode: "gr" },
    { dialCode: "+31", countryCode: "nl" },
    { dialCode: "+32", countryCode: "be" },
    { dialCode: "+33", countryCode: "fr" },
    { dialCode: "+34", countryCode: "es" },
    { dialCode: "+36", countryCode: "hu" },
    { dialCode: "+39", countryCode: "it" },
    { dialCode: "+40", countryCode: "ro" },
    { dialCode: "+41", countryCode: "ch" },
    { dialCode: "+43", countryCode: "at" },
    { dialCode: "+44", countryCode: "gb" },
    { dialCode: "+45", countryCode: "dk" },
    { dialCode: "+46", countryCode: "se" },
    { dialCode: "+47", countryCode: "no" },
    { dialCode: "+48", countryCode: "pl" },
    { dialCode: "+49", countryCode: "de" },
    { dialCode: "+51", countryCode: "pe" },
    { dialCode: "+52", countryCode: "mx" },
    { dialCode: "+53", countryCode: "cu" },
    { dialCode: "+54", countryCode: "ar" },
    { dialCode: "+55", countryCode: "br" },
    { dialCode: "+56", countryCode: "cl" },
    { dialCode: "+57", countryCode: "co" },
    { dialCode: "+58", countryCode: "ve" },
    { dialCode: "+60", countryCode: "my" },
    { dialCode: "+61", countryCode: "au" },
    { dialCode: "+62", countryCode: "id" },
    { dialCode: "+63", countryCode: "ph" },
    { dialCode: "+64", countryCode: "nz" },
    { dialCode: "+65", countryCode: "sg" },
    { dialCode: "+66", countryCode: "th" },
    { dialCode: "+81", countryCode: "jp" },
    { dialCode: "+82", countryCode: "kr" },
    { dialCode: "+84", countryCode: "vn" },
    { dialCode: "+86", countryCode: "cn" },
    { dialCode: "+90", countryCode: "tr" },
    { dialCode: "+91", countryCode: "in" },
    { dialCode: "+92", countryCode: "pk" },
    { dialCode: "+93", countryCode: "af" },
    { dialCode: "+94", countryCode: "lk" },
    { dialCode: "+95", countryCode: "mm" },
    { dialCode: "+98", countryCode: "ir" },
    { dialCode: "+212", countryCode: "ma" },
    { dialCode: "+213", countryCode: "dz" },
    { dialCode: "+216", countryCode: "tn" },
    { dialCode: "+218", countryCode: "ly" },
    { dialCode: "+220", countryCode: "gm" },
    { dialCode: "+221", countryCode: "sn" },
    { dialCode: "+234", countryCode: "ng" },
    { dialCode: "+254", countryCode: "ke" },
    { dialCode: "+255", countryCode: "tz" },
    { dialCode: "+256", countryCode: "ug" },
    { dialCode: "+260", countryCode: "zm" },
    { dialCode: "+263", countryCode: "zw" },
    { dialCode: "+351", countryCode: "pt" },
    { dialCode: "+352", countryCode: "lu" },
    { dialCode: "+353", countryCode: "ie" },
    { dialCode: "+354", countryCode: "is" },
    { dialCode: "+355", countryCode: "al" },
    { dialCode: "+356", countryCode: "mt" },
    { dialCode: "+358", countryCode: "fi" },
    { dialCode: "+359", countryCode: "bg" },
    { dialCode: "+370", countryCode: "lt" },
    { dialCode: "+371", countryCode: "lv" },
    { dialCode: "+372", countryCode: "ee" },
    { dialCode: "+380", countryCode: "ua" },
    { dialCode: "+381", countryCode: "rs" },
    { dialCode: "+385", countryCode: "hr" },
    { dialCode: "+386", countryCode: "si" },
    { dialCode: "+420", countryCode: "cz" },
    { dialCode: "+421", countryCode: "sk" },
    { dialCode: "+880", countryCode: "bd" },
    { dialCode: "+960", countryCode: "mv" },
    { dialCode: "+961", countryCode: "lb" },
    { dialCode: "+962", countryCode: "jo" },
    { dialCode: "+963", countryCode: "sy" },
    { dialCode: "+964", countryCode: "iq" },
    { dialCode: "+966", countryCode: "sa" },
    { dialCode: "+967", countryCode: "ye" },
    { dialCode: "+968", countryCode: "om" },
    { dialCode: "+971", countryCode: "ae" },
    { dialCode: "+972", countryCode: "il" },
    { dialCode: "+973", countryCode: "bh" },
    { dialCode: "+974", countryCode: "qa" },
    { dialCode: "+975", countryCode: "bt" },
    { dialCode: "+976", countryCode: "mn" },
    { dialCode: "+977", countryCode: "np" },
    { dialCode: "+992", countryCode: "tj" },
    { dialCode: "+993", countryCode: "tm" },
    { dialCode: "+994", countryCode: "az" },
    { dialCode: "+995", countryCode: "ge" },
    { dialCode: "+996", countryCode: "kg" },
    { dialCode: "+998", countryCode: "uz" },
].sort((a, b) => b.dialCode.length - a.dialCode.length);

/**
 * Strips the dial code from a full phone number.
 * @param {string} phoneNumber - The full phone number (e.g., +447700900123)
 * @returns {string} - The number without the dial code (e.g., 7700900123)
 */
export const stripDialCode = (phoneNumber) => {
    if (!phoneNumber) return "";
    
    // Attempt to match from our known list first (longest matches first)
    for (const { dialCode } of DIAL_CODES) {
        if (phoneNumber.startsWith(dialCode)) {
            return phoneNumber.slice(dialCode.length).trim();
        }
    }

    // Fallback: match any + followed by 1-4 digits
    const match = phoneNumber.match(/^\+\d{1,4}/);
    if (match) return phoneNumber.slice(match[0].length).trim();

    return phoneNumber;
};

/**
 * Detects the country and dial code from a full phone number.
 * @param {string} phoneNumber - The full phone number.
 * @returns {object|null} - { dialCode, countryCode } or null
 */
export const detectCountryFromPhone = (phoneNumber) => {
    if (!phoneNumber) return null;
    for (const entry of DIAL_CODES) {
        if (phoneNumber.startsWith(entry.dialCode)) {
            return entry;
        }
    }
    
    // Fallback detection for common patterns if not in list
    const match = phoneNumber.match(/^(\+\d{1,4})/);
    if (match) {
        return { dialCode: match[1], countryCode: "gb" }; // Fallback to gb flag if unknown but has +
    }
    
    return null;
};
