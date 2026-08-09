
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const schedule = {
  1: [
    {start:"08:05", end:"08:50", course:"4th Grade B", type:"class"},
    {start:"09:05", end:"10:35", course:"Collaboration", type:"admin"},
    {start:"10:45", end:"12:15", course:"2nd Grade B", type:"class"},
    {start:"12:45", end:"13:30", course:"Collaboration", type:"admin"},
    {start:"13:30", end:"15:00", course:"1st Grade B", type:"class"},
    {start:"15:00", end:"15:40", course:"Lunch", type:"admin"},
  ],
  2: [
    {start:"08:05", end:"08:50", course:"4th Grade B", type:"class"},
    {start:"09:05", end:"10:35", course:"2nd Grade B", type:"class"},
    {start:"10:45", end:"12:15", course:"4th Grade A", type:"class"},
    {start:"12:45", end:"14:15", course:"1st Grade A", type:"class"},
    {start:"14:15", end:"15:00", course:"Lunch", type:"admin"},
  ],
  3: [
    {start:"08:05", end:"08:50", course:"1st Grade A", type:"class"},
    {start:"09:05", end:"10:35", course:"3rd Grade B", type:"class"},
    {start:"10:45", end:"12:15", course:"2nd Grade A", type:"class"},
    {start:"12:45", end:"14:15", course:"3rd Grade A", type:"class"},
    {start:"14:15", end:"15:00", course:"1st Grade B", type:"class"},
    {start:"15:00", end:"15:40", course:"Lunch", type:"admin"},
  ],
  4: [
    {start:"08:05", end:"08:50", course:"1st Grade A", type:"class"},
    {start:"09:05", end:"10:35", course:"4th Grade A", type:"class"},
    {start:"10:45", end:"12:15", course:"3rd Grade A", type:"class"},
    {start:"12:45", end:"14:15", course:"3rd Grade B", type:"class"},
    {start:"14:15", end:"15:00", course:"Lunch", type:"admin"},
  ],
  5: [
    {start:"08:05", end:"08:50", course:"1st Grade B", type:"class"},
    {start:"09:05", end:"10:35", course:"Collaboration", type:"admin"},
    {start:"10:45", end:"12:15", course:"4th Grade B", type:"class"},
    {start:"12:45", end:"14:15", course:"2nd Grade A", type:"class"},
    {start:"14:15", end:"15:00", course:"English Dept. Meeting", type:"admin"},
    {start:"15:00", end:"15:40", course:"Lunch", type:"admin"},
  ]
};

const blockedDates = {
  "2026-08-13": "School Anniversary · No regular classes",
  "2026-08-14": "School Anniversary · No regular classes"
};

const STORAGE_KEY = "carolina-teacher-planner-v1";
let plannerData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

let currentView = "month";
let shownMonth = 7; // August
let shownYear = 2026;
let selectedWeekStart = mondayOf(new Date(2026, 7, 10));

const $ = (id) => document.getElementById(id);
const monthView = $("monthView");
const weekView = $("weekView");
const planningView = $("planningView");
const lessonDialog = $("lessonDialog");
const backupDialog = $("backupDialog");

