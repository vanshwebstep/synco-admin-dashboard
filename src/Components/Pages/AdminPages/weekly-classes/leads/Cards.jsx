import React from "react";
import {
    LogIn,
    UserRoundPlus,
    CirclePoundSterling,
} from "lucide-react";
import { PiUsersThreeBold } from "react-icons/pi";
import { useLeads } from "../../contexts/LeadsContext";

const Cards = () => {
    const { analytics, activeTab } = useLeads();

    const summaryCards = [
        {
            icon: PiUsersThreeBold,
            iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]",
            title: "Total Leads",
            value: analytics?.totalLeads?.count ?? "_",
            change: analytics?.totalLeads?.conversion ?? "_",
        },
        {
            icon: UserRoundPlus,
            iconStyle: "text-[#099699] bg-[#E0F7F7]",
            title: "New Leads",
            value: analytics?.newLeads?.count ?? "_",
            change: analytics?.newLeads?.conversion ?? "_",
        },
        {
            icon: LogIn,
            iconStyle: "text-[#F38B4D] bg-[#FFF2E8]",
            title: "Leads to Trials",
            value: analytics?.leadsToTrials?.count ?? "_",
            change: analytics?.leadsToTrials?.conversion ?? "_",
        },
        {
            icon: CirclePoundSterling,
            iconStyle: "text-[#6F65F1] bg-[#E9E8FF]",
            title: "Leads to Sales",
            value: analytics?.leadsToSales?.count ?? "_",
            change: analytics?.leadsToSales?.conversion ?? "_",
        },
    ];


    const summaryCards2 = [
        {
            icon: PiUsersThreeBold,
            iconStyle: "text-[#3DAFDB] bg-[#E6F7FB]",
            title: "Total Referrals",
            value: analytics?.totalLeads?.count ?? "_",
            change: analytics?.totalLeads?.conversion ?? "_",
        },
        {
            icon: UserRoundPlus,
            iconStyle: "text-[#099699] bg-[#E0F7F7]",
            title: "New Referrals",
            value: analytics?.newLeads?.count ?? "_",
            change: analytics?.newLeads?.conversion ?? "_",
        },
        {
            icon: LogIn,
            iconStyle: "text-[#F38B4D] bg-[#FFF2E8]",
            title: "Referrals to Trials",
            value: analytics?.leadsToTrials?.count ?? "_",
            change: analytics?.leadsToTrials?.conversion ?? "_",
        },
        {
            icon: CirclePoundSterling,
            iconStyle: "text-[#6F65F1] bg-[#E9E8FF]",
            title: "Referrals to Sales",
            value: analytics?.leadsToSales?.count ?? "_",
            change: analytics?.leadsToSales?.conversion ?? "_",
        },
    ];


    // Select which cards to render based on activeTab
    const cardsToRender = activeTab === "Referral" ? summaryCards2 : summaryCards;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cardsToRender.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className="bg-white rounded-4xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-200"
                    >
                        <div>
                            <div
                                className={`p-2 h-[50px] w-[50px] rounded-full flex items-center justify-center ${card.iconStyle}`}
                            >
                                <Icon size={24} className={card.iconStyle} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-sm text-gray-500">{card.title}</p>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-semibold mt-1">{card.value}</h3>
                                {card.change && (
                                    <p className="text-green-600 text-xs mt-1">({card.change})</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Cards;
