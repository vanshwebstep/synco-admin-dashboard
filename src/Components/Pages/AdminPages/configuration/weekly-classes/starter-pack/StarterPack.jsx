import React, { useEffect, useState } from 'react';
import { useStarterPack } from '../../../contexts/StarterPackContext';
import { Check, Plus, X } from 'lucide-react';
import Loader from '../../../contexts/Loader';
import { showConfirm } from '../../../../../../utils/swalHelper';

const StarterPack = () => {
    const { starterPacks, fetchStarterPacks, createStarterPack, updateStarterPack, deleteStarterPack, loading } = useStarterPack();
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPackId, setSelectedPackId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        enabled: true,
        mandatory: false,
        appliesOnTrialConversion: true,
        appliesOnDirectMembership: true
    });

    useEffect(() => {
        fetchStarterPacks();
    }, [fetchStarterPacks]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEdit = (pack) => {
        setFormData({
            title: pack.title,
            description: pack.description,
            price: pack.price,
            enabled: pack.enabled,
            mandatory: pack.mandatory,
            appliesOnTrialConversion: pack.appliesOnTrialConversion,
            appliesOnDirectMembership: pack.appliesOnDirectMembership
        });
        setSelectedPackId(pack.id);
        setIsEditing(true);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const result = await showConfirm(
            "Are you sure?",
            "This action will permanently delete this starter pack.",
            "Yes, delete it"
        );

        if (result.isConfirmed) {
            await deleteStarterPack(id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price)
            };

            if (isEditing) {
                await updateStarterPack(selectedPackId, payload);
            } else {
                await createStarterPack(payload);
            }

            handleCloseForm();
        } catch (error) {
            console.error("Submission failed", error);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setIsEditing(false);
        setSelectedPackId(null);
        setFormData({
            title: '',
            description: '',
            price: '',
            enabled: true,
            mandatory: false,
            appliesOnTrialConversion: true,
            appliesOnDirectMembership: true
        });
    };

    if (loading) return <Loader />;

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-[#282829]">Starter Pack Manager</h2>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        disabled={loading}
                        className="bg-[#237FEA] flex items-center gap-2 text-white px-4 py-[10px] rounded-xl hover:bg-blue-700 transition-colors text-[16px] font-semibold disabled:opacity-70"
                    >
                        <img src="/members/add.png" className='w-5' alt="" /> Add Starter Pack
                    </button>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className={`transition-all duration-300 w-full ${showForm ? 'lg:w-3/4' : 'w-full'}`}>
                    <div className="overflow-x-auto w-full rounded-2xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-[#F5F5F5] text-left">
                                <tr>
                                    <th className="p-4 text-[14px] text-[#717073] font-semibold">Title</th>
                                    <th className="p-4 text-[14px] text-[#717073] font-semibold">Description</th>
                                    <th className="p-4 text-[14px] text-[#717073] font-semibold text-center">Price</th>
                                    <th className="p-4 text-[14px] text-[#717073] font-semibold text-center whitespace-nowrap">Status</th>
                                    <th className="p-4 text-[14px] text-[#717073] font-semibold text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {starterPacks.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-[#717073] font-medium">No starter packs found.</td>
                                    </tr>
                                ) : (
                                    starterPacks.map((pack) => (
                                        <tr key={pack.id} className="border-t font-semibold text-[#282829] border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="p-4">{pack.title}</td>
                                            <td className="p-4 text-xs lg:text-sm text-[#717073] max-w-[200px] truncate">{pack.description}</td>
                                            <td className="p-4 text-center">£{parseFloat(pack.price || 0).toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${pack.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {pack.enabled ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-4 items-center justify-center">
                                                    <button
                                                        onClick={() => handleEdit(pack)}
                                                        disabled={loading}
                                                        className="group transition-transform hover:scale-110 disabled:opacity-50"
                                                    >
                                                        <img src="/images/icons/edit.png" alt="Edit" className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(pack.id)}
                                                        disabled={loading}
                                                        className="group transition-transform hover:scale-110 disabled:opacity-50"
                                                    >
                                                        <img src="/images/icons/deleteIcon.png" alt="Delete" className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showForm && (
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 relative">
                            <button
                                onClick={handleCloseForm}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                                title="Close"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-lg font-bold text-[#282829] mb-6">
                                {isEditing ? 'Edit Starter Pack' : 'Add New Starter Pack'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-[#282829] mb-1.5 uppercase tracking-wider text-[11px]">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
                                        placeholder="e.g. Starter Pack - 2 Child"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#282829] mb-1.5 uppercase tracking-wider text-[11px]">Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 transition-all min-h-[80px] text-sm font-medium"
                                        placeholder="Brief description of the pack..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[#282829] mb-1.5 uppercase tracking-wider text-[11px]">Price (£)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        required
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 transition-all text-sm font-medium"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 pt-2">
                                    <CheckboxItem
                                        label="Enabled"
                                        name="enabled"
                                        checked={formData.enabled}
                                        onChange={handleInputChange}
                                    />
                                    <CheckboxItem
                                        label="Mandatory"
                                        name="mandatory"
                                        checked={formData.mandatory}
                                        onChange={handleInputChange}
                                    />
                                    <CheckboxItem
                                        label="On Trial Conversion"
                                        name="appliesOnTrialConversion"
                                        checked={formData.appliesOnTrialConversion}
                                        onChange={handleInputChange}
                                    />
                                    <CheckboxItem
                                        label="On Direct Membership"
                                        name="appliesOnDirectMembership"
                                        checked={formData.appliesOnDirectMembership}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#237FEA] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 text-sm italic"
                                    >
                                        {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Starter Pack' : 'Create Starter Pack')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const CheckboxItem = ({ label, name, checked, onChange }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative flex items-center">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 checked:bg-blue-500 checked:border-blue-500 transition-all"
            />
            <Check className="absolute w-5 h-5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none p-0.5" />
        </div>
        <span className="text-[13px] font-semibold text-[#717073] group-hover:text-[#282829]">{label}</span>
    </label>
);

export default StarterPack;
