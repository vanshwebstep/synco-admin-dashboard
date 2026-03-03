import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { showError, showSuccess, showLoading, showWarning } from "../../../../utils/swalHelper";
import { useMembers } from "../contexts/MemberContext";
import RoleModal from "./RoleModal";
import { Eye, EyeOff } from "lucide-react"; // or use any icon library
import { usePermission } from "../Common/permission";

const Create = () => {
  const { checkPermission } = usePermission();
  const [coachDocs, setCoachDocs] = useState({
    fa_level_1: null,
    futsal_level_1_qualification: null,
    first_aid: null,
    futsal_level_1: null,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [errors, setErrors] = useState({});
  const [phoneError, setPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { roleOptions,
    fetchRoles,
    fetchMembers,
    showRoleModal,
    setShowRoleModal,
    setRoleName,
    setPermissions } = useMembers();
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: "",
    phoneNumber: "",
    email: "",
    password: "",
    role: null,
    photo: null,
    gcFranchiseToken: "",   // 👈 ADD THIS

  });
  const isCoach =
    formData?.role?.label === "Coach" ||
    formData?.role?.value === "Coach";

  const isFranchisee =
    formData?.role?.label === "Franchisee" ||
    formData?.role?.value === "Franchisee";
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (token) fetchRoles();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phoneNumber') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else if (name === 'fullName') {
      setFormData(prev => ({ ...prev, fullName: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // On form submit or blur, split fullName
  const handleFullNameSplit = () => {
    const parts = formData.fullName.trim().split(' ');
    const lastName = parts.length > 1 ? parts.pop() : '';
    const firstName = parts.join(' ');
    setFormData(prev => ({ ...prev, firstName, lastName }));
  };





  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };


  const handleRoleChange = (selected) => {
    if (selected?.isCreate) {
      setShowRoleModal(true);
      return;
    }
    setFormData((prev) => ({ ...prev, role: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // console.log("❌ Missing fisselds:", formData);
    // Email validation
    if (!formData.email || !emailRegex.test(formData.email)) {
      // console.log("❌ Missing fields:", formData);
      showError("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (isFranchisee && !formData.gcFranchiseToken?.trim()) {
      showWarning("Missing API Key", "API Key is required for Franchisee role.");
      return;
    }
    // console.log("❌ Misdss:", formData);
    if (isCoach) {
      const missingDocs = Object.entries(coachDocs)
        .filter(([_, file]) => !file)
        .map(([key]) => key.replace(/_/g, " "));

      if (missingDocs.length > 0) {
        showWarning("Missing Coach Documents", `Please upload: ${missingDocs.join(", ")}`);
        return;
      }
    }

    if (validate()) {
      // console.log("❌ Misdsdsdsss:", formData);

      if (
        !formData.firstName ||
        !formData.position ||
        !formData.phoneNumber ||
        !formData.email ||
        !formData.password ||
        !formData.role?.value
      ) {
        // console.log("❌ Missing fields:", formData);

        showWarning("Missing Information", "Please fill out all required fields before submitting.");
        return;
      }

      const data = new FormData();
      data.append("firstName", formData.firstName);

      if (formData.lastName) {
        data.append("lastName", formData.lastName);
      }

      data.append("position", formData.position);
      data.append("phoneNumber", formData.phoneNumber);
      data.append("email", formData.email);
      if (isFranchisee) {
        data.append("gcFranchiseToken", formData.gcFranchiseToken);
      }
      data.append("password", formData.password);
      data.append("role", formData.role?.value);
      if (isCoach) {
        Object.entries(coachDocs).forEach(([key, file]) => {
          if (file) {
            data.append(key, file);
          }
        });
      }
      if (formData.photo) {
        data.append("profile", formData.photo);
      }

      try {
        showLoading("Creating Member...");

        const response = await fetch(`${API_BASE_URL}/api/admin`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        });

        const result = await response.json();

        if (!response.ok) {
          showError("Failed to Add Member", result.message || "Something went wrong.");
          return;
        }

        let additionalMessage = "";
        if (result.data?.emailSent === 1) {
          additionalMessage =
            " A reset password link has been sent to your registered email address.";
        }
        showSuccess(result.message || "Member Created", result.message || "New member was added successfully!");

        fetchMembers();

        setFormData({
          firstName: "",
          lastName: "",
          position: "",
          phoneNumber: "",
          email: "",
          password: "",
          role: null,
          photo: null,
          gcFranchiseToken: "",
        });
        setPhotoPreview(null);
      } catch (error) {
        console.error("Error creating member:", error);
        showError("Network Error", error.message || "An error occurred while submitting the form.");
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    const password = formData.password;

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter.";
    } else if (!/\d/.test(password)) {
      newErrors.password = "Password must contain at least one number.";
    }
    // console.log('newErrors', newErrors)
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoachDocChange = (e) => {
    const { name, files } = e.target;

    setCoachDocs((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  };

  const handleRoleCreateModal = (inputValue) => {
    setRoleName(inputValue);
    setPermissions([]);
    setShowRoleModal(true);
  }; const customComponents = {
    DropdownIndicator: () => null,
    IndicatorSeparator: () => null,
  };

  return (

    checkPermission(
      { module: "member", action: "create" }
    ) && (
      <div className="max-w-md mx-auto">
        <h2 className="text-[23px] pb-4 font-semibold mb-4 border-[#E2E1E5] border-b p-5">
          Add New Member
        </h2>

        <form className="space-y-4 pt-0 p-5" onSubmit={handleSubmit}>

          <div>
            <label className="block text-sm font-semibold text-[#282829]">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              onBlur={handleFullNameSplit} // split when user leaves the field
              className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />


          </div>


          <div>
            <label className="block text-sm font-semibold text-[#282829]">Position</label>
            <input
              type="text"
              name="position"
              onKeyPress={(e) => {
                // Prevent numbers from being entered
                if (/\d/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              value={formData.position}
              onChange={handleInputChange}
              className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#282829]">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full border ${errors.phoneNumber ? 'border-red-500' : 'border-[#E2E1E5]'
                } rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.phoneNumber ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                }`}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#282829]">Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="">Role</label>
            <CreatableSelect
              options={roleOptions}
              value={formData.role}
              onChange={handleRoleChange}
              onCreateOption={handleRoleCreateModal}
              formatCreateLabel={(inputValue) => (
                <span className="text-blue-600">
                  Create role: <strong>{inputValue}</strong>
                </span>
              )}
              isValidNewOption={(inputValue) => {
                const hasPermission = checkPermission({
                  module: "admin-role",
                  action: "create",
                });
                return hasPermission && inputValue.trim() !== "";
              }}
              placeholder=""
              classNamePrefix="react-select"
              components={customComponents} // 👈 apply custom components
            />

          </div>
          {isFranchisee && (
            <div>
              <label>API Key</label>
              <input
                type="text"
                name="gcFranchiseToken"
                value={formData.gcFranchiseToken}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gcFranchiseToken: e.target.value,
                  }))
                }
                className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter API Key"
              />
            </div>
          )}
          {isCoach && (
            <div className="space-y-5">
              <div>
                <label>FA Level 1</label>
                <input
                  type="file"
                  name="fa_level_1"
                  className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handleCoachDocChange}
                />
              </div>

              <div>
                <label>Futsal Level 1 Qualification</label>
                <input
                  type="file"
                  className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="futsal_level_1_qualification"
                  onChange={handleCoachDocChange}
                />
              </div>

              <div>
                <label>First Aid</label>
                <input
                  type="file"
                  className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"

                  name="first_aid"
                  onChange={handleCoachDocChange}
                />
              </div>

              <div>
                <label>Futsal Level 1</label>
                <input
                  type="file"
                  className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"

                  name="futsal_level_1"
                  onChange={handleCoachDocChange}
                />
              </div>
            </div>
          )}
          <div className="relative">
            <label className="block text-sm font-semibold text-[#282829]">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full border border-[#E2E1E5] rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>


          <div>
            <label className="block text-sm font-semibold text-[#282829] mb-1">Profile Picture</label>
            <div className="w-full rounded-lg bg-[#F5F5F5] h-32 flex items-center flex-col gap-3 justify-center cursor-pointer relative overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Uploaded" className="h-full object-cover" onError={(e) => {
                  e.currentTarget.onerror = null; // prevent infinite loop
                  e.currentTarget.src = '/members/dummyuser.png';
                }} />
              ) : (
                <>
                  <img src="/members/addblack.png" className="w-4 block" alt="" />
                  <span className="text-sm ml-2 font-semibold block">Add Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Add Member
          </button>
        </form>
        {showRoleModal && (
          <RoleModal
            visible={showRoleModal}
            onClose={() => setShowRoleModal(false)}
            onRoleCreated={(newRole) => {
              setFormData((prev) => ({ ...prev, role: newRole }));
              fetchRoles();
            }}
          />

        )}
      </div>
    )
  );
};

export default Create;
