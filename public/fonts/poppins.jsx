import jsPDF from "jspdf";

// --- Poppins Regular ---
jsPDF.API.events.push([
  "addFonts",
  function () {
    this.addFileToVFS(
      "Poppins-Regular.ttf",
      "AAEAAA...BASE64_HERE..."
    );
    this.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  },
]);

// --- Poppins Medium ---
jsPDF.API.events.push([
  "addFonts",
  function () {
    this.addFileToVFS(
      "Poppins-Medium.ttf",
      "AAEAAA...BASE64_HERE..."
    );
    this.addFont("Poppins-Medium.ttf", "Poppins", "medium");
  },
]);

// --- Poppins SemiBold ---
jsPDF.API.events.push([
  "addFonts",
  function () {
    this.addFileToVFS(
      "Poppins-SemiBold.ttf",
      "AAEAAA...BASE64_HERE..."
    );
    this.addFont("Poppins-SemiBold.ttf", "Poppins", "semibold");
  },
]);
