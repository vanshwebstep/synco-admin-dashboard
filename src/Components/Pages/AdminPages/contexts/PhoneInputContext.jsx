import { createContext, useContext, useState } from "react";
import { DIAL_CODES, stripDialCode, detectCountryFromPhone } from "../../../../utils/phoneHelper";

const PhoneInputContext = createContext(null);

export const PhoneInputProvider = ({ children }) => {

    const [dialCode, setDialCode] = useState("+44");
    const [country, setCountry] = useState("gb");

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