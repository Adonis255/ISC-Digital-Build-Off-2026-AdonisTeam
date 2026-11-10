import fs from 'fs';

// 1. Fix the radius in MyClasses.jsx
const myClassesFile = 'src/modules/lecturer/pages/MyClasses.jsx';
let myClassesContent = fs.readFileSync(myClassesFile, 'utf8');

// Replace whatever radius is currently there with 300
myClassesContent = myClassesContent.replace(/radius_meters:\s*\d+,/g, 'radius_meters: 300,');
fs.writeFileSync(myClassesFile, myClassesContent);

// 2. Fix the LiveLecture.jsx to show Distance
const liveLectureFile = 'src/modules/lecturer/pages/LiveLecture.jsx';
let liveLectureContent = fs.readFileSync(liveLectureFile, 'utf8');

// Find the block where Present students are rendered and update the stats line
const oldPresentBlock = `<div>
                  <p className="font-medium">{r.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500 font-bold">P: {stats.present} | M: {stats.missed}</p>
                </div>`;

const newPresentBlock = `<div>
                  <p className="font-medium">{r.profiles?.full_name || 'Unknown'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-500 font-bold">P: {stats.present} | M: {stats.missed}</p>
                    {r.distance && (
                      <p className="text-[10px] text-brand-600 font-bold flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {Math.round(r.distance)}m away
                      </p>
                    )}
                  </div>
                </div>`;

if (liveLectureContent.includes(oldPresentBlock)) {
  liveLectureContent = liveLectureContent.replace(oldPresentBlock, newPresentBlock);
  fs.writeFileSync(liveLectureFile, liveLectureContent);
  console.log("✅ Distance added to Present list and radius set to 300m!");
} else {
  console.log("⚠️ Could not find exact block in LiveLecture, attempting fallback...");
  // Fallback regex in case spacing is slightly different
  liveLectureContent = liveLectureContent.replace(
    /(<p className="font-medium">\{r\.profiles\?\.full_name \|\| 'Unknown'\}<\/p>\s*)<p className="text-\[10px\] text-slate-500 font-bold">P: \{stats\.present\} \| M: \{stats\.missed\}<\/p>/,
    `$1<div className="flex items-center gap-2 mt-0.5">
      <p className="text-[10px] text-slate-500 font-bold">P: {stats.present} | M: {stats.missed}</p>
      {r.distance && <p className="text-[10px] text-brand-600 font-bold flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {Math.round(r.distance)}m away</p>}
    </div>`
  );
  fs.writeFileSync(liveLectureFile, liveLectureContent);
  console.log("✅ Fallback applied successfully!");
}