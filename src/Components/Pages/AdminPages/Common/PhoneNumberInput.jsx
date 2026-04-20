// components/PhoneNumberInput.jsx
import { useEffect } from "react"; // 👈 add this
import PhoneInput from "react-phone-input-2";
import { usePhoneInput } from "../contexts/PhoneInputContext";
import "react-phone-input-2/lib/style.css";

const PhoneNumberInput = ({
    value,           // full phone number e.g. "+447XXXXXXXXX"
    onChange,        // (fullNumber) => void
    readOnly = false,
    placeholder = "Enter phone number",
    className = "",
}) => {
    const {
        dialCode,
        country,
        setDialCode,
        setCountry,
        stripDialCode,
        buildFullNumber,
        detectCountryFromPhone,
    } = usePhoneInput();
    useEffect(() => {
        if (!value) return;
console.log('detec start ',  value)
        const detected = detectCountryFromPhone(value);
console.log('detec detected ',  detected)

        if (detected) {
            setDialCode(detected.dialCode);
            setCountry(detected.countryCode);
        }
    }, [value]);
    const handleCountryChange = (countryData) => {
        const newDialCode = "+" + countryData.dialCode;
        setDialCode(newDialCode);
        setCountry(countryData.countryCode);

        // Country change hone pe existing raw number ke saath naya dial code lagao
        const raw = stripDialCode(value || "");
        if (raw) onChange(`${newDialCode}${raw}`);
    };

    return (
        <div className={`flex items-center border border-gray-300 rounded-xl px-4 py-3 mt-2 ${className}`}>
            {/* ✅ Flag dropdown */}
            <PhoneInput
                country={country}
                value={dialCode}
                onChange={(val, data) => {
                    setDialCode("+" + data.dialCode);
                    setCountry(data.countryCode);
                }}
                onCountryChange={handleCountryChange}
                disableDropdown={readOnly}        // readonly ho to dropdown band
                disableCountryCode={true}
                countryCodeEditable={false}
                inputStyle={{
                    width: "0px",
                    height: "0px",
                    opacity: 0,
                    pointerEvents: "none",
                    position: "absolute",
                }}
                buttonClass="!bg-white !border-none !p-0"
            />

            {/* ✅ Dial code display */}
            <span className="text-gray-700 mr-2 text-sm font-medium select-none">
                {dialCode}
            </span>

            {/* ✅ Raw number input */}
            <input
                type="text"
                inputMode="numeric"
                value={stripDialCode(value || "")}   // ✅ sirf raw number dikhao
                readOnly={readOnly}
                onChange={(e) => {
                    if (readOnly) return;
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    onChange(buildFullNumber(raw));   // ✅ full number parent ko do
                }}
                placeholder={placeholder}
                className={`border-none w-full focus:outline-none text-base ${readOnly ? "bg-transparent text-gray-500" : ""}`}
            />
        </div>
    );
};

export default PhoneNumberInput;



// // List.jsx mein use karo - import karo
// import { usePhoneInput } from "../contexts/PhoneInputContext";
// import PhoneNumberInput from "../components/PhoneNumberInput";

// // Component ke andar
// const { prefillFromPhone } = usePhoneInput();

// // TrialData fetch ke baad prefill karo
// useEffect(() => {
//     if (TrialData?.parents?.[0]?.parentPhoneNumber) {
//         // ✅ Ek line mein country auto-detect + dialCode set
//         prefillFromPhone(TrialData.parents[0].parentPhoneNumber);
//     }
// }, [TrialData]);

// // ─── Parent Phone ───
// <PhoneNumberInput
//     value={parent.parentPhoneNumber}
//     onChange={(fullNumber) =>
//         handleParentChange(index, "parentPhoneNumber", fullNumber)
//     }
//     readOnly={editingIndex !== index}
//     placeholder="Enter phone number"
// />

// // ─── Emergency Phone ───
// <PhoneNumberInput
//     value={emergency.emergencyPhoneNumber}
//     onChange={(fullNumber) =>
//         setEmergency(prev => ({ ...prev, emergencyPhoneNumber: fullNumber }))
//     }
//     readOnly={emergency.sameAsAbove}   // ✅ sameAsAbove ho to readonly
//     placeholder="Enter phone number"
// />