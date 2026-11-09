import fs from 'fs';

const file = 'src/modules/examinations/pages/ExaminationsPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// We will replace the entire handleCSVUpload function
const oldFunctionStart = "const handleCSVUpload = async (e) => {";
const oldFunctionEnd = "  const handleCreateExam = async (e) => {";

const startIndex = content.indexOf(oldFunctionStart);
const endIndex = content.indexOf(oldFunctionEnd);

if (startIndex === -1 || endIndex === -1) {
  console.log("❌ Could not find the function to replace. Please run the full script.");
  process.exit(1);
}

const newFunction = `  const handleCSVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const rows = text.split(/\\r?\\n/).map(row => row.trim()).filter(row => row)
        const dataRows = rows[0].toLowerCase().includes('code') ? rows.slice(1) : rows

        let success = 0
        let failed = 0
        let missingCourses = []

        for (const row of dataRows) {
          const [code, title, dateStr, location] = row.split(',').map(s => s?.trim())
          if (!code || !title || !dateStr) { failed++; continue }

          // 1. Check if course exists. Do NOT create it automatically.
          const existingCourse = courses.find(c => c.code.toLowerCase() === code.toLowerCase())
          
          if (!existingCourse) {
            missingCourses.push(code)
            failed++
            continue // Skip this row, but keep going
          }

          // 2. Parse Date
          const examDate = new Date(dateStr).toISOString()

          // 3. Insert Exam
          const { error: examErr } = await supabase.from('exams').insert([{ 
            course_id: existingCourse.id, 
            title, 
            exam_date: examDate, 
            location 
          }])

          if (examErr) failed++; else success++
        }

        // Build the alert message
        let alertMsg = \`✅ \${success} exams uploaded successfully!\\n❌ \${failed} rows failed.\\n\\n\`
        if (missingCourses.length > 0) {
          const uniqueMissing = [...new Set(missingCourses)]
          alertMsg += \`⚠️ WARNING: The following Course Codes do not exist in your database:\\n\${uniqueMissing.join(', ')}\\n\\nPlease upload these courses first using the 'Academic Mgmt' page.\`
        }

        alert(alertMsg)
        loadData()
      } catch (err) {
        alert("Error reading file: " + err.message)
      } finally {
        setUploading(false)
        e.target.value = null 
      }
    }
    reader.readAsText(file)
  }

`;

content = content.slice(0, startIndex) + newFunction + content.slice(endIndex);
fs.writeFileSync(file, content);
console.log("✅ Exam CSV Uploader fixed! It will no longer auto-create courses. It will warn you instead.");