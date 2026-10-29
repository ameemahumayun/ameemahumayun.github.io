/* ==========================================================================
   EVALUATION CLINIC — content
   Everything the activities say (purposes, steps, frameworks, the TB-Screen
   worked example) lives here, transcribed from the Evaluation Clinic slides
   (Ayesha Mirza & Ameemah Humayun). app.js only renders and stores answers.
   ========================================================================== */
window.CLINIC = (function () {
  "use strict";

  const STAGES = [
    { id: "input", label: "Input data", full: "Gathering input data",
      desc: "How information is collected, expressed, interpreted and entered into the AI system",
      tb: "X-ray capture and upload" },
    { id: "interpret", label: "Interpreting outputs", full: "Interpreting AI outputs",
      desc: "How people make sense of generated information and assess its relevance or reliability",
      tb: "the MO reads the score" },
    { id: "action", label: "Care action", full: "Initiating a care action",
      desc: "How AI-generated information is, or is not, used in clinical decisions",
      tb: "referral for GeneXpert, follow-up" },
  ];

  const CHALLENGES = [
    { name: "Data inconsistencies", stage: "input", def: "Varying formats, units or collection practices make inputs unreliable" },
    { name: "Poor environmental conditions", stage: "input", def: "Physical conditions where data is captured lower its quality" },
    { name: "Data restrictions", stage: "input", def: "Ethical, legal or organisational limits constrain what can be used" },
    { name: "Hidden predictors", stage: "interpret", def: "Users rely on contextual cues the model doesn't include" },
    { name: "Mismatched objectives", stage: "interpret", def: "The output differs from the decision the user needs to make" },
    { name: "Decision-point disconnect", stage: "interpret", def: "The output doesn't reach users at the moment of decision" },
    { name: "Insufficient causal information", stage: "action", def: "The tool is asked cause-and-effect questions it wasn't built for" },
    { name: "Value conflicts", stage: "action", def: "Use exposes differing views of the organisation's values" },
    { name: "Disrupted workflows", stage: "across", def: "The tool reshapes communication, coordination and roles in teams" },
    { name: "Limited understanding", stage: "across", def: "Users don't know how outputs are produced, so rely on them less" },
    { name: "Additional labour", stage: "across", def: "Use demands extra, often unexpected data and coordination work" },
  ];

  const TESTS = [
    { id: "technical", name: "Technical evaluation", stage: "input", checks: "Can the tool read real local inputs?" },
    { id: "usability", name: "Usability test, with seeded wrong outputs", stage: "interpret", checks: "Can users read the output, and catch it when it's wrong?" },
    { id: "silent", name: "Silent trial", stage: "interpret", checks: "Does the output arrive in time, at a workable load, before anyone acts on it?" },
    { id: "accuracy", name: "Accuracy validation on local cases", stage: "action", checks: "Is it right often enough, at our prevalence, to act on?" },
  ];

  const CHANGE_KINDS = ["Tool", "Task", "Conditions"];

  /* Reference panels: { title, note?, head: [..], rows: [[..]], cite? } */
  const REF = {
    fittDims: {
      title: "FITT: Fit between Individual, Task and Technology",
      head: ["Dimension", "Definition", "TB-Screen examples"],
      rows: [
        ["Individual", "Characteristics, capabilities, expectations, experience and attitudes of the people involved", "Radiographer, medical officer, lab technician and patients"],
        ["Task", "Activities, goals, responsibilities and demands of the work being performed", "X-ray capture, referral decision, sputum testing, follow-up"],
        ["Technology", "Functions, features, information structures and properties of the system", "Score from 0 to 100, referral threshold of 50, upload from the X-ray room"],
      ],
      cite: "Ammenwerth, Iller and Mahler (2006), BMC Medical Informatics and Decision Making",
    },
    fittRels: {
      title: "FITT: the three relationships",
      head: ["Relationship", "Question it asks", "TB-Screen example"],
      rows: [
        ["Individual–task", "Does the individual have the capacity, skills, time and organisational conditions to do the task?", "Whether the MO has time to open another screen at 150 patients a day"],
        ["Individual–technology", "Does the technology match the user's needs, capabilities, expectations and practices?", "Whether MOs trust a number more than their own reading of the film"],
        ["Task–technology", "Does the technology support the actual requirements and sequence of the task?", "Whether the score arrives while the patient is still in the consultation"],
        ["Individual–task–technology", "Can this person, under their real conditions, use the tool to complete the task from start to finish, without a strength in one relationship being cancelled by a gap in another?", "The score may be accurate and the MO capable, but if it arrives after the decision, the tool fails"],
      ],
      note: "Overall: the tool works only when every relationship fits at once.",
      cite: "Ammenwerth, Iller and Mahler (2006), BMC Medical Informatics and Decision Making",
    },
    iso: {
      title: "“This works”: ISO 9241-11 and words in context",
      note: "ISO defines usability as the extent to which a system can be used by specified users to achieve specified goals with effectiveness, efficiency and satisfaction in a specified context of use.",
      head: ["Term", "Quality of care: how clinicians usually mean it", "ISO 9241-11: how we use it today"],
      rows: [
        ["Effectiveness", "Care achieves the intended clinical outcome", "The user achieves their goal with the tool, accurately and completely"],
        ["Efficiency", "No waste of staff, supplies or money", "Time and effort the user spends, relative to what they achieve"],
        ["Satisfaction", "The patient is satisfied with their care", "The tool meets the user's needs and expectations"],
      ],
      cite: "ISO 9241-11:2018",
    },
    isoContexts: {
      title: "Example: Context A and Context B",
      note: "Context A · ideal: off-peak, power on, normal load. Context B · busy: peak OPD, ~150 patients per MO, power cuts. Same users, same definitions; Context B is the same definitions under pressure.",
      head: ["Individual · task", "Context", "Effectiveness", "Efficiency", "Satisfaction"],
      rows: [
        ["Medical officer · referral decision", "A", "Refers the right patients, including when the score is wrong", "Finds and reads the score in a few seconds", "The score helps their decision"],
        ["Medical officer · referral decision", "B", "Score often not seen before the decision", "No time to open a separate screen", "Sees the score as extra work"],
        ["Lab technician · sample testing", "A", "Every referred sample is tested on time", "A normal number of samples per technician", "The added workload is acceptable"],
        ["Lab technician · sample testing", "B", "Backlog; some samples tested the next day", "Twice the usual samples per technician", "The added workload is not acceptable"],
      ],
    },
    stages: {
      title: "Reinmund's three stages of an AI-supported care pathway",
      head: ["Stage", "What happens there", "TB-Screen"],
      rows: STAGES.map(function (s) { return [s.full, s.desc, s.tb]; }),
      cite: "Reinmund, Kunze and Jirotka (2026), CHI",
    },
    challenges: {
      title: "Reinmund's eleven challenges",
      head: ["Stage", "Challenge", "Definition"],
      rows: CHALLENGES.map(function (c) {
        const st = STAGES.find(function (s) { return s.id === c.stage; });
        return [st ? st.label : "Across stages", c.name, c.def];
      }),
      cite: "Reinmund, Kunze and Jirotka (2026), Sociotechnical Challenges of Machine Learning in Healthcare and Social Welfare",
    },
    tests: {
      title: "Which test, for which stage (from Lecture 6)",
      head: ["Stage (Ex. 3)", "Test (Lecture 6)", "What it checks"],
      rows: TESTS.map(function (t) {
        return [STAGES.find(function (s) { return s.id === t.stage; }).label, t.name, t.checks];
      }),
      note: "Reference standard: the best available truth, set by someone who doesn't see the tool's answer. Go on only if: the number, written before you start, that lets you move to the next stage. A failed gate sends you back to step 2, not forward with a caveat.",
    },
  };

  /* Worked examples, shown read-only under "See the TB-Screen example". */
  const EXAMPLES = {
    1: {
      head: ["Individual", "Characteristics and working conditions", "Task"],
      rows: [
        ["Radiographer", "Trained in X-ray; one per shift; ageing machine; frequent power cuts", "Capture and upload the X-ray"],
        ["Medical officer", "About 150 patients a day, about 3 minutes each; trusts own reading of films", "Decide who needs a sputum test"],
        ["Medical officer (set aside)", "Same person, same conditions", "Explain the referral to the patient and relative"],
        ["Lab technician", "Two staff; fixed cartridge supply", "Run GeneXpert on referred samples"],
        ["Patient", "Often rural; many cannot read; may come with a relative who speaks for them", "Go for the test and return for the result"],
      ],
      note: "One individual can have several tasks, and each individual–task pair is its own relationship. Here we follow four pairs, one per individual; the set-aside row shows a second task we leave out.",
    },
    2: {
      head: ["Individual · task", "Individual–technology", "Task–technology"],
      rows: [
        ["Radiographer · capture and upload the X-ray", "New upload screen on an old machine; needs a stable connection", "Adds an upload step after every X-ray"],
        ["Medical officer · decide who needs a sputum test", "A score from 0 to 100, for an MO used to reading films", "The score must arrive before the referral decision"],
        ["Lab technician · run GeneXpert on referred samples", "Does not use the tool directly", "The tool's threshold sets how many samples arrive"],
        ["Patient · go for the test and return", "Does not use the tool; relies on staff to explain the result", "Referral depends on the score being ready while the patient is still there"],
      ],
      note: "Each row is now one complete individual–task–technology relationship. People who never touch the tool still have a task–technology relationship with it.",
    },
    3: {
      head: ["Individual · task · technology", "Stage", "Challenge", "What it means for TB-Screen"],
      rows: [
        ["Radiographer · capture and upload X-ray · upload screen", "Input data", "Poor environmental conditions", "Old machine and power cuts: unreadable images, failed uploads"],
        ["Medical officer · referral decision · TB score 0–100", "Interpreting outputs", "Hidden predictors", "MOs weigh weight loss and contact history; the model sees neither"],
        ["Medical officer · referral decision · TB score 0–100", "Interpreting outputs", "Decision-point disconnect", "The score arrives after the patient has left the room"],
        ["Lab technician · run GeneXpert · referral threshold of 50", "Care action", "Value conflicts", "The programme wants more cases found; the lab wants a manageable load"],
        ["Patient · go for the test and return · referral from the score", "Care action", "Additional labour (across stages)", "Patients who leave before the score must be traced and called back"],
      ],
    },
    4: {
      head: ["Relationship", "Challenge", "Handled?", "What changes", "Test", "Measure", "Compared with", "Go on only if"],
      rows: [
        ["Medical officer · referral decision · score display", "Decision-point disconnect", "No", "Tool: score printed on the OPD token slip", "Silent trial", "% of decisions with the score ready beforehand", "Time of the MO's decision, observed", "Score ready before at least 80% of decisions"],
        ["Radiographer · capture X-ray · upload screen", "Poor environmental conditions", "Partly", "Tool: flags unreadable images so they're retaken at once", "Technical evaluation", "% of real local X-rays the tool can read", "A radiologist's read of the same films", "Fails on fewer than 10% of local X-rays"],
        ["Lab technician · run GeneXpert · referral threshold", "Value conflicts", "No", "Conditions: lab and programme set the threshold together", "Accuracy validation", "PPV at the agreed threshold; referrals a day", "GeneXpert result (reference standard)", "Referrals stay within lab capacity; PPV above the floor the lab and programme set"],
      ],
      note: "A failed gate sends you back to step 2, not forward with a caveat.",
    },
    5: {
      head: ["", "Statement"],
      rows: [
        ["Ex. 1–2", "For the medical officer deciding who needs a sputum test using the TB score,"],
        ["Ex. 3", "at the interpreting-outputs stage, decision-point disconnect means the score arrives after the patient has left."],
        ["Ex. 4", "We will print the score on the OPD token slip and run a silent trial, going on only if the score is ready before at least 80% of decisions."],
        ["Claim", "This will let us claim the score reaches the decision in a busy OPD. It will not show whether more TB is treated."],
        ["Rethink", "Looking back, our first plan was a silent trial of accuracy alone. Timing was the bigger risk, so timed observation now comes first."],
      ],
    },
  };

  const EXERCISES = [
    { n: 1, eyebrow: "FITT · Individual and task", title: "Individuals and Tasks",
      purpose: "Identify everyone involved with your tool and the tasks they carry out, using FITT's individual and task dimensions.",
      outcome: "A table of individuals, their characteristics and working conditions, and the tasks each one performs.",
      steps: ["List every individual: users and anyone affected", "Describe each one: role, skills, language, workload, time available", "List the tasks each one performs"],
      refs: ["fittDims", "fittRels"] },
    { n: 2, eyebrow: "FITT · Technology", title: "Technology in Context",
      purpose: "Add the technology to each individual–task pair by thinking through two relationships: individual–technology and task–technology.",
      outcome: "A complete list of individual–task–technology relationships, with both technology relationships described for each.",
      steps: ["For each pair, describe the individual–technology relationship", "Describe the task–technology relationship", "List every relationship in full: individual · task · technology"],
      refs: ["fittRels", "iso", "isoContexts"] },
    { n: 3, eyebrow: "Reinmund", title: "Relationships on the Pathway",
      purpose: "Find where on the care pathway each individual–task–technology relationship is applied, and which challenges it faces there.",
      outcome: "Every relationship sorted into a stage, with the challenges that apply and what each means for your tool.",
      steps: ["Take your relationships from Exercise 2: individual · task · technology", "Place each in a stage: input data, interpreting outputs or care action", "Pick the challenges at that stage, plus any across stages, and define each for your context"],
      refs: ["stages", "challenges"] },
    { n: 4, eyebrow: "Addressing the challenges", title: "Rethink, Then Test",
      purpose: "Fix what you can in the design, then choose the test from Lecture 6 that can evaluate whether it works or not.",
      outcome: "For each relationship and its challenge: what changes, which test checks it, and the gate it must pass.",
      steps: ["Check: is the challenge already handled by your design?", "Change: if not, name which part of the tool or task changes, or scope the conditions", "Pick the test: which Lecture 6 evaluation type checks it, given its stage", "Set the gate: what you measure, against what, and the “go on only if” number"],
      refs: ["tests"] },
    { n: 5, eyebrow: "Close", title: "Evidence Statement",
      purpose: "Bring every exercise together, then judge your own evaluation plan.",
      outcome: "One clear evidence statement, ending with what you would rethink.",
      steps: ["Who and what: individual, task and technology (Ex. 1–2)", "Where it can fail: stage and challenge, defined (Ex. 3)", "How you'll know: what changes, the test and its gate (Ex. 4)", "What you can claim, and what you cannot", "Rethink: what your plan missed, and what you'll change"],
      refs: [] },
  ];

  return { STAGES: STAGES, CHALLENGES: CHALLENGES, TESTS: TESTS, CHANGE_KINDS: CHANGE_KINDS,
           REF: REF, EXAMPLES: EXAMPLES, EXERCISES: EXERCISES };
})();
