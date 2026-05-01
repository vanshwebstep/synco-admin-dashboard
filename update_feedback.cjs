const fs = require('fs');
const path = require('path');

const files = [
  'src/Components/Pages/AdminPages/birthday-parties/Sales/Info/Feedback.jsx',
  'src/Components/Pages/AdminPages/holiday-camps/accountInfo/Feedback.jsx',
  'src/Components/Pages/AdminPages/one-to-one/Sales/Info/Feedback.jsx',
  'src/Components/Pages/AdminPages/weekly-classes/all-members/Account Information Book Membership/Feedback.jsx',
  'src/Components/Pages/AdminPages/weekly-classes/Cancellation/account-information-cancellation/Feedback.jsx',
  'src/Components/Pages/AdminPages/weekly-classes/find-a-class/add-to-waiting-list/Account Information Waiting List/Feedback.jsx',
  'src/Components/Pages/AdminPages/weekly-classes/find-a-class/book-a-free-trial/account-information-book-free-trial/Feedback.jsx',
  'src/Components/Pages/AdminPages/weekly-classes/leads/leadsInfo/Feedback.jsx'
];

for (const relPath of files) {
  const filePath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', filePath);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // 1. formData initialization & reset
  content = content.replace(/classScheduleId:\s*null,/g, 'classScheduleIds: [],');

  // 2. Extract classScheduleIds instead of classScheduleId
  content = content.replace(/const\s*\{\s*([^}]*?)classScheduleId([^}]*?)\s*\}\s*=\s*formData;/g, 'const {$1classScheduleIds$2} = formData;');

  // 3. Validation fix
  content = content.replace(/!classScheduleId\s*\|\|/g, '!classScheduleIds || classScheduleIds.length === 0 ||');

  // 4. Payload classScheduleId mapping
  content = content.replace(/\bclassScheduleId(?=,|\s|$)/g, 'classScheduleId: classScheduleIds');
  content = content.replace(/classScheduleId:\s*classScheduleIds:\s*classScheduleIds/g, 'classScheduleId: classScheduleIds');
  content = content.replace(/classScheduleId:\s*classScheduleIdss/g, 'classScheduleIds');
  content = content.replace(/!classScheduleId:\s*classScheduleIds/g, '!classScheduleIds');
  content = content.replace(/classScheduleId:\s*classScheduleIds\s*\|\|/g, 'classScheduleIds ||');

  // 5. Fix useEffect for pre-filling classScheduleIds
  const useEffectPattern = /const idToSelect =.*?profile\?\.classSchedule\?\.id;\s*if\s*\(idToSelect\)\s*\{\s*setFormData\(\(prev\)\s*=>\s*\(\{\s*\.\.\.prev,\s*classScheduleId:\s*idToSelect,\s*\}\)\);\s*\}/s;
  const newUseEffect = `const studentClassIds = profile?.students?.map(s => s.classScheduleId || s.classSchedule?.id).filter(Boolean) || [];
      const rootClsId = profile?.classScheduleId || profile?.classSchedule?.id;
      const allIds = [...new Set([...studentClassIds, rootClsId].filter(Boolean))];

      if (allIds.length > 0) {
        setFormData((prev) => ({
          ...prev,
          classScheduleIds: allIds,
        }));
      }`;
  content = content.replace(useEffectPattern, newUseEffect);

  // 6. Select component update
  const selectPattern = /<Select\s+options=\{classOptions\}\s+placeholder="Select Class"(.*?)value=\{[\s\S]*?onChange=\{\(selected\)\s*=>\s*\{[\s\S]*?\}\)\;\s*\}\}/s;
  const newSelect = `<Select
                    options={classOptions}
                    placeholder="Select Class(es)"$1isMulti
                    value={
                      classOptions.filter(
                        (opt) => formData.classScheduleIds.includes(opt.value)
                      )
                    }
                    onChange={(selected) => {
                      setFormData((prev) => ({
                        ...prev,
                        classScheduleIds: selected ? selected.map(s => s.value) : [],
                      }));
                    }}`;
  content = content.replace(selectPattern, newSelect);

  // 7. user.status == "not_resolved" -> "not_resolve"
  content = content.replace(/user\.status\s*===?\s*"not_resolved"/g, 'user.status === "not_resolve" || user.status === "not_resolved"');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', filePath);
  } else {
    console.log('No changes:', filePath);
  }
}
