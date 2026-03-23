import React from "react";
import { HashLoader } from "react-spinners";

const Loader = ({ loading = true, size = 50 }) => {
  return (
    <div className="flex items-center justify-center min-h-[150px] animate-spin [animation-duration:2s] ">
      <img src="/images/loader.png" className="max-w-12 w-12 h-12" alt="" />
      {/* <HashLoader color="#FFDE14" loading={loading} size={size} /> */}
    </div>
  );
};

export default Loader;
