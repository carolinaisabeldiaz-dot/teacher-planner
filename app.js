
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
const REMINDER_KEY = "carolina-teacher-planner-reminders-v1";

let plannerData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
let remindersData = JSON.parse(localStorage.getItem(REMINDER_KEY) || "{}");

let currentView = "month";
let shownMonth = 7;
let shownYear = 2026;
let selectedWeekStart = mondayOf(new Date(2026, 7, 10));
let currentSummaryContext = null;

const $ = (id) => document.getElementById(id);
const monthView = $("monthView");
const weekView = $("weekView");
const planningView = $("planningView");
const lessonDialog = $("lessonDialog");
const summaryDialog = $("summaryDialog");
const reminderDialog = $("reminderDialog");
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
function saveReminders(){ localStorage.setItem(REMINDER_KEY, JSON.stringify(remindersData)); }

function normalizeLesson(raw={}){
  // Keeps compatibility with the first pilot if the user already typed something.
  return {
    objective: raw.objective || "",
    opening: raw.opening || "",
    development: raw.development || raw.sequence || "",
    closing: raw.closing || "",
    status: raw.status === "assessment" ? "planned" : (raw.status || "planned"),
    isTest: Boolean(raw.isTest || raw.status === "assessment"),
    notes: raw.notes || "",
    updatedAt: raw.updatedAt || ""
  };
}

function lessonData(d,item){ return normalizeLesson(plannerData[itemKey(d,item)] || {}); }
function hasPlanning(d,item){
  const data=lessonData(d,item);
  return Boolean(data.objective || data.opening || data.development || data.closing || data.notes || data.isTest || data.status !== "planned");
}
function isToday(d){
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
function durationLabel(start,end){
  const [sh,sm]=start.split(":").map(Number);
  const [eh,em]=end.split(":").map(Number);
  return `${(eh*60+em)-(sh*60+sm)} min`;
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
function dayReminders(d){ return remindersData[dateKey(d)] || []; }
function activeReminderCount(d){ return dayReminders(d).filter(r=>!r.done).length; }

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
    const plannedCount = items.filter(item => !item.blocked && hasPlanning(d,item)).length;

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
        if(data.isTest) chip.classList.add("assessment-chip");
        if(data.status==="done") chip.classList.add("done-chip");
        const short = item.course.replace("Grade","G");
        chip.textContent = data.isTest ? `🔴 TEST · ${short}` : short;
      }
      cell.appendChild(chip);
    });

    const reminderCount=activeReminderCount(d);
    if(reminderCount){
      const rem=document.createElement("span");
      rem.className="class-chip reminder-chip";
      rem.textContent=`🔔 ${reminderCount} reminder${reminderCount>1?"s":""}`;
      cell.appendChild(rem);
    }

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

function renderReminderList(container,d){
  const reminders=dayReminders(d);
  if(!reminders.length) return;

  const list=document.createElement("div");
  list.className="reminder-list";

  reminders.forEach((r,idx)=>{
    const row=document.createElement("div");
    row.className="reminder-row"+(r.done?" done":"");

    const cb=document.createElement("input");
    cb.type="checkbox";
    cb.checked=Boolean(r.done);
    cb.addEventListener("change",()=>{
      remindersData[dateKey(d)][idx].done=cb.checked;
      saveReminders();
      render();
    });

    const text=document.createElement("div");
    text.className="reminder-text";
    text.textContent=r.text;

    const del=document.createElement("button");
    del.type="button";
    del.className="reminder-delete";
    del.textContent="✕";
    del.setAttribute("aria-label","Delete reminder");
    del.addEventListener("click",()=>{
      remindersData[dateKey(d)].splice(idx,1);
      if(!remindersData[dateKey(d)].length) delete remindersData[dateKey(d)];
      saveReminders();
      render();
    });

    row.append(cb,text,del);
    list.appendChild(row);
  });

  container.appendChild(list);
}

