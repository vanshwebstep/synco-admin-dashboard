import React from 'react';

const HeaderBanner = ({ title, icon: Icon }) => {
  return (
    <section
      className="headerbanner mt-8 md:py-7 py-4 bg-no-repeat bg-cover mb-4 bg-right rounded-4xl flex items-center md:p-10 p-5"
      style={{
        backgroundImage: "url('/members/headerbanner.png')",
      }}
    >
      <div className='flex gap-4 items-center'>
       {Icon && <div className="md:max-w-[40px] max-w-[20px] text-black">
   <img src={Icon} className="w-full" alt="Default Icon" />
        </div>}
        <h2 className="text-black font-bold md:text-[38px] text-lg flex items-center gap-2">
          {title}
        </h2>
      </div>
    </section>
  );
};

export default HeaderBanner;