function pad(n){ return String(n).padStart(2,"0"); }
function dateKey(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function mondayOf(d){
  const x = new Date(d);
  const day = x.getDay() === 0 ? 7 : x.getDay();
  x.setDate(x.getDate() - (day - 1));
  x.setHours(12,0,0,0);
  return x;
}
function addDays(d,n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function humanDate(d){
  return d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
function gradeClass(course){
  if(course.startsWith("1st")) return "grade-1";
  if(course.startsWith("2nd")) return "grade-2";
  if(course.startsWith("3rd")) return "grade-3";
  if(course.startsWith("4th")) return "grade-4";
  return "admin";
}
function itemKey(d,item){ return `${dateKey(d)}|${item.start}|${item.course}`; }
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerData)); }
function lessonData(d,item){ return plannerData[itemKey(d,item)] || {}; }
function isPilotDate(d){
  return d.getFullYear() === 2026 && (d.getMonth() === 7 || d.getMonth() === 8);
}
function isToday(d){
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
function durationLabel(start,end){
  const [sh,sm]=start.split(":").map(Number);
  const [eh,em]=end.split(":").map(Number);
  const mins=(eh*60+em)-(sh*60+sm);
  return `${mins} min`;
}
function getDaySchedule(d){
  const key = dateKey(d);
  if(blockedDates[key]){
    return [{start:"",end:"",course:blockedDates[key],type:"admin",blocked:true}];
  }
  const jsDay = d.getDay();
  if(jsDay === 0 || jsDay === 6) return [];
  return schedule[jsDay] || [];
}

function setView(view){
  currentView = view;
  monthView.classList.toggle("hidden", view !== "month");
  weekView.classList.toggle("hidden", view !== "week");
  planningView.classList.toggle("hidden", view !== "planning");

  $("monthTab").classList.toggle("active", view==="month");
  $("weekTab").classList.toggle("active", view==="week");
  $("planningTab").classList.toggle("active", view==="planning");

  render();
}

function render(){
  if(currentView==="month") renderMonth();
  if(currentView==="week") renderWeek();
  if(currentView==="planning") renderPlanning();
}

function renderMonth(){
  $("periodTitle").textContent = `${MONTHS[shownMonth]} ${shownYear}`;
  $("periodSubtitle").textContent = "Tap a day to open that week.";
  const grid = $("monthGrid");
  grid.innerHTML = "";

  const first = new Date(shownYear, shownMonth, 1, 12);
  const firstDay = first.getDay() === 0 ? 7 : first.getDay();
  const start = addDays(first, -(firstDay-1));

  for(let i=0;i<42;i++){
    const d = addDays(start,i);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    if(d.getMonth()!==shownMonth) cell.classList.add("outside");
    if(isToday(d)) cell.classList.add("today");

    const items = getDaySchedule(d).filter(x=>x.type==="class" || x.blocked);
    const plannedCount = items.filter(item => {
      if(item.blocked) return false;
      const data = lessonData(d,item);
      return Boolean(data.title || data.objective || data.status);
    }).length;

    const header = document.createElement("div");
    header.className = "day-number";
    header.innerHTML = `<span>${d.getDate()}</span><span class="day-count">${plannedCount ? plannedCount+" planned" : ""}</span>`;
    cell.appendChild(header);

    items.slice(0,5).forEach(item=>{
      const chip = document.createElement("span");
      chip.className = `class-chip ${gradeClass(item.course)}`;
      if(item.blocked){
        chip.textContent = "🎉 Anniversary";
      } else {
        const data = lessonData(d,item);
        if(data.status==="assessment") chip.classList.add("assessment-chip");
        if(data.status==="done") chip.classList.add("done-chip");
        const short = item.course.replace("Grade","G");
        chip.textContent = data.title ? `${short} · ${data.title}` : short;
      }
      cell.appendChild(chip);
    });

    cell.addEventListener("click",()=>{
      selectedWeekStart = mondayOf(d);
      setView("week");
    });
    grid.appendChild(cell);
  }
}

function weekLabel(start){
  const end=addDays(start,4);
  if(start.getMonth()===end.getMonth()){
    return `${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
}

function renderWeek(){
  $("periodTitle").textContent = `Week · ${weekLabel(selectedWeekStart)}`;
  $("periodSubtitle").textContent = "Tap a class to view or edit the lesson plan.";
  const grid=$("weekGrid");
  grid.innerHTML="";

  for(let i=0;i<5;i++){
    const d=addDays(selectedWeekStart,i);
    const col=document.createElement("article");
    col.className="week-day";
    if(isToday(d)) col.classList.add("today");

    const head=document.createElement("div");
    head.className="week-day-header";
    head.innerHTML=`<strong>${DAY_NAMES[i]}</strong><span>${d.getDate()} ${MONTHS[d.getMonth()]}</span>`;
    col.appendChild(head);

    const items=getDaySchedule(d);
    if(!items.length){
      col.innerHTML += `<p class="muted">No classes.</p>`;
    }

    items.forEach(item=>{
      const btn=document.createElement("button");
      btn.type="button";
      btn.className="week-item";
      const data=item.blocked?{}:lessonData(d,item);
      const status=data.status || "planned";
      btn.innerHTML = `
        <div class="time">${item.start ? item.start+"–"+item.end : "All day"}</div>
        <div class="name">${item.course}</div>
        ${data.title ? `<div class="mini-title">${data.unit ? data.unit+" · " : ""}${data.title}</div>` : ""}
        ${item.type==="class" ? `<span class="status-pill status-${status}">${statusLabel(status)}</span>` : ""}
      `;
      if(item.type==="class" && !item.blocked){
        btn.addEventListener("click",()=>openLesson(d,item));
      } else {
        btn.disabled = true;
      }
      col.appendChild(btn);
    });

    grid.appendChild(col);
  }
}

function statusLabel(status){
  return {
    planned:"Planned",
    ready:"Ready",
    done:"Done",
    continue:"Continue",
    assessment:"Assessment"
  }[status] || "Planned";
}

function renderPlanning(){
  $("periodTitle").textContent = `Plan · ${weekLabel(selectedWeekStart)}`;
  $("periodSubtitle").textContent = "Your fixed timetable is already here.";
  const list=$("planningList");
  list.innerHTML="";
  let total=0, ready=0;

  for(let i=0;i<5;i++){
    const d=addDays(selectedWeekStart,i);
    getDaySchedule(d).filter(x=>x.type==="class" && !x.blocked).forEach(item=>{
      total++;
      const data=lessonData(d,item);
      if(["ready","done","assessment"].includes(data.status)) ready++;

      const row=document.createElement("div");
      row.className="plan-row";
      row.innerHTML=`
        <div class="plan-date">${DAY_NAMES[i]}<br>${d.getDate()} ${MONTHS[d.getMonth()]}</div>
        <div>
          <div class="plan-course">${item.course}</div>
          <div class="plan-meta">${item.start}–${item.end} · ${durationLabel(item.start,item.end)}${data.title ? " · "+data.title : ""}</div>
        </div>
        <button class="${data.title || data.objective ? "secondary-btn" : "primary-btn"}">${data.title || data.objective ? "Edit" : "Add planning"}</button>
      `;
      row.querySelector("button").addEventListener("click",()=>openLesson(d,item));
      list.appendChild(row);
    });
  }
  $("weekProgress").textContent=`${ready} / ${total} ready`;
}

function openLesson(d,item){
  const key=itemKey(d,item);
  const data=plannerData[key] || {};

  $("lessonKey").value=key;
  $("dialogDate").textContent=humanDate(d).toUpperCase();
  $("dialogCourse").textContent=item.course;
  $("dialogTime").textContent=`${item.start}–${item.end} · ${durationLabel(item.start,item.end)}`;

  $("unitInput").value=data.unit || "";
  $("titleInput").value=data.title || "";
  $("objectiveInput").value=data.objective || "";
  $("sbInput").value=data.sb || "";
  $("wbInput").value=data.wb || "";
  $("canvaInput").value=data.canva || "";
  $("materialsInput").value=data.materials || "";
  $("sequenceInput").value=data.sequence || "";
  $("homeworkInput").value=data.homework || "";
  $("statusInput").value=data.status || "planned";
  $("notesInput").value=data.notes || "";

  lessonDialog.showModal();
}

$("lessonForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const key=$("lessonKey").value;
  plannerData[key]={
    unit:$("unitInput").value.trim(),
    title:$("titleInput").value.trim(),
    objective:$("objectiveInput").value.trim(),
    sb:$("sbInput").value.trim(),
    wb:$("wbInput").value.trim(),
    canva:$("canvaInput").value.trim(),
    materials:$("materialsInput").value.trim(),
    sequence:$("sequenceInput").value.trim(),
    homework:$("homeworkInput").value.trim(),
    status:$("statusInput").value,
    notes:$("notesInput").value.trim(),
    updatedAt:new Date().toISOString()
  };
  saveData();
  lessonDialog.close();
  render();
});

$("clearBtn").addEventListener("click",()=>{
  const key=$("lessonKey").value;
  if(confirm("Clear this lesson planning?")){
    delete plannerData[key];
    saveData();
    lessonDialog.close();
    render();
  }
});

$("copyPrevBtn").addEventListener("click",()=>{
  const key=$("lessonKey").value;
  const [dateStr,,course] = key.split("|");
  const currentDate = new Date(`${dateStr}T12:00:00`);
  let found=null;

  for(let i=1;i<=30;i++){
    const d=addDays(currentDate,-i);
    const items=getDaySchedule(d).filter(x=>x.course===course && x.type==="class");
    if(items.length){
      const candidate=plannerData[itemKey(d,items[0])];
      if(candidate){ found=candidate; break; }
    }
  }

  if(!found){
    alert("No previous saved lesson was found for this course.");
    return;
  }

  $("unitInput").value=found.unit || "";
  $("titleInput").value=found.title || "";
  $("objectiveInput").value=found.objective || "";
  $("sbInput").value=found.sb || "";
  $("wbInput").value=found.wb || "";
  $("canvaInput").value=found.canva || "";
  $("materialsInput").value=found.materials || "";
  $("sequenceInput").value=found.sequence || "";
  $("homeworkInput").value=found.homework || "";
  $("notesInput").value=found.notes || "";
  $("statusInput").value="planned";
});

$("closeDialogBtn").addEventListener("click",()=>lessonDialog.close());

$("monthTab").addEventListener("click",()=>setView("month"));
$("weekTab").addEventListener("click",()=>setView("week"));
$("planningTab").addEventListener("click",()=>setView("planning"));

$("prevBtn").addEventListener("click",()=>{
  if(currentView==="month"){
    shownMonth--;
    if(shownMonth<7 && shownYear===2026) shownMonth=8;
    if(shownMonth<0){ shownMonth=11; shownYear--; }
    if(shownYear!==2026 || ![7,8].includes(shownMonth)){ shownYear=2026; shownMonth=8; }
  }else{
    selectedWeekStart=addDays(selectedWeekStart,-7);
  }
  render();
});
$("nextBtn").addEventListener("click",()=>{
  if(currentView==="month"){
    shownMonth++;
    if(shownMonth>8 && shownYear===2026) shownMonth=7;
    if(shownMonth>11){ shownMonth=0; shownYear++; }
    if(shownYear!==2026 || ![7,8].includes(shownMonth)){ shownYear=2026; shownMonth=7; }
  }else{
    selectedWeekStart=addDays(selectedWeekStart,7);
  }
  render();
});

$("todayBtn").addEventListener("click",()=>{
  const today=new Date();
  const pilotToday = (today.getFullYear()===2026 && [7,8].includes(today.getMonth())) ? today : new Date(2026,7,10,12);
  shownYear=pilotToday.getFullYear();
  shownMonth=pilotToday.getMonth();
  selectedWeekStart=mondayOf(pilotToday);
  setView("week");
});

$("backupBtn").addEventListener("click",()=>backupDialog.showModal());
$("closeBackupBtn").addEventListener("click",()=>backupDialog.close());

$("exportBtn").addEventListener("click",()=>{
  const payload={
    app:"Carolina Teacher Planner",
    version:1,
    exportedAt:new Date().toISOString(),
    data:plannerData
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`teacher-planner-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$("importInput").addEventListener("change",async(e)=>{
  const file=e.target.files?.[0];
  if(!file) return;
  try{
    const parsed=JSON.parse(await file.text());
    const incoming=parsed.data || parsed;
    if(typeof incoming!=="object" || Array.isArray(incoming)) throw new Error("Invalid backup");
    plannerData=incoming;
    saveData();
    backupDialog.close();
    render();
    alert("Planner backup imported successfully.");
  }catch(err){
    alert("That file does not look like a valid planner backup.");
  }
  e.target.value="";
});

setView("month");