function renderWeek(){
  $("periodTitle").textContent = `Week · ${weekLabel(selectedWeekStart)}`;
  $("periodSubtitle").textContent = "Tap a class to see its plan. Add reminders at the top of each day.";
  const grid=$("weekGrid");
  grid.innerHTML="";

  for(let i=0;i<5;i++){
    const d=addDays(selectedWeekStart,i);
    const col=document.createElement("article");
    col.className="week-day";
    if(isToday(d)) col.classList.add("today");

    const head=document.createElement("div");
    head.className="week-day-header";

    const top=document.createElement("div");
    top.className="week-day-top";
    top.innerHTML=`<div><strong>${DAY_NAMES[i]}</strong><span>${d.getDate()} ${MONTHS[d.getMonth()]}</span></div>`;

    const reminderBtn=document.createElement("button");
    reminderBtn.type="button";
    reminderBtn.className="reminder-add";
    reminderBtn.textContent="+ Reminder";
    reminderBtn.addEventListener("click",()=>openReminder(d));
    top.appendChild(reminderBtn);

    head.appendChild(top);
    renderReminderList(head,d);
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

      if(data.isTest) btn.classList.add("test-item");

      btn.innerHTML = `
        ${data.isTest ? `<span class="test-mini-badge">TEST / ASSESSMENT</span>` : ""}
        <div class="time">${item.start ? item.start+"–"+item.end : "All day"}</div>
        <div class="name">${item.course}</div>
        ${item.type==="class" ? `<div class="mini-title">${hasPlanning(d,item) ? "Planning saved · tap to view" : "Tap to add planning"}</div>` : ""}
        ${item.type==="class" ? `<span class="status-pill status-${data.status || "planned"}">${statusLabel(data.status || "planned")}</span>` : ""}
      `;

      if(item.type==="class" && !item.blocked){
        btn.addEventListener("click",()=>{
          if(hasPlanning(d,item)) openSummary(d,item);
          else openLesson(d,item);
        });
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
    continue:"Continue"
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
      if(["ready","done"].includes(data.status)) ready++;

      const row=document.createElement("div");
      row.className="plan-row";
      if(data.isTest) row.classList.add("test-row");
      row.innerHTML=`
        <div class="plan-date">${DAY_NAMES[i]}<br>${d.getDate()} ${MONTHS[d.getMonth()]}</div>
        <div>
          ${data.isTest ? `<span class="test-mini-badge">TEST / ASSESSMENT</span>` : ""}
          <div class="plan-course">${item.course}</div>
          <div class="plan-meta">${item.start}–${item.end} · ${durationLabel(item.start,item.end)} · ${statusLabel(data.status)}</div>
        </div>
        <button class="${hasPlanning(d,item) ? "secondary-btn" : "primary-btn"}">${hasPlanning(d,item) ? "View" : "Add planning"}</button>
      `;
      row.querySelector("button").addEventListener("click",()=>{
        if(hasPlanning(d,item)) openSummary(d,item);
        else openLesson(d,item);
      });
      list.appendChild(row);
    });
  }
  $("weekProgress").textContent=`${ready} / ${total} ready`;
}

function openSummary(d,item){
  const data=lessonData(d,item);
  currentSummaryContext={d:new Date(d),item};

  $("summaryDate").textContent=humanDate(d).toUpperCase();
  $("summaryCourse").textContent=item.course;
  $("summaryTime").textContent=`${item.start}–${item.end} · ${durationLabel(item.start,item.end)}`;
  $("summaryObjective").textContent=data.objective || "—";
  $("summaryOpening").textContent=data.opening || "—";
  $("summaryDevelopment").textContent=data.development || "—";
  $("summaryClosing").textContent=data.closing || "—";
  $("summaryStatus").textContent=statusLabel(data.status);
  $("summaryStatus").className=`status-pill status-${data.status}`;
  $("summaryTestBadge").classList.toggle("hidden",!data.isTest);

  const notesWrap=$("summaryNotesWrap");
  notesWrap.classList.toggle("hidden",!data.notes);
  $("summaryNotes").textContent=data.notes || "—";

  summaryDialog.showModal();
}

