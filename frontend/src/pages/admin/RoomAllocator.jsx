import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
} from "docx";
import "../../styles/RoomAllocator.css";
import "../../styles/button.css";

/**
 * RoomAllocator (updated)
 * - Keeps your allocation logic (unchanged)
 * - Adds "Download Format" button that produces a .docx with one page per allocation
 *
 * NOTE: install "docx" and "file-saver" packages.
 */

function RoomAllocator() {
  const { state } = useLocation();
  const isEditMode = state?.editMode || false;
  const existingAllocation = state?.allocation || null;

  const [time, setTime] = useState("");
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [cat, setCat] = useState("");
  const [session, setSession] = useState("");
  const [examDate, setExamDate] = useState("");
  const [year, setYear] = useState("");
  const [semNo, setSemNo] = useState("");
  const [hallNo, setHallNo] = useState("");
  const [allocations, setAllocations] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [allocationMode, setAllocationMode] = useState("Normal"); // "Normal" or "Shuffle"
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [subjectWithCode, setSubjectWithCode] = useState("");

  // Fetch rooms
  useEffect(() => {
    fetch("http://localhost:5001/api/rooms")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => {
          const floorOrder = { GROUND: 0, "1ST": 1, "2ND": 2, "3RD": 3 };
          return (
            (floorOrder[a.floor?.toUpperCase()] || 0) -
            (floorOrder[b.floor?.toUpperCase()] || 0)
          );
        });
        setAllRooms(sorted);
      })
      .catch((err) => console.error("Failed to fetch rooms", err));
  }, []);

  // Pre-fill fields in edit mode
  useEffect(() => {
    if (isEditMode && existingAllocation) {
      setCat(existingAllocation.cat || "");
      setSession(existingAllocation.session || "");
      setExamDate(existingAllocation.examDate || "");
      setSubjectWithCode(existingAllocation.subjectWithCode || "");
      setYear(existingAllocation.year || "");
      setSemNo(existingAllocation.semester?.match(/\d+/)?.[0] || "");
      setHallNo(existingAllocation.hallNo || "");
      setSelectedRooms(
        existingAllocation.room ? existingAllocation.room.split(", ") : []
      );
      setTime(existingAllocation.time || ""); // keep old time
      if (existingAllocation.rollStart && existingAllocation.rollEnd) {
        setUploadedFiles([
          {
            name: "Existing Allocation",
            count: existingAllocation.totalStudents,
            students: existingAllocation.studentPositions?.map((sp) => sp.roll) || [],
            year: existingAllocation.year,
            class: "",
            department: "",
          },
        ]);
      }
    }
  }, [isEditMode, existingAllocation]);

  const invigilatorList = [
    "Dr.P.NATESAN",
    "Dr.R.S.LATHA",
    "Dr.R.RAJADEVI",
    "Dr.K.S.KALAIVANI",
    "Dr.S.KAYALVILI",
    "Dr.M.VIMALADEVI",
    "A.S.RENUGADEVI",
    "N.KANIMOZHI",
    "P.JAYASHARSHINI",
    "P.RAMYA",
    "J.CHARANYA",
    "S.KEERTHIKA",
    "S.PRIYANKA",
    "D.SATHYA",
    "R.THANGAMANI",
    "M.SRI KIRUTHIKA",
    "M.M.RAMYASRI",
    "N.KANNAN",
    "M.HARINI",
    "Dr.T.A.KARTHIKEYAN",
    "M.MOHANA ARASI",
    "N.VIGNESHWARAN",
    "S.GAYATHRI",
    "R.ARUNKUMAR",
    "Dr.M.MOHANASUNDARI",
    "Dr.R.R.RAJALAXMI",
    "Dr.C.NALINI",
    "Dr.K.LOGESWARAN",
    "Dr.K.SATHYA",
    "S.HAMSANANDHINI",
    "S.SANTHIYA",
    "S.BENIL JENNIFFER",
    "K.SENTHILVADIVU",
    "M.YOGA",
    "O.ABHILA ANJU",
    "M.NEELAMEGAN",
    "S.GOPINATH",
    "N.RENUKA",
    "R.SUBAPRIYA",
    "V.ARUN ANTONY",
    "A.VANMATHI",
  ];

  // Handle roll number Excel upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsProcessing(true);
    const newUploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const rolls = jsonData
        .map(
          (s) =>
            s.Roll ||
            s["Roll No"] ||
            s["RollNumber"] ||
            s["RollNo"] ||
            s.roll ||
            s.ROLL
        )
        .filter(Boolean)
        .map((r) => String(r).trim().toUpperCase());

      // Attempt to find Class and Dept from first row if they exist
      const firstRow = jsonData[0] || {};
      const classVal = firstRow.Class || firstRow.class || firstRow.YEAR || "";
      const deptVal = firstRow.Department || firstRow.Dept || firstRow.DEPT || "";

      newUploadedFiles.push({
        name: file.name,
        count: rolls.length,
        students: rolls,
        class: classVal,
        department: deptVal,
      });

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
    setIsProcessing(false);
    setProgress(0);
  };

  const handleRoomSelection = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    setSelectedRooms(selected);
  };

  const roundRobinMerge = (files) => {
    const maxLength = Math.max(...files.map((f) => f.students.length));
    const merged = [];
    for (let i = 0; i < maxLength; i++) {
      files.forEach((file) => {
        if (file.students[i]) {
          merged.push({
            roll: file.students[i],
            originalSheetName: file.name,
            class: file.class,
            department: file.department,
          });
        }
      });
    }
    return merged;
  };

  // --- existing allocate() kept same as you provided earlier (unchanged) ---
  const allocate = async () => {
    if (
      !cat ||
      !session ||
      !examDate ||
      !subjectWithCode ||
      !year ||
      !semNo ||
      !selectedRooms.length
    ) {
      alert("Please complete all fields including time and upload roll numbers");
      return;
    }

    const allStudents =
      allocationMode === "Shuffle"
        ? roundRobinMerge(uploadedFiles)
        : uploadedFiles.flatMap((file) =>
            file.students.map((roll) => ({
              roll,
              originalSheetName: file.name,
              class: file.class,
              department: file.department,
            }))
          );

    if (!isEditMode && (!allStudents.length || !time)) {
      alert("Please upload roll numbers and provide exam time");
      return;
    }

    const semesterDisplay =
      semNo && (parseInt(semNo) % 2 === 1 ? `Odd Sem ${semNo}` : `Even Sem ${semNo}`);
    const startingRoomNo = selectedRooms[0];
    const startIndex = allRooms.findIndex((r) => r.roomNo === startingRoomNo);
    const usableRooms = allRooms.slice(startIndex);

    let studentIndex = 0;
    const finalAllocation = [];
    const shuffledInvigilators = [...invigilatorList].sort(() => 0.5 - Math.random());
    let invIndex = 0;

    for (let i = 0; i < usableRooms.length && studentIndex < allStudents.length; i++) {
      const room = usableRooms[i];
      if (!room.columns || !room.columns.length) continue;

      // compute total seats in this room
      const totalSeats = room.columns.reduce((acc, col) => acc + col.rows, 0);

      const studentsForRoom = allStudents.slice(studentIndex, studentIndex + totalSeats);
      // We don't sort in shuffle mode to preserve round-robin order
      if (allocationMode !== "Shuffle") {
        studentsForRoom.sort((a, b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }));
      }

      if (!studentsForRoom.length) break;

      const inv1 = shuffledInvigilators[invIndex % shuffledInvigilators.length];
      const inv2 = shuffledInvigilators[(invIndex + 1) % shuffledInvigilators.length];
      invIndex += 2;

      // assign students column by column
      let posIndex = 0;
      const studentPositions = [];
      for (const col of room.columns) {
        for (let r = 1; r <= col.rows; r++) {
          if (posIndex >= studentsForRoom.length) break;
          studentPositions.push({
            roll: studentsForRoom[posIndex].roll,
            bench: r,
            col: col.colNo,
            originalSheetName: studentsForRoom[posIndex].originalSheetName,
            class: studentsForRoom[posIndex].class,
            department: studentsForRoom[posIndex].department,
          });
          posIndex++;
        }
      }

      finalAllocation.push({
        room: room.roomNo,
        hallNo,
        totalStudents: studentsForRoom.length,
        rollStart: studentsForRoom[0].roll,
        rollEnd: studentsForRoom[studentsForRoom.length - 1].roll,
        cat,
        session,
        time,
        examDate,
        year,
        semester: semesterDisplay,
        subjectWithCode,
        invigilators: [inv1, inv2],
        studentPositions,
      });

      studentIndex += totalSeats;
    }

    // Handle leftover students
    if (studentIndex < allStudents.length) {
      const leftover = allStudents.slice(studentIndex);
      if (allocationMode !== "Shuffle") {
        leftover.sort((a, b) => a.roll.localeCompare(b.roll, undefined, { numeric: true }));
      }
      finalAllocation.push({
        room: "❌ No Hall Available",
        hallNo: "N/A",
        totalStudents: leftover.length,
        rollStart: leftover[0].roll,
        rollEnd: leftover[leftover.length - 1].roll,
        leftoverRollNumbers: leftover.map((l) => l.roll),
        cat,
        session,
        time,
        examDate,
        year,
        semester: semesterDisplay,
        subjectWithCode,
        invigilators: ["-", "-"],
        isUnallocated: true,
      });
    }

    if ((session === "FN" && time >= "12:00") || (session === "AN" && time < "12:00")) {
      alert(session === "FN" ? "FN session should be AM (before 12:00)" : "AN session should be PM (12:00 and after)");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/save-allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocations: finalAllocation }),
      });
      const result = await res.json();
      if (res.ok) {
        alert("✅ Allocations saved successfully!");
        setAllocations(finalAllocation);
        // Clear uploaded files metadata after allocation as per memory id c972e9fa-d825-43a4-87dd-eb4be984eca2
        setUploadedFiles([]);
      } else {
        alert("❌ Error saving allocations: " + result.message);
      }
    } catch (err) {
      console.error("❌ Allocation save error:", err);
      alert("Server error during allocation save");
    }
  };

  // --- Basic Excel download (unchanged) ---
  const downloadExcel = () => {
    if (!allocations.length) {
      alert("No allocations to download.");
      return;
    }
    const wsData = [
      [
        "Hall No",
        "Room No",
        "Total Students",
        "Roll",
        "CAT",
        "Session",
        "Date",
        "Year",
        "Semester",
        "Subject with Code",
        "Invigilator 1",
        "Invigilator 2",
        "Bench & Column",
      ],
      ...allocations.flatMap((a) =>
        a.studentPositions
          ? a.studentPositions.map((sp) => [
              a.hallNo,
              a.room,
              a.totalStudents,
              sp.roll,
              a.cat,
              a.session,
              a.examDate,
              a.year,
              a.semester,
              a.subjectWithCode,
              a.invigilators[0],
              a.invigilators[1],
              `Bench ${sp.bench}, Column ${sp.col}`,
            ])
          : [
              [
                a.hallNo,
                a.room,
                a.totalStudents,
                a.rollStart,
                a.cat,
                a.session,
                a.examDate,
                a.year,
                a.semester,
                a.subjectWithCode,
                a.invigilators[0],
                a.invigilators[1],
                "-",
              ],
            ]
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Allocations");
    XLSX.writeFile(wb, `Allocations_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // ========== NEW: Download Format (DOCX) ==========
  // For each allocation we will:
  //  - fetch room structure (columns/rows) from backend (/api/rooms/:roomNo)
  //  - produce a nicely formatted page with header + seating layout table
const downloadFormatDocx = async () => {
    if (!allocations.length) {
      alert("No allocations to export.");
      return;
    }

    // Collect unique hall names
    const hallNames = [...new Set(allocations.map(a => a.room))];

    // Build rows for the summary table
    const summaryRows = allocations.map((a, idx) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(idx + 1))] }),
          new TableCell({
            children: [
              new Paragraph(`${a.examDate}`),
              new Paragraph(`${a.time} ${a.session}`)
            ]
          }),
          new TableCell({ children: [new Paragraph(String(a.totalStudents))] }),
          ...hallNames.map(h =>
            new TableCell({
              children: [
                new Paragraph(a.room === h ? String(a.totalStudents) : "-")
              ],
            })
          ),
          new TableCell({ children: [new Paragraph(String(hallNames.length))] }),
        ],
      });
    });

    // Header row for halls
    const hallHeaderCells = [
      new TableCell({ children: [new Paragraph("S.No.")] }),
      new TableCell({ children: [new Paragraph("Date and Session")] }),
      new TableCell({ children: [new Paragraph("Total no. of Students")] }),
      ...hallNames.map(h => new TableCell({ children: [new Paragraph(h)] })),
      new TableCell({ children: [new Paragraph("Total no. of halls")] }),
    ];

    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              text: "KONGU ENGINEERING COLLEGE",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "(Autonomous)",
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "PERUNDURAI – 638060",
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: "INTERNAL QUALITY ASSURANCE CELL",
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Seating Arrangement – CAT ${cat}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Department of Artificial Intelligence", alignment: AlignmentType.CENTER }),

            new Paragraph({
              children: [
                new TextRun({ text: "Academic Year : 2025-2026     " }),
                new TextRun({ text: `Semester : ${allocations[0].semester}` }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Class : ${year} - AIDS & AIML     ` }),
                new TextRun({ text: `Date : ${examDate}` }),
              ],
            }),
            new Paragraph({ text: "" }),

            new Paragraph({
              text: "List of Hall arrangement",
              alignment: AlignmentType.CENTER,
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [new TableRow({ children: hallHeaderCells }), ...summaryRows],
            }),
          ],
        },

        // Seating Layouts section
        {
          children: allocations.flatMap((alloc) => {
            const roomCols = allRooms.find((r) => r.roomNo === alloc.room)?.columns || [];
            const maxRows = roomCols.reduce((m, c) => Math.max(m, c.rows), 0);
            const seatIndex = {};
            alloc.studentPositions?.forEach((sp) => {
              if (!seatIndex[sp.col]) seatIndex[sp.col] = {};
              seatIndex[sp.col][sp.bench] = sp.roll;
            });

            const headerCells = roomCols.map(
              (c) =>
                new TableCell({
                  width: { size: Math.floor(9000 / roomCols.length), type: WidthType.DXA },
                  children: [new Paragraph({ text: `C${c.colNo}`, alignment: AlignmentType.CENTER })],
                })
            );

            const dataRows = [];
            for (let bench = 1; bench <= maxRows; bench++) {
              const cells = roomCols.map((c) => {
                const roll = (seatIndex[c.colNo] && seatIndex[c.colNo][bench]) || "";
                return new TableCell({
                  children: [new Paragraph({ text: roll, alignment: AlignmentType.CENTER })],
                });
              });
              dataRows.push(new TableRow({ children: cells }));
            }

            return [
              new Paragraph({ text: `Date & Session: ${alloc.examDate} ${alloc.session}`, bold: true }),
              new Paragraph({ text: `Hall No: ${alloc.room}`, bold: true }),
              new Paragraph({ text: `Class: ${alloc.year}`, bold: true }),
              new Table({
                rows: [new TableRow({ children: headerCells }), ...dataRows],
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({ text: "" }),
            ];
          }),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `SeatingArrangement_${examDate}.docx`);
  };

  const undoAllocation = async () => {
    if (!allocations.length) return;
    if (!window.confirm("Are you sure you want to undo the last allocation?")) return;

    try {
      const res = await fetch("http://localhost:5001/api/allocations");
      const currentAllocations = await res.json();
      
      const toDelete = currentAllocations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, allocations.length);

      for (const alloc of toDelete) {
        await fetch(`http://localhost:5001/api/allocations/${alloc._id}`, {
          method: "DELETE",
        });
      }

      alert("✅ Last allocation undone successfully!");
      setAllocations([]);
    } catch (err) {
      console.error("Undo error:", err);
      alert("Failed to undo allocation");
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="section-title">📅 Schedule an Exam</h2>

      <div className="control-panel">
        {/* Form Controls (same as before) */}
        <div>
          <label>CAT:</label>
          <div className="radio-group compact">
            {[1, 2, 3].map((n) => (
              <label key={n}>
                <input
                  type="radio"
                  name="cat"
                  value={n}
                  checked={cat === `${n}`}
                  onChange={(e) => setCat(e.target.value)}
                />{" "}
                {n}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Session:</label>
          <div className="radio-group compact">
            {["FN", "AN"].map((s) => (
              <label key={s}>
                <input
                  type="radio"
                  name="session"
                  value={s}
                  checked={session === s}
                  onChange={(e) => setSession(e.target.value)}
                />{" "}
                {s}
              </label>
            ))}
          </div>
        </div>

        {session && (
          <div>
            <label>Time ({session === "FN" ? "AM" : "PM"}):</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              min={session === "FN" ? "00:00" : "12:00"}
              max={session === "FN" ? "11:59" : "23:59"}
              required
            />
          </div>
        )}

        <div>
          <label>Date:</label>
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>

        <div>
          <label>Subject with Code:</label>
          <input value={subjectWithCode} onChange={(e) => setSubjectWithCode(e.target.value)} />
        </div>

        <div>
          <label>Year of Study:</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select Year</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>
        </div>

        <div>
          <label>Semester:</label>
          <input type="number" min="1" max="8" value={semNo} onChange={(e) => setSemNo(e.target.value)} />
        </div>

        <div>
          <label>Allocation Mode:</label>
          <div className="radio-group compact">
            {["Normal", "Shuffle"].map((m) => (
              <label key={m}>
                <input
                  type="radio"
                  name="allocationMode"
                  value={m}
                  checked={allocationMode === m}
                  onChange={(e) => setAllocationMode(e.target.value)}
                />{" "}
                {m}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Upload Roll Numbers (Multi-Select):</label>
          <input type="file" accept=".xlsx,.xls" multiple onChange={handleFileUpload} />
        </div>

        {isProcessing && (
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            <span>{progress}% Processing files...</span>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="file-preview-grid">
            {uploadedFiles.map((file, idx) => (
              <div key={idx} className="file-preview-card">
                <div className="file-info">
                  <strong>{file.name}</strong>
                  <p>{file.count} Students</p>
                  <p>{file.class} | {file.department}</p>
                </div>
                <button
                  className="remove-file-btn"
                  onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label>Select Rooms (Auto Allocates):</label>
          <select multiple value={selectedRooms} onChange={handleRoomSelection}>
            {allRooms.map((room, i) => (
              <option key={i} value={room.roomNo}>
                {room.roomNo} - {room.floor} - {room.columns?.length || 0} cols ({room.columns?.map((c) => `${c.rows} rows`).join(", ")})
              </option>
            ))}
          </select>
        </div>
        <div className="btn-row">
        <button className="btn" onClick={allocate}>
          <div id="container-stars"><div id="stars"></div></div>
          <strong>Allocate</strong>
          <div id="glow"><div className="circle"></div><div className="circle"></div></div>
        </button>

        <button className="btn" onClick={downloadExcel}>
          <div id="container-stars"><div id="stars"></div></div>
          <strong>📥 Download Excel</strong>
          <div id="glow"><div className="circle"></div><div className="circle"></div></div>
        </button>

        {/* NEW: Download Format (DOCX) */}
        <button className="btn" onClick={downloadFormatDocx} style={{ marginLeft: 12 }}>
          <div id="container-stars"><div id="stars"></div></div>
          <strong>📄 Download Format</strong>
          <div id="glow"><div className="circle"></div><div className="circle"></div></div>
        </button>

        {allocations.length > 0 && (
          <button className="btn undo-btn" onClick={undoAllocation} style={{ marginLeft: 12 }}>
            <div id="container-stars"><div id="stars"></div></div>
            <strong>↩️ Undo Allocation</strong>
            <div id="glow"><div className="circle"></div><div className="circle"></div></div>
          </button>
        )}
      </div>
      </div>

      {/* Allocation Cards and Visualization */}
      <div className="card-container">
        {allocations.map((a, idx) => {
           const roomCols = allRooms.find((r) => r.roomNo === a.room)?.columns || [];
           const maxRows = roomCols.reduce((m, c) => Math.max(m, c.rows), 0);
           const seatIndex = {};
           a.studentPositions?.forEach((sp) => {
             if (!seatIndex[sp.col]) seatIndex[sp.col] = {};
             seatIndex[sp.col][sp.bench] = sp;
           });

          return (
          <div className="allocation-card large" key={idx}>
            <div className="card-header">
              <span>🏫 Hall {a.hallNo}</span>
              <span>📅 {a.examDate}</span>
              <span>⏱️ {a.session}</span>
            </div>
            <div className="card-body show">
              <div className="allocation-info-grid">
                <div className="info-item">
                  <span className="label">Room:</span>
                  <span className="value">{a.room}</span>
                </div>
                <div className="info-item">
                  <span className="label">Time:</span>
                  <span className="value">{a.time}</span>
                </div>
                <div className="info-item">
                  <span className="label">Students:</span>
                  <span className="value">{a.rollStart} – {a.rollEnd} ({a.totalStudents})</span>
                </div>
                <div className="info-item">
                  <span className="label">Subject:</span>
                  <span className="value">{a.subjectWithCode}</span>
                </div>
                <div className="info-item">
                  <span className="label">Year / Sem:</span>
                  <span className="value">{a.year} - {a.semester}</span>
                </div>
                <div className="info-item">
                  <span className="label">Exam:</span>
                  <span className="value">CAT {a.cat}</span>
                </div>
                <div className="info-item full-width">
                  <span className="label">Invigilators:</span>
                  <span className="value">{a.invigilators.join(" & ")}</span>
                </div>
              </div>

              {a.studentPositions && (
                <div className="seating-visualization">
                  <h4>Seating Grid Visualization</h4>
                  <div className="seating-grid-container">
                    <table className="seating-grid">
                      <thead>
                        <tr>
                          <th>Row \ Col</th>
                          {roomCols.map(c => <th key={c.colNo}>C{c.colNo}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: maxRows }, (_, rIndex) => rIndex + 1).map(row => (
                          <tr key={row}>
                            <td className="row-header"><strong>{row}</strong></td>
                            {roomCols.map(col => {
                              const student = seatIndex[col.colNo]?.[row];
                              return (
                                <td key={col.colNo} className={student ? "occupied" : "empty"}>
                                  {student ? (
                                    <div className="seat-info">
                                      <span className="roll">{student.roll}</span>
                                      <span className="sheet-name">{student.originalSheetName}</span>
                                    </div>
                                  ) : <span className="empty-seat">Empty</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {a.isUnallocated && <div style={{ marginTop: "10px", color: "red" }}>
                <strong>Unallocated Roll Numbers:</strong><br />
                {a.leftoverRollNumbers.join(", ")}
              </div>}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}

export default RoomAllocator;
