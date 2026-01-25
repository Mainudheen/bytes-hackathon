const Allocation = require("../models/Allocation");
const LabAllocation = require("../models/LabAllocation");
const Student = require("../models/Student");

/* =====================================================
   BENCH VALIDATION:
   - Max 2 students per bench
   - If 2 students → must be from different years
===================================================== */

async function validateAllocationsYears(allocations) {

  const rollSet = new Set();

  allocations.forEach(a => {
    if (Array.isArray(a.students)) {
      a.students.forEach(s => {
        if (s?.rollno) rollSet.add(s.rollno.toUpperCase());
      });
    }
  });

  const rollnos = [...rollSet];

  if (rollnos.length === 0) return true;

  const studentDocs = await Student.find({
    rollno: { $in: rollnos }
  });

  const rollToYear = {};
  studentDocs.forEach(s => {
    rollToYear[s.rollno.toUpperCase()] = s.year;
  });

  for (const allocation of allocations) {

    const benches = {};

    const students = allocation.students || [];

    for (const s of students) {

      const roll = s.rollno.toUpperCase();

      const key =
        s.row != null && s.col != null
          ? `${s.row}-${s.col}`
          : `bench-${s.benchNo}`;

      if (!benches[key]) benches[key] = [];

      benches[key].push({
        roll,
        year: rollToYear[roll]
      });
    }

    for (const [key, arr] of Object.entries(benches)) {

      if (arr.length > 2) {
        const err = new Error(`Bench ${key} has more than 2 students`);
        err.code = "BENCH_FULL";
        throw err;
      }

      if (arr.length === 2) {

        const y0 = arr[0].year;
        const y1 = arr[1].year;

        if (!y0 || !y1) {
          const err = new Error(
            `Student year missing for bench ${key}`
          );
          err.code = "MISSING_YEAR";
          throw err;
        }

        if (y0 === y1) {
          const err = new Error(
            "Already this year student is present in this class and they are writing exam at the same time. No enough space to allocate."
          );
          err.code = "SAME_YEAR";
          throw err;
        }
      }
    }
  }

  return true;
}

/* =====================================================
   ROOM / LAB VALIDATION:
   - Only 2 different years per room/lab
   - Same year cannot repeat in same session/time
===================================================== */

async function validateRoomYears(
  allocations,
  { model = Allocation, keyField = "room" } = {}
) {

  const combos = {};

  allocations.forEach(a => {

    const keyVal = String(a[keyField]);
    const examDate = a.examDate;
    const time = a.time;
    const session = a.session;

    const comboKey = `${keyVal}|${examDate}|${time}|${session}`;

    if (!combos[comboKey]) {
      combos[comboKey] = {
        keyVal,
        examDate,
        time,
        session,
        incomingYears: new Set()
      };
    }

    if (a.year)
      combos[comboKey].incomingYears.add(String(a.year));
  });

  for (const comboKey of Object.keys(combos)) {

    const combo = combos[comboKey];

    if (combo.incomingYears.size > 2) {
      const err = new Error(
        `Cannot allocate more than two different years in ${keyField} ${combo.keyVal}`
      );
      err.code = "INCOMING_TOO_MANY_YEARS";
      throw err;
    }

    const query = {
      [keyField]: combo.keyVal,
      time: combo.time,
      session: combo.session
    };

    if (model.modelName === "LabAllocation") {
      query.examDate = new Date(combo.examDate);
    } else {
      query.examDate = combo.examDate;
    }

    const existing = await model.find(query);

    const existingYears = new Set(
      existing.map(e => e.year && String(e.year))
    );

    for (const iy of combo.incomingYears) {
      if (existingYears.has(iy)) {
        const err = new Error(
          "Already this year student is present in this room and they are writing exam at the same time. No enough space to allocate."
        );
        err.code = "SAME_YEAR_ROOM";
        throw err;
      }
    }

    const combined = new Set([
      ...existingYears,
      ...combo.incomingYears
    ]);

    if (combined.size > 2) {
      const err = new Error(
        `Room ${combo.keyVal} already contains two different years`
      );
      err.code = "THIRD_YEAR_ROOM";
      throw err;
    }
  }

  return true;
}

module.exports = {
  validateAllocationsYears,
  validateRoomYears
};
