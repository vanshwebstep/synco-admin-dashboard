import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Folder,
    Search,
    Plus,
    Upload,
    Download,
    Trash2,

} from "lucide-react";
import Loader from '../../../../Pages/AdminPages/contexts/Loader';
import { showConfirm, showSuccess } from "../../../../../utils/swalHelper";

export default function FileManager() {
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [files, setFiles] = useState([]);
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const token = localStorage.getItem("adminToken");
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [searchFolder, setSearchFolder] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [uploading, setUploading] = useState(false);

    const axiosConfig = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };
    // -----------------------------
    // FETCH FOLDERS
    // -----------------------------

    const fetchFolders = async () => {
        setLoadingFolders(true);

        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/admin/folder/list/uploadFiles`,
                axiosConfig
            );

            setFolders(res.data?.data || []);
        } catch (err) {
            toast.error("Failed to load folders");
        } finally {
            setLoadingFolders(false);
        }
    };


    useEffect(() => {
        fetchFolders();
    }, []);

    // -----------------------------
    // -----------------------------
    const createFolder = async () => {
        if (!newFolderName.trim()) {
            return toast.error("Folder name is required");
        }

        setCreatingFolder(true);

        try {
            await axios.post(
                `${API_BASE_URL}/api/admin/folder/create`,
                { name: newFolderName },
                axiosConfig
            );

            setShowCreatePopup(false);
            setNewFolderName("");
            await fetchFolders();
     showSuccess("Folder Created!", "Your folder has been successfully created.");
           

        } catch (err) {
            toast.error("Failed to create folder");
        } finally {
            setCreatingFolder(false);
        }
    };



    // -----------------------------
    // LOAD FILES FOR SELECTED FOLDER
    const loadFiles = async (folder) => {
        setSelectedFolder(folder);
        setLoadingFiles(true);   // start loading

        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/admin/folder/list/uploadFiles/${folder.id}`,
                {
                    ...axiosConfig,
                }
            );

            setFiles(res.data?.data.files || []);
            console.log("res files", res || []);
        } catch (err) {
            toast.error("Failed to load files");
        } finally {
            setLoadingFiles(false);  // stop loading
        }
    };




    // -----------------------------
    // UPLOAD FILE
    // -----------------------------
    const uploadFiles = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();

        Array.from(files).forEach(file => {
            formData.append("uploadFiles", file);
        });

        formData.append("folder_id", selectedFolder.id);

        setUploading(true);

        try {
            await axios.post(
                `${API_BASE_URL}/api/admin/folder/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            await loadFiles(selectedFolder);
           showSuccess("Upload Successful", "Files have been uploaded successfully.");
          
        } catch (err) {
            showError("Upload Failed", "There was an error uploading the files.");
                
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };




    // -----------------------------
    // DELETE FILE
    // -----------------------------
    const deleteFile = async (file_id, url) => {
        showConfirm("Are you sure?", "This file will be permanently deleted.", "warning").then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                await axios.delete(
                    `${API_BASE_URL}/api/admin/folder/delete-file`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        data: { file_id, url }, // delete body must be here
                    }
                );
                showSuccess("Deleted!", "File removed successfully.");
                loadFiles(selectedFolder);
                
            } catch (err) {
                toast.error("Failed to delete file");
            }
        });
       
    };
    const hasFiles = files.some(
        (file) => file.uploadFiles && file.uploadFiles.length > 0
    );
const handleDownload = async (fileId, fileUrl) => {
    try {
        const token = localStorage.getItem("adminToken");

        const response = await fetch(
            `${API_BASE_URL}/api/admin/folder/download/${fileId}?url=${encodeURIComponent(fileUrl)}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to download file");
        }

        // Convert response to Blob
        const blob = await response.blob();

        // Create temporary URL
        const downloadUrl = window.URL.createObjectURL(blob);

        // Create anchor tag
        const a = document.createElement("a");
        a.href = downloadUrl;

        // Optional: set filename
        a.download = fileUrl.split("/").pop(); 

        document.body.appendChild(a);
        a.click();

        // Cleanup
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("Download failed:", error);
    }
};


    console.log('files', files);
    return (
        <div className="w-full h-screen md:p-6 lg:flex gap-6 text-gray-700">

            {loadingFolders ? (
                <div className="py-10 w-full flex justify-center text-center"> <>
                    <Loader />
                </></div>

            ) : (
                <>
                    {/* ----------------------------------------------------- */}
                    {/* LEFT: FOLDER LIST */}
                    {/* ----------------------------------------------------- */}
                    <div className="lg:w-1/2 bg-white rounded-3xl flex flex-col">

                        <div className="md:flex items-center justify-between gap-3 p-5  border-b border-[#E2E1E5]">
                            <div className="flex items-center gap-2">
                                <img src="/reportsIcons/Folder2.png" className="w-7" alt="" />
                                <h2 className="text-xl font-semibold">Folders</h2>
                            </div>
                            <div className="flex gap-3 items-center">
                                <div className="px-5 ">
                                    <div className="flex items-center gap-2  border border-gray-300 x-3 p-2 rounded-xl">
                                        <Search size={18} className="text-gray-500" />
                                        <input
                                            type="text"
                                            placeholder="Search folder"
                                            className="w-full bg-transparent outline-none"
                                            value={searchFolder}
                                            onChange={(e) => setSearchFolder(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={uploading}
                                    onClick={() => setShowCreatePopup(true)}
                                    className="flex items-center gap-2 bg-[#237FEA] text-sm hover:bg-blue-600 text-white px-4 py-3 rounded-xl"
                                >
                                    <Plus size={18} />
                                    Create New
                                </button>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-4 p-5">
                            {folders
                                .filter(f => f.name.toLowerCase().includes(searchFolder.toLowerCase()))
                                .map((f, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (!uploading) loadFiles(f);
                                        }}
                                        className={`p-4 min-h-[170px] flex flex-col justify-between bg-[#fafafa] border border-[#E2E1E5] rounded-3xl transition
                  ${!uploading ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-50 pointer-events-none'}`}
                                    >
                                        <div>
                                            <img src="/reportsIcons/folder-open.png" className="w-10" alt="" />
                                            <h3 className="font-semibold text-[#414141] leading-[22px] mt-2">{f.name}</h3>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-sm text-gray-500">{f.totalFiles} Files</p>
                                            <p className="text-sm font-semibold">{f.totalSpaceUsed}</p>
                                        </div>
                                    </div>
                                ))
                            }

                        </div>
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* RIGHT: FILE LIST */}
                    <div className="lg:w-1/2 mt-4 md:mt-0 bg-white rounded-3xl flex flex-col">
                        {loadingFiles ? (
                            <div className="py-10 w-full flex justify-center text-center"> <>
                                <Loader />
                            </></div>

                        ) : (

                            <>
                                <div className="flex justify-between items-center p-5 border-b border-[#E2E1E5]">
                                    <div className="flex items-center gap-2">
                                        <img src="/reportsIcons/folder-2.png" className="w-7" alt="" />
                                        <h2 className="text-xl font-semibold">
                                            {selectedFolder ? selectedFolder.name : "Files"}
                                        </h2>
                                    </div>

                                    {selectedFolder && (
                                        <label className="flex text-sm items-center gap-2 bg-[#237FEA] hover:bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer">
                                            <Upload size={18} />
                                            {uploading ? "Uploading..." : "Upload File"}
                                            <input type="file" disabled={uploading} multiple className="hidden" onChange={uploadFiles} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 overflow-auto p-5 h-full">
                                    {!hasFiles ? (
                                        /* EMPTY STATE */
                                        <div className="flex flex-col items-center justify-start h-full text-center">
                                            <div className="bg-[#E5F1FE] p-8 rounded-3xl w-full max-w-md border-2 border-dashed border-[#237FEA]">
                                                <img
                                                    src="/reportsIcons/folder-open.png"
                                                    className="w-16 mx-auto mb-4"
                                                    alt=""
                                                />

                                                <h3 className="text-xl font-semibold mb-2">No files yet</h3>
                                                <p className="text-gray-500 mb-6">
                                                    Upload your first file to get started
                                                </p>

                                                {selectedFolder && (
                                                    <label className="inline-flex items-center gap-3 bg-[#237FEA] hover:bg-blue-600 text-white px-8 py-4 rounded-2xl cursor-pointer text-lg font-semibold transition">
                                                        <Upload size={22} />
                                                        {uploading ? "Uploading..." : "Upload Files"}
                                                        <input
                                                            type="file"
                                                            multiple
                                                            disabled={uploading}
                                                            className="hidden"
                                                            onChange={uploadFiles}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* FILE LIST */
                                        <div className="flex flex-col gap-3">
                                            {files.map((file) =>
                                                file.uploadFiles?.map((uploaded, index) => {
                                                    const url = uploaded.url;
                                                    const fileName = url
                                                        ? url.split("/").pop()
                                                        : "No File";
                                                    const createdAt = new Date(
                                                        file.createdAt
                                                    ).toLocaleString();

                                                    return (
                                                        <div
                                                            key={`${file.id}-${index}`}
                                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-[#E5F1FE] rounded-lg h-12 w-12 flex justify-center items-center">
                                                                    <img
                                                                        src="/reportsIcons/folder-open.png"
                                                                        className="w-6"
                                                                        alt=""
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <p className="font-semibold mb-1">
                                                                        {fileName}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {createdAt}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <Download
                                                                    size={18}
                                                                    onClick={() => handleDownload(file.id, url)}
                                                                    className="hover:text-[#237FEA] cursor-pointer"
                                                                />


                                                                <Trash2
                                                                    size={18}
                                                                    onClick={() =>
                                                                        deleteFile(file.id, url)
                                                                    }
                                                                    className="hover:text-red-500 cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    {/* ----------------------------------------------------- */}
                    {/* POPUP: CREATE FOLDER */}
                    {/* ----------------------------------------------------- */}
                    {showCreatePopup && (
                        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
                            <div className="bg-white p-6 rounded-2xl w-96">
                                <h2 className="text-lg font-semibold mb-3">Create Folder</h2>

                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="w-full border p-2 rounded-lg mb-4"
                                    placeholder="Folder Name"
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowCreatePopup(false)}
                                        className="px-4 py-2 bg-gray-200 rounded-lg"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={createFolder}
                                        className="px-4 py-2 bg-[#237FEA] text-white rounded-lg flex items-center gap-2"
                                        disabled={creatingFolder}
                                    >
                                        {creatingFolder ? (
                                            "Creating..."
                                        ) : (
                                            "Create"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
