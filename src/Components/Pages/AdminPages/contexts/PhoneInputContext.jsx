// contexts/PhoneInputContext.jsx
import { createContext, useContext, useState } from "react";

const DIAL_CODES = [
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
    { dialCode: "+55", countryCode: "br" },
    { dialCode: "+57", countryCode: "co" },
    { dialCode: "+60", countryCode: "my" },
    { dialCode: "+61", countryCode: "au" },
    { dialCode: "+62", countryCode: "id" },
    { dialCode: "+63", countryCode: "ph" },
    { dialCode: "+64", countryCode: "nz" },
    { dialCode: "+65", countryCode: "sg" },
    { dialCode: "+66", countryCode: "th" },
    { dialCode: "+81", countryCode: "jp" },
    { dialCode: "+82", countryCode: "kr" },
    { dialCode: "+86", countryCode: "cn" },
    { dialCode: "+90", countryCode: "tr" },
    { dialCode: "+91", countryCode: "in" },
    { dialCode: "+92", countryCode: "pk" },
    { dialCode: "+94", countryCode: "lk" },
    { dialCode: "+98", countryCode: "ir" },
    { dialCode: "+212", countryCode: "ma" },
    { dialCode: "+213", countryCode: "dz" },
    { dialCode: "+234", countryCode: "ng" },
    { dialCode: "+254", countryCode: "ke" },
    { dialCode: "+351", countryCode: "pt" },
    { dialCode: "+353", countryCode: "ie" },
    { dialCode: "+358", countryCode: "fi" },
    { dialCode: "+380", countryCode: "ua" },
    { dialCode: "+420", countryCode: "cz" },
    { dialCode: "+880", countryCode: "bd" },
    { dialCode: "+966", countryCode: "sa" },
    { dialCode: "+971", countryCode: "ae" },
    { dialCode: "+972", countryCode: "il" },
    { dialCode: "+974", countryCode: "qa" },
    { dialCode: "+977", countryCode: "np" },
    { dialCode: "+998", countryCode: "uz" },
].sort((a, b) => b.dialCode.length - a.dialCode.length);

const PhoneInputContext = createContext(null);

export const PhoneInputProvider = ({ children }) => {

    const [dialCode, setDialCode] = useState("+44");
    const [country, setCountry] = useState("gb");

    // ✅ Phone se raw number nikalo
    const stripDialCode = (phoneNumber) => {
        if (!phoneNumber) return "";
        for (const { dialCode } of DIAL_CODES) {
            if (phoneNumber.startsWith(dialCode)) {
                return phoneNumber.slice(dialCode.length).trim();
            }
        }
        const match = phoneNumber.match(/^\+\d{1,4}/);
        if (match) return phoneNumber.slice(match[0].length).trim();
        return phoneNumber;
    };

    // ✅ Phone number se country + dialCode detect karo
    const detectCountryFromPhone = (phoneNumber) => {
        if (!phoneNumber) return null;
        for (const entry of DIAL_CODES) {
            if (phoneNumber.startsWith(entry.dialCode)) {
                return entry; // { dialCode, countryCode }
            }
        }
        return null;
    };

    // ✅ Prefill karo - phone number se auto country detect
    const prefillFromPhone = (phoneNumber) => {
        if (!phoneNumber) return;
        const matched = detectCountryFromPhone(phoneNumber);
        if (matched) {
            setDialCode(matched.dialCode);
            setCountry(matched.countryCode);
        }
    };

    // ✅ Country change handler (PhoneInput ke onCountryChange se use karo)
    const handleCountryChange = (countryData) => {
        const newDialCode = "+" + countryData.dialCode;
        setDialCode(newDialCode);
        setCountry(countryData.countryCode);
    };

    // ✅ Full number banao - dialCode + rawNumber
    const buildFullNumber = (rawNumber) => {
        if (!rawNumber) return "";
        return `${dialCode}${rawNumber}`;
    };

    return (
        <PhoneInputContext.Provider value={{
            dialCode,
            country,
            setDialCode,
            setCountry,
            stripDialCode,
            detectCountryFromPhone,
            prefillFromPhone,
            handleCountryChange,
            buildFullNumber,
        }}>
            {children}
        </PhoneInputContext.Provider>
    );
};

export const usePhoneInput = () => {
    const context = useContext(PhoneInputContext);
    if (!context) throw new Error("usePhoneInput must be used inside PhoneInputProvider");
    return context;
};