function openLesson(d,item){
  const key=itemKey(d,item);
  const data=lessonData(d,item);

  $("lessonKey").value=key;
  $("dialogDate").textContent=humanDate(d).toUpperCase();
  $("dialogCourse").textContent=item.course;
  $("dialogTime").textContent=`${item.start}–${item.end} · ${durationLabel(item.start,item.end)}`;

  $("testInput").checked=Boolean(data.isTest);
  $("objectiveInput").value=data.objective || "";
  $("openingInput").value=data.opening || "";
  $("developmentInput").value=data.development || "";
  $("closingInput").value=data.closing || "";
  $("statusInput").value=data.status || "planned";
  $("notesInput").value=data.notes || "";

  lessonDialog.showModal();
}

$("lessonForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const key=$("lessonKey").value;
  plannerData[key]={
    objective:$("objectiveInput").value.trim(),
    opening:$("openingInput").value.trim(),
    development:$("developmentInput").value.trim(),
    closing:$("closingInput").value.trim(),
    status:$("statusInput").value,
    isTest:$("testInput").checked,
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
      if(candidate){ found=normalizeLesson(candidate); break; }
    }
  }

  if(!found){
    alert("No previous saved lesson was found for this course.");
    return;
  }

  $("testInput").checked=false;
  $("objectiveInput").value=found.objective || "";
  $("openingInput").value=found.opening || "";
  $("developmentInput").value=found.development || "";
  $("closingInput").value=found.closing || "";
  $("notesInput").value=found.notes || "";
  $("statusInput").value="planned";
});

$("editFromSummaryBtn").addEventListener("click",()=>{
  if(!currentSummaryContext) return;
  const {d,item}=currentSummaryContext;
  summaryDialog.close();
  openLesson(d,item);
});

$("closeSummaryBtn").addEventListener("click",()=>summaryDialog.close());
$("summaryCloseBtn").addEventListener("click",()=>summaryDialog.close());
$("closeDialogBtn").addEventListener("click",()=>lessonDialog.close());

function openReminder(d){
  $("reminderDateKey").value=dateKey(d);
  $("reminderDateTitle").textContent=d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  $("reminderTextInput").value="";
  reminderDialog.showModal();
  setTimeout(()=>$("reminderTextInput").focus(),50);
}

$("reminderForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const key=$("reminderDateKey").value;
  const text=$("reminderTextInput").value.trim();
  if(!text) return;
  remindersData[key] = remindersData[key] || [];
  remindersData[key].push({text,done:false,createdAt:new Date().toISOString()});
  saveReminders();
  reminderDialog.close();
  render();
});

document.querySelectorAll(".quick-reminder").forEach(btn=>{
  btn.addEventListener("click",()=>{
    $("reminderTextInput").value=btn.dataset.prefix;
    $("reminderTextInput").focus();
  });
});
$("closeReminderBtn").addEventListener("click",()=>reminderDialog.close());
$("cancelReminderBtn").addEventListener("click",()=>reminderDialog.close());

$("monthTab").addEventListener("click",()=>setView("month"));
$("weekTab").addEventListener("click",()=>setView("week"));
$("planningTab").addEventListener("click",()=>setView("planning"));

$("prevBtn").addEventListener("click",()=>{
  if(currentView==="month"){
    shownMonth = shownMonth===7 ? 8 : 7;
  }else{
    selectedWeekStart=addDays(selectedWeekStart,-7);
  }
  render();
});
$("nextBtn").addEventListener("click",()=>{
  if(currentView==="month"){
    shownMonth = shownMonth===7 ? 8 : 7;
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
    version:2,
    exportedAt:new Date().toISOString(),
    data:plannerData,
    reminders:remindersData
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
    plannerData=parsed.data || {};
    remindersData=parsed.reminders || {};
    saveData();
    saveReminders();
    backupDialog.close();
    render();
    alert("Planner backup imported successfully.");
  }catch(err){
    alert("That file does not look like a valid planner backup.");
  }
  e.target.value="";
});

setView("month");
