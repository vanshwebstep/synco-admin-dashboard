import { PhoneCallIcon, StarIcon } from "lucide-react";
import React, { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const Test = () => {
  const [country, setCountry] = useState("uk"); // default country
  const [dialCode, setDialCode] = useState("+44"); // store selected code silently
  const [number, setNumber] = useState("");

  const handleChange = (value, data) => {
    // When library fires onChange, just update the dial code
    setDialCode("+" + data.dialCode);
  };

  const handleCountryChange = (countryData) => {
    setCountry(countryData.countryCode);
    setDialCode("+" + countryData.dialCode);
  };

  const handleNumberChange = (e) => {
    const numericValue = e.target.value.replace(/\D/g, "");
    setNumber(numericValue);
  };

  return (
    <div className=" mt-8">
 <div className="w-full bg-white rounded-2xl border border-[#D9D9D9] shadow-sm relative p-2">
  {/* Header */}
  <div className="bg-[#2E2F3E] text-white p-4 rounded-xl flex justify-between md:items-center text-sm gap-4">
    <div className="flex items-center gap-2">
      <img src="/images/icons/Location.png" alt="" />
      <div className="flex">
        <span className="font-medium text-[16px]">
          123 Baker Street, London
          <span> PostCode - W1U 6RT</span>
        </span>
      </div>
    </div>
    <div className="md:mt-0 mt-5 flex relative items-center gap-4">
      <img src="/images/icons/fcDollar.png" alt="" className="cursor-pointer w-6 h-6 rounded-full bg-white" />
      <img src="/images/icons/fcCalendar.png" alt="" className="cursor-pointer w-6 h-6 rounded-full bg-white" />
      <img src="/images/icons/fcLocation.png" alt="" className="cursor-pointer w-6 h-6 rounded-full bg-white" />
      <img src="/images/icons/fcCicon.png" alt="" className="cursor-pointer w-6 h-6 rounded-full bg-white" />
      <img src="/images/icons/fcPIcon.png" alt="" className="cursor-pointer w-6 h-6 rounded-full bg-white" />
    </div>
  </div>

  {/* Body */}
  <div className="p-5 flex flex-col lg:flex-row gap-8 bg-[#FCF9F6]">
    {/* Left Info */}
    <div className="w-full lg:w-3/12 space-y-1 pr-4 border-r border-[#ccc]">
      <div className="flex gap-5 items-center">
        <div>
          <div className="font-semibold text-[20px] text-black truncate">Baker Street Venue</div>
          <div className="whitespace-nowrap font-semibold text-[14px]">2.35 miles</div>
        </div>
        <div>
          <div className="text-[16px] capitalize font-semibold text-[#384455]">Monday, Wednesday, Friday</div>
          <div className="whitespace-nowrap font-semibold text-[14px]">Sports Hall</div>
        </div>
      </div>
    </div>

    {/* Right Info */}
    <div className="w-full lg:w-10/12 space-y-4">
      {/* Day section */}
      <div>
        {/* Class Row */}
        <div className="w-full flex items-center justify-between space-x-2">
          <div className="flex space-x-3 items-center">
            <div className="font-bold text-[16px] text-black whitespace-nowrap">Class 1</div>
            <div className="font-semibold text-[16px] min-w-25 max-w-25">Yoga Beginner</div>
            <div className="font-semibold text-[16px] whitespace-nowrap flex gap-2 items-center min-w-40">
              <img src="/images/icons/fcTImeIcon.png" alt="" />
              7:00 AM - 8:00 AM
            </div>
            <div className="text-sm">
              <span className="text-green-600 whitespace-nowrap bg-green-50 p-2 rounded-xl text-[14px] font-semibold">
                +5 spaces
              </span>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex gap-2 flex-wrap md:justify-end">
            <button className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-1 rounded-xl text-[14px]">
              Book a FREE Trial
            </button>
            <button className="font-semibold whitespace-nowrap border border-[#BEBEBE] px-3 py-1 rounded-xl text-[14px]">
              Book a Membership
            </button>
          </div>
        </div>
        
      </div>

      {/* Another Class */}
      <div>
        <div className="w-full flex items-center justify-between space-x-2">
          <div className="flex space-x-3 items-center">
            <div className="font-bold text-[16px] text-black whitespace-nowrap">Class 2</div>
            <div className="font-semibold text-[16px] min-w-25 max-w-25">Zumba</div>
            <div className="font-semibold text-[16px] whitespace-nowrap flex gap-2 items-center min-w-40">
              <img src="/images/icons/fcTImeIcon.png" alt="" />
              9:00 AM - 10:00 AM
            </div>
            <div className="text-sm">
              <span className="text-red-500 whitespace-nowrap bg-red-50 p-2 rounded-xl text-[14px] font-semibold">
                Fully booked
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap md:justify-end">
            <button className="bg-[#237FEA] text-white border border-[#237FEA] px-3 py-1 rounded-xl text-sm font-medium">
              Add to Waiting List
            </button>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</div>


   

    </div>





  );
};

export default Test;
