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
    gcFranchiseToken: "",
    stripeKey: "",
  });
  const isCoach =
    formData?.role?.label === "Coach" ||
    formData?.role?.value === "Coach";

  const roleLabel = String(formData?.role?.label || "").toLowerCase();
  const roleValue = String(formData?.role?.value || "").toLowerCase();

  const isFranchisee =
    roleLabel === "franchisee" ||
    roleValue === "franchisee" ||
    roleLabel === "franchise" ||
    roleValue === "franchise";
  const token = localStorage.getItem("adminToken");
  console.log('formData', formData)
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

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0] || document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
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
        data.append("stripekey", formData.stripeKey);
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
          stripeKey: "",
        });
        setPhotoPreview(null);
      } catch (error) {
        console.error("Error creating member:", error);
        showError("Network Error", error.message || "An error occurred while submitting the form.");
      }
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName?.trim() && !formData.firstName?.trim()) {
      newErrors.fullName = "Full name is required.";
    }
    if (!formData.position?.trim()) {
      newErrors.position = "Position is required.";
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required.";
    }
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address.";
    }
    if (!formData.role?.value) {
      newErrors.role = "Role is required.";
    }

    if (isFranchisee) {
      if (!formData.gcFranchiseToken?.trim()) {
        newErrors.gcFranchiseToken = "GC Franchise Token is required.";
      }
      if (!formData.stripeKey?.trim()) {
        newErrors.stripeKey = "Stripe Key is required.";
      }
    }

    if (isCoach) {
      const missingDocs = Object.entries(coachDocs)
        .filter(([_, file]) => !file);
      if (missingDocs.length > 0) {
        newErrors.coachDocs = "All coach documents are required.";
      }
    }

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

    setErrors(newErrors);
    return newErrors;
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
              className={`w-full border ${errors.fullName ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.fullName ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
            )}
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
              className={`w-full border ${errors.position ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.position ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {errors.position && (
              <p className="text-sm text-red-500 mt-1">{errors.position}</p>
            )}
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
              className={`w-full border ${errors.email ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div id="role">
            <label className="">Role</label>
            <CreatableSelect
              inputId="role"
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
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: errors.role ? 'red' : base.borderColor,
                  '&:hover': {
                    borderColor: errors.role ? 'red' : base.borderColor,
                  },
                }),
              }}
            />
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">{errors.role}</p>
            )}
          </div>
          {isFranchisee && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#282829]">GC Franchise Token</label>
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
                  className={`w-full border ${errors.gcFranchiseToken ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.gcFranchiseToken ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  placeholder="Enter GC Franchise Token"
                />
                {errors.gcFranchiseToken && (
                  <p className="text-sm text-red-500 mt-1">{errors.gcFranchiseToken}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#282829]">Stripe Key</label>
                <input
                  type="text"
                  name="stripeKey"
                  value={formData.stripeKey}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      stripeKey: e.target.value,
                    }))
                  }
                  className={`w-full border ${errors.stripeKey ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 focus:outline-none focus:ring-2 ${errors.stripeKey ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  placeholder="Enter Stripe Key"
                />
                {errors.stripeKey && (
                  <p className="text-sm text-red-500 mt-1">{errors.stripeKey}</p>
                )}
              </div>
            </div>
          )}
          {isCoach && (
            <div id="coachDocs" className="space-y-5">
              <div>
                <label>FA Level 1</label>
                <input
                  type="file"
                  name="fa_level_1"
                  className={`w-full border ${errors.coachDocs ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 ${errors.coachDocs ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  onChange={handleCoachDocChange}
                />
              </div>

              <div>
                <label>Futsal Level 1 Qualification</label>
                <input
                  type="file"
                  className={`w-full border ${errors.coachDocs ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 ${errors.coachDocs ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  name="futsal_level_1_qualification"
                  onChange={handleCoachDocChange}
                />
              </div>

              <div>
                <label>First Aid</label>
                <input
                  type="file"
                  className={`w-full border ${errors.coachDocs ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 ${errors.coachDocs ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}

                  name="first_aid"
                  onChange={handleCoachDocChange}
                />
              </div>

              <div>
                <label>Futsal Level 1</label>
                <input
                  type="file"
                  className={`w-full border ${errors.coachDocs ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 ${errors.coachDocs ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}

                  name="futsal_level_1"
                  onChange={handleCoachDocChange}
                />
              </div>
              {errors.coachDocs && (
                <p className="text-sm text-red-500 mt-1">{errors.coachDocs}</p>
              )}
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
              className={`w-full border ${errors.password ? 'border-red-500' : 'border-[#E2E1E5]'} rounded-xl px-3 py-2 mt-1 pr-10 focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
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
