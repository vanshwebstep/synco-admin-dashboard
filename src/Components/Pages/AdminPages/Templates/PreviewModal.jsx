import React, { useState, useCallback, useEffect, useRef } from "react";
import BlockRenderer from "./BlockRenderer";
import { useCommunicationTemplate } from "../contexts/CommunicationContext";
import { useNavigate, useSearchParams } from "react-router-dom";  // ✅ to read URL params

export default function PreviewModal({ mode_of_communication, title, category, tags, sender, message, blocks, onClose, subject, editMode, templateId, initialGlobalStyle }) {
  const { createCommunicationTemplate, updateCommunicationTemplate } = useCommunicationTemplate();
  const navigate = useNavigate();

  const [previewData, setPreviewData] = useState({
    subject: subject || "",
    blocks: blocks.map(b => ({ ...b })) // clone to avoid mutating props
  });

  const [globalStyle, setGlobalStyle] = useState(initialGlobalStyle || {
    backgroundImage: "",
    maxWidth: 600
  });

  // Load existing global styles from blocks if they exist (parsing content might happen in parent)
  // But PreviewModal is where we edit them for final preview.

  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current) {
      console.log("------------------------------------------");
      console.log("PREVIEW HTML CONTENT:");
      console.log(previewRef.current.innerHTML);
      console.log("------------------------------------------");
    }
  }, [blocks, previewData]);

  const convertBlobToBase64 = async (blobUrl) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };
  const convertNestedImages = async (blocks) => {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Top-level image
      if (block.type === "image" && block.url?.startsWith("blob")) {
        block.url = await convertBlobToBase64(block.url);
      }

      // SectionGrid children
      if (block.type === "sectionGrid" && Array.isArray(block.columns)) {
        for (let ci = 0; ci < block.columns.length; ci++) {
          for (let c = 0; c < block.columns[ci].length; c++) {
            const child = block.columns[ci][c];
            if (child.type === "image" && child.url?.startsWith("blob")) {
              child.url = await convertBlobToBase64(child.url);
            }
          }
        }
      }


      // CardRow images
      if (block.type === "cardRow" && Array.isArray(block.cards)) {
        for (let card of block.cards) {
          if (card.url?.startsWith("blob")) {
            card.url = await convertBlobToBase64(card.url);
          }
        }
      }
    }
    return blocks;
  };
  console.log('editMode', editMode)

  // ✅ Save final preview data
  const handleSavePreview = async () => {
    try {
      const formData = new FormData();

      // ✅ deep clone (DO NOT mutate React state)
      const finalBlocks = JSON.parse(JSON.stringify(previewData.blocks));
      let imageIndex = 1;
      const imageMap = new Map();

      const collectImages = async (block) => {
        const checkAndReplace = async (url, prefix) => {
          if (url?.startsWith("blob")) {
            const response = await fetch(url);
            const blob = await response.blob();
            const fieldName = `${prefix}_${imageIndex++}`;
            const file = new File([blob], `${fieldName}.png`, { type: blob.type });
            formData.append(fieldName, file);
            imageMap.set(url, fieldName);
            return fieldName;
          }
          return url;
        };

        if (block === "global") {
          if (globalStyle.backgroundImage?.startsWith("blob")) {
            await checkAndReplace(globalStyle.backgroundImage, "global_bg");
          }
          return;
        }

        if (block.type === "image" || block.type === "card") {
          block.url = await checkAndReplace(block.url, "image");
        }



        if (block.style?.backgroundImage) {
          const rawUrl = block.style.backgroundImage.replace(/url\(["']?|["']?\)/g, '');
          if (rawUrl.startsWith("blob")) {
            const placeholder = await checkAndReplace(rawUrl, "style_bg");
            block.style.backgroundImage = `url("${placeholder}")`;
          }
        }

        if (block.type === "sectionGrid" && Array.isArray(block.columns)) {
          for (const column of block.columns) {
            for (const child of column) await collectImages(child);
          }
        }



        if (block.type === "heroSection") {
          // check style.backgroundImage
          if (block.style?.backgroundImage) {
            const raw = block.style.backgroundImage.replace(/url\(["']?|["']?\)/g, '');
            if (raw.startsWith("blob")) {
              const ph = await checkAndReplace(raw, "hero_style_bg");
              block.style.backgroundImage = `url("${ph}")`;
            }
          }
          // check direct property if it exists
          if (block.backgroundImage) {
            block.backgroundImage = await checkAndReplace(block.backgroundImage, "hero_bg_prop");
          }
        }

        if (block.type === "cardRow" && Array.isArray(block.cards)) {
          for (const card of block.cards) {
            card.url = await checkAndReplace(card.url, "card_row_image");
          }
        }

        if (block.type === "footerBlock" && block.logoUrl) {
          block.logoUrl = await checkAndReplace(block.logoUrl, "footer_logo");
        }
      };

      // extract all images
      await collectImages("global");
      for (const block of finalBlocks) {
        await collectImages(block);
      }

      // Get HTML and replace blob URLs with placeholders
      let htmlContent = previewRef.current ? previewRef.current.innerHTML : "";
      imageMap.forEach((fieldName, blobUrl) => {
        // Use a regex to replace all occurrences of the blob URL
        const escapedUrl = blobUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedUrl, 'g');
        htmlContent = htmlContent.replace(regex, fieldName);
      });

      // JSON content
      const contentJSON = JSON.stringify({
        subject: previewData.subject,
        htmlContent,
        globalStyle: {
          ...globalStyle,
          backgroundImage: globalStyle.backgroundImage.startsWith("blob")
            ? imageMap.get(globalStyle.backgroundImage)
            : globalStyle.backgroundImage
        },
        blocks: finalBlocks
      });

      // append form fields
      formData.append("mode_of_communication", mode_of_communication.value);
      formData.append("title", title);

      // ✅ category MUST be array
      formData.append(
        "template_category_id",
        JSON.stringify(Array.isArray(category) ? category : [category])
      );

      formData.append("tags", JSON.stringify(tags));
      formData.append("content", contentJSON);

      // ✅ DEBUG (this confirms payload is correct)
      console.log("FORM DATA:", ...formData.entries());

      await createCommunicationTemplate(formData);

      navigate("/templates/settingList");
    } catch (err) {
      console.error("Save Preview Error:", err);
    }
  };



  const handleUpdatePreview = async () => {
    try {
      const formData = new FormData();

      // ✅ deep clone (DO NOT mutate React state)
      const finalBlocks = JSON.parse(JSON.stringify(previewData.blocks));

      let imageIndex = 1;
      const imageMap = new Map();

      const collectImages = async (block) => {
        const checkAndReplace = async (url, prefix) => {
          if (url?.startsWith("blob")) {
            const response = await fetch(url);
            const blob = await response.blob();
            const fieldName = `${prefix}_${imageIndex++}`;
            const file = new File([blob], `${fieldName}.png`, { type: blob.type });
            formData.append(fieldName, file);
            imageMap.set(url, fieldName);
            return fieldName;
          }
          return url;
        };

        if (block === "global") {
          if (globalStyle.backgroundImage?.startsWith("blob")) {
            await checkAndReplace(globalStyle.backgroundImage, "global_bg");
          }
          return;
        }

        if (block.type === "image" || block.type === "card") {
          block.url = await checkAndReplace(block.url, "image");
        }


        if (block.style?.backgroundImage) {
          const rawUrl = block.style.backgroundImage.replace(/url\(["']?|["']?\)/g, '');
          if (rawUrl.startsWith("blob")) {
            const placeholder = await checkAndReplace(rawUrl, "style_bg");
            block.style.backgroundImage = `url("${placeholder}")`;
          }
        }

        if (block.type === "sectionGrid" && Array.isArray(block.columns)) {
          for (const column of block.columns) {
            for (const child of column) await collectImages(child);
          }
        }

        if (block.type === "heroSection") {
          // check style.backgroundImage
          if (block.style?.backgroundImage) {
            const raw = block.style.backgroundImage.replace(/url\(["']?|["']?\)/g, '');
            if (raw.startsWith("blob")) {
              const ph = await checkAndReplace(raw, "hero_style_bg");
              block.style.backgroundImage = `url("${ph}")`;
            }
          }
          // check direct property if it exists
          if (block.backgroundImage) {
            block.backgroundImage = await checkAndReplace(block.backgroundImage, "hero_bg_prop");
          }
        }

        if (block.type === "cardRow" && Array.isArray(block.cards)) {
          for (const card of block.cards) {
            card.url = await checkAndReplace(card.url, "card_row_image");
          }
        }

        if (block.type === "footerBlock" && block.logoUrl) {
          block.logoUrl = await checkAndReplace(block.logoUrl, "footer_logo");
        }
      };

      // extract all images
      await collectImages("global");
      for (const block of finalBlocks) {
        await collectImages(block);
      }

      // Get HTML and replace blob URLs with placeholders
      let htmlContent = previewRef.current ? previewRef.current.innerHTML : "";
      imageMap.forEach((fieldName, blobUrl) => {
        const escapedUrl = blobUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedUrl, 'g');
        htmlContent = htmlContent.replace(regex, fieldName);
      });

      // JSON content
      const contentJSON = JSON.stringify({
        subject: previewData.subject,
        htmlContent,
        globalStyle: {
          ...globalStyle,
          backgroundImage: globalStyle.backgroundImage.startsWith("blob")
            ? imageMap.get(globalStyle.backgroundImage)
            : globalStyle.backgroundImage
        },
        blocks: finalBlocks
      });


      // append form fields
      formData.append("mode_of_communication", mode_of_communication.value);
      formData.append("title", title);

      // ✅ category MUST be array
      formData.append(
        "template_category_id",
        JSON.stringify(Array.isArray(category) ? category : [category])
      );

      formData.append("tags", JSON.stringify(tags));
      formData.append("content", contentJSON);

      // ✅ DEBUG
      console.log("UPDATE FORM DATA:", [...formData.entries()]);

      await updateCommunicationTemplate(templateId, formData);

      navigate("/templates/settingList");
    } catch (err) {
      console.error("Update Preview Error:", err);
    }
  };


  const handleGlobalBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setGlobalStyle(prev => ({ ...prev, backgroundImage: url }));
    }
  };

  return (

    <div className="pt-10">
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl mb-6 gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Max Width (px)</label>
            <input
              type="number"
              className="border border-gray-300 rounded-lg px-3 py-1.5 w-24 text-sm"
              value={globalStyle.maxWidth}
              onChange={(e) => setGlobalStyle(p => ({ ...p, maxWidth: parseInt(e.target.value) || 600 }))}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Background Image</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleGlobalBgChange}
                className="text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {globalStyle.backgroundImage && (
                <button
                  onClick={() => setGlobalStyle(p => ({ ...p, backgroundImage: "" }))}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          onClick={editMode ? handleUpdatePreview : handleSavePreview}
        >
          {editMode ? "Update Template" : "Save Template"}
        </button>
      </div>

      {subject && (
        <h1 className="text-2xl font-semibold mb-6">{subject}</h1>
      )}
      <div
        style={{
          maxWidth: `${globalStyle.maxWidth}px`,
          margin: "0 auto",
          backgroundImage: globalStyle.backgroundImage ? `url(${globalStyle.backgroundImage})` : "none",
          backgroundSize: "cover",
          backgroundColor:"#fff",
          backgroundPosition: "center"
        }}
        ref={previewRef}
        className="bg-white w-full m-auto overflow-auto space-y-3 shadow-inner rounded-md"
      >

        <div style={{ maxWidth: `${globalStyle.maxWidth}px`, margin: "0 auto", backgroundColor: globalStyle.backgroundImage ? "transparent" : "#fff" }}>
          {blocks.map((block, i) => (
            <BlockRenderer
              key={block.id || i}
              block={block}
              blocks={blocks}
              setBlocks={() => { }}
              readOnly={true}
            />
          ))}
        </div>
      </div>

    </div>
  );
}





