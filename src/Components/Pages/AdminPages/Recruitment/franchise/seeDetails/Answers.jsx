import React, { useState } from "react";
import { Check } from "lucide-react";

const sampleQuestions = [
  { question: "Have you work in a franchise before?", answer: "Yes" },
  { question: "Have you work in a franchise before?", answer: "Yes" },
  { question: "Have you work in a franchise before?", answer: "Yes" },
  { question: "Have you work in a franchise before?", answer: "Yes" },
  { question: "Have you work in a franchise before?", answer: "Yes" },
];

const Answers = () => {
  const stats = [
    { label: "Work ethic", value: 70 },
    { label: "Funds", value: 45 },
    { label: "Passion", value: 85 },
    { label: "Funds", value: 25 },
    { label: "Work ethic", value: 70 },
    { label: "Funds", value: 10 },
  ];


  return (
    <>

      <div className="md:flex gap-8">
        <div className="md:w-8/12">
          <TopicTable title="First topic" questions={sampleQuestions} />
          <TopicTable title="Second topic" questions={sampleQuestions} />
          <TopicTable title="Third topic" questions={sampleQuestions} />

        </div>
        <div className="md:w-4/12 md:mt-0 mt-4">
          <div className="bg-white p-6 rounded-3xl ">
            <h2 className="font-semibold mb-4 text-[22px] text-gray-800">
              Lead Quality status

            </h2>

            <div className="grid grid-cols-2 gap-3">
              {stats.map((item, index) => (
                <Circle key={index} label={item.label} value={item.value} />
              ))}
            </div>
          </div>

        </div>

      </div>
    </>
  );
};

export default Answers;

const TopicTable = ({ title, questions }) => {
  return (
    <div className="bg-white w-full p-6 rounded-3xl  mb-10">
      {/* Title */}
      <h2 className="text-[24px] font-bold text-gray-800 mb-4">{title}</h2>

      {/* Header */}
      <div className="flex gap-3 px-4 py-2 text-xs text-[#909090]">
        <div className="">No</div>
        <div className="flex justify-between w-full pb-3">

          <div className="">Question</div>
          <div className=" text-right">Answer</div>
        </div>
      </div>

      {/* Rows */}
      {questions.map((q, index) => (
        <div
          key={index}
          className="flex gap-6  px-4 pt-3 text-sm items-center  last:border-0"
        >
          <div className=" font-semibold  ">{index + 1}</div>
          <div className="flex justify-between border-b border-[#E2E1E5] w-full">

            <div className=" font-semibold  ">
              {q.question}
            </div>

            <div className=" flex justify-end items-center gap-2 pb-3">
              <span className=" font-semibold">{q.answer}</span>
              <div className="bg-[#237FEA] rounded-full h-4.5 w-4.5 flex p-1 items-center justify-center">

                <Check size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
const Circle = ({ label, value }) => {
  return (
    <div className="flex flex-col items-center my-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(#1A73E8 ${value * 3.6}deg, #E5E7EB 0deg)`
        }}
      >
        <div className="w-14 h-14 bg-white rounded-full"></div>
      </div>

      <p className="mt-2 text-gray-600 text-sm">{label}</p>
      <p className="text-lg font-semibold">{value}%</p>
    </div>
  );
};