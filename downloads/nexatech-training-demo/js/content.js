/* ==========================================================================
   NexaTech Training Platform — training content
   All learning content lives here so it can be reviewed and signed off by
   the client's health & safety lead. Content is ILLUSTRATIVE and must be
   validated against the client's own site rules before real use.
   ========================================================================== */
window.NEXA_CONTENT = (function () {
  "use strict";

  /* ---------- PPE catalogue ---------- */
  var PPE_ITEMS = {
    hardhat:   { label: "Hard hat",                 icon: "⛑️", why: "Protects against falling items and head strikes in areas with overhead loads or moving vehicles." },
    hivis:     { label: "Hi-vis vest",              icon: "🦺", why: "Makes you visible to forklift and vehicle operators — essential wherever vehicles and pedestrians share space." },
    boots:     { label: "Safety boots (steel toe)", icon: "🥾", why: "Protects feet from dropped loads and rolling wheels." },
    gloves:    { label: "Cut-resistant gloves",     icon: "🧤", why: "Protects hands from sharp edges, strapping and splinters when handling stock." },
    glasses:   { label: "Safety glasses",           icon: "🥽", why: "Protects eyes from splashes, dust and debris." },
    ear:       { label: "Ear defenders",            icon: "🎧", why: "Needed only where noise exceeds safe levels — not a general requirement for these zones." },
    respirator:{ label: "Respirator (FFP3)",        icon: "😷", why: "Needed for hazardous dust or fumes, which are not present in these zones under normal operation." },
    chemgloves:{ label: "Chemical-resistant gloves",icon: "🧪", why: "Protect skin when handling solvents and lubricants from the COSHH cabinet." }
  };

  /* ---------- Zones ---------- */
  var ZONES = {
    loadingBay: {
      zoneName: "Loading Bay",
      emoji: "🚚",
      blurb: "Reversing vehicles, dock plates and safe stacking.",
      minutes: 8,
      task: "You are about to help unload a delivery at the dock. Choose the PPE required for this task.",
      ppeRequired: ["hardhat", "hivis", "boots", "gloves"],
      hotspots: {
        ppe:   { title: "PPE Station",   body: "Hi-vis vest, hard hat, gloves and steel-toe boots must be worn in this zone. Check the PPE station before entering the marked loading area." },
        exit:  { title: "Emergency Exit",body: "The nearest emergency exit is signed in green and must be kept clear of pallets and trolleys at all times." },
        route: { title: "Vehicle Route", body: "Forklifts and delivery vehicles use the marked route along the east wall. Pedestrians must use the blue-lined walkway only." }
      },
      questions: [
        { q: "What should you do near a reversing forklift?",
          options: [
            { text: "Walk behind it if the alarm is sounding.", correct: false },
            { text: "Stay in the marked pedestrian route.", correct: true },
            { text: "Cross where the route is shortest.", correct: false }
          ],
          why: "Reversing vehicles have blind spots. The marked pedestrian route keeps you where drivers expect you to be." },
        { q: "A dock plate between the trailer and the bay is moving under foot traffic. What do you do?",
          options: [
            { text: "Cross quickly before it moves again.", correct: false },
            { text: "Stop using it, keep clear and report it to your supervisor.", correct: true },
            { text: "Wedge a pallet underneath to steady it.", correct: false }
          ],
          why: "A moving dock plate is a defect. Improvised fixes can fail suddenly — report it so it can be repaired." },
        { q: "How should pallets be stacked at the edge of the bay?",
          options: [
            { text: "As high as possible to save floor space.", correct: false },
            { text: "Within the marked stacking limit, leaving routes and the dock edge clear.", correct: true },
            { text: "Against the emergency exit door so they are out of the way.", correct: false }
          ],
          why: "Stacking limits prevent collapse, and clear routes keep exits and walkways usable in an emergency." }
      ]
    },
    forkliftAisle: {
      zoneName: "Forklift Aisle",
      emoji: "🦺",
      blurb: "Pedestrian routes, blind corners and racking load limits.",
      minutes: 8,
      task: "You need to walk through the forklift aisle to collect a pick list. Choose the PPE required.",
      ppeRequired: ["hardhat", "hivis", "boots"],
      hotspots: {
        walkway: { title: "Pedestrian Walkway", body: "The blue-lined walkway is the only route through this aisle on foot. Forklift operators do not expect pedestrians outside it." },
        mirror:  { title: "Blind Corner Mirror", body: "This corner has no direct sightline for forklift operators. Check the convex mirror before crossing." },
        racking: { title: "Racking Load Limit", body: "Each racking bay has a maximum load plate. Overloaded racking is a leading cause of warehouse collapse incidents." }
      },
      questions: [
        { q: "You hear a reversing alarm while standing in the pedestrian walkway. What should you do?",
          options: [
            { text: "Keep walking at the same pace — you're already in the walkway.", correct: false },
            { text: "Stop, locate the vehicle, then reposition further into the walkway if needed.", correct: true },
            { text: "Run to the nearest exit.", correct: false }
          ],
          why: "Stopping and locating the vehicle lets you make a safe decision instead of moving blindly into its path." },
        { q: "You are approaching a blind corner with a convex mirror. What is correct?",
          options: [
            { text: "Speed up so you cross before anything appears.", correct: false },
            { text: "Stop, check the mirror, listen, and cross only when clear.", correct: true },
            { text: "Wave to any driver and keep walking.", correct: false }
          ],
          why: "Mirrors show approaching traffic you cannot see directly. Never assume a driver has seen you." },
        { q: "You notice a racking bay loaded beyond its load plate, with a bent upright. What should you do?",
          options: [
            { text: "Unload it yourself straight away.", correct: false },
            { text: "Keep away, stop others entering and report it immediately.", correct: true },
            { text: "Ignore it — it has not fallen yet.", correct: false }
          ],
          why: "Damaged or overloaded racking can collapse without warning. Keep clear and get it assessed." }
      ]
    },
    partsStorage: {
      zoneName: "Automotive Parts Storage",
      emoji: "📦",
      blurb: "Manual handling, COSHH storage and fire exits.",
      minutes: 9,
      task: "You are asked to decant lubricant from the COSHH cabinet and move a small component. Choose the PPE required.",
      ppeRequired: ["hivis", "boots", "glasses", "chemgloves"],
      hotspots: {
        handling: { title: "Manual Handling Point", body: "Engine components on this rack exceed 15kg. Use the two-person lift procedure and the trolley provided." },
        coshh:    { title: "COSHH Cabinet", body: "Solvents and lubricants are stored in the yellow COSHH cabinet. Only COSHH-inducted staff may open it." },
        fireexit: { title: "Fire Exit Route", body: "This route must be kept clear of stock and trolleys at all times, including during busy deliveries." }
      },
      questions: [
        { q: "You notice stock has been left blocking the fire exit route. What should you do?",
          options: [
            { text: "Move the stock to a proper storage location immediately and report it.", correct: true },
            { text: "Leave it — it's not your department's stock.", correct: false },
            { text: "Make a note to mention it at next week's team meeting.", correct: false }
          ],
          why: "A blocked exit is an immediate risk to everyone. Fix it now and report it so it does not recur." },
        { q: "An engine component weighs about 20kg. How should you move it?",
          options: [
            { text: "Lift it alone, keeping your back straight.", correct: false },
            { text: "Use the two-person lift procedure with the trolley.", correct: true },
            { text: "Slide it off the rack and let it drop to the floor.", correct: false }
          ],
          why: "Loads over 15kg need a team lift or equipment. Dropping or solo-lifting causes injuries and damage." },
        { q: "You need solvent from the COSHH cabinet but have not completed COSHH induction. What do you do?",
          options: [
            { text: "Take it quickly — you only need a small amount.", correct: false },
            { text: "Ask a COSHH-inducted colleague or your supervisor to help.", correct: true },
            { text: "Borrow a colleague's key and return it later.", correct: false }
          ],
          why: "COSHH rules exist because hazardous substances harm in ways you cannot always see. Only inducted staff may handle them." }
      ]
    }
  };
  var ZONE_IDS = ["loadingBay", "forkliftAisle", "partsStorage"];

  /* ---------- Emergency scenarios (branching) ---------- */
  var SCENARIOS = {
    fire: {
      title: "Fire alarm in the warehouse",
      icon: "🔥",
      intro: "You are working in Automotive Parts Storage when the fire alarm sounds. Make the right decisions, step by step.",
      start: "a1",
      steps: {
        a1: { text: "The fire alarm is sounding continuously. You are halfway through a stock count.",
          options: [
            { text: "Finish the count first — it will only take two minutes.", score: 0, feedback: "Never delay. Every alarm must be treated as a real fire until told otherwise.", next: "a2" },
            { text: "Stop work, leave your equipment and head for the nearest exit.", score: 2, feedback: "Correct. Leave immediately — don't stop for belongings.", next: "a2" },
            { text: "Go and find out whether it is a false alarm.", score: 0, feedback: "Investigating puts you in danger. Evacuate and let the fire wardens check.", next: "a2" }
          ] },
        a2: { text: "You reach the fire exit route and find a trolley of boxes blocking the way. Smoke is not visible yet.",
          options: [
            { text: "Push through and climb over the trolley.", score: 0, feedback: "Risky — you could trip or injure yourself and block others.", next: "a3" },
            { text: "Use the next nearest clear exit and warn others as you go.", score: 2, feedback: "Good. Use an alternative route and keep colleagues moving.", next: "a3" },
            { text: "Turn back and wait where you were.", score: 0, feedback: "Waiting in the building is unsafe. Always keep moving to a safe exit.", next: "a3" }
          ] },
        a3: { text: "You are outside. Colleagues are gathering and you notice the loading-bay lift truck driver is not with the group.",
          options: [
            { text: "Go back in to look for them.", score: 0, feedback: "Never re-enter. Tell the fire warden — the emergency services will search.", next: "end" },
            { text: "Go to the assembly point, report to the fire warden and tell them who is missing and where they were.", score: 2, feedback: "Correct. Accurate information helps the fire service find people quickly.", next: "end" },
            { text: "Phone them and wait to see if they answer.", score: 1, feedback: "Helpful but not enough on its own — the warden must know straight away.", next: "end" }
          ] }
      },
      outcomes: [
        { min: 5, title: "Excellent response", text: "You evacuated promptly, avoided hazards and gave useful information." },
        { min: 4, title: "Good, with gaps", text: "Your decisions were mostly sound. Review the feedback on the steps you missed." },
        { min: 0, title: "Needs more practice", text: "Some choices could have put you or others at risk. Review and try again." }
      ]
    },
    spill: {
      title: "Chemical spill from the COSHH cabinet",
      icon: "🧪",
      intro: "A container of solvent has tipped over inside Automotive Parts Storage and liquid is spreading across the floor.",
      start: "b1",
      steps: {
        b1: { text: "You are the first person to notice the spill. A strong smell is present.",
          options: [
            { text: "Mop it up straight away with paper towels.", score: 0, feedback: "Don't touch an unknown spill without PPE and the right kit.", next: "b2" },
            { text: "Keep back, warn others and stop anyone walking through.", score: 2, feedback: "Correct. Protect people first.", next: "b2" },
            { text: "Ignore it — someone from maintenance will see it.", score: 0, feedback: "Leaving a spill is dangerous: slips, fumes and fire risk.", next: "b2" }
          ] },
        b2: { text: "You are not COSHH-trained for spill clean-up. The label shows a flammable symbol.",
          options: [
            { text: "Turn off nearby ignition sources if safe, then report to your supervisor and the trained spill responder.", score: 2, feedback: "Correct. Remove ignition risks only if safe, and get trained help.", next: "b3" },
            { text: "Use the spill kit yourself — it is quicker.", score: 0, feedback: "Spill kits must be used by trained people who know the substance.", next: "b3" },
            { text: "Pour water over it to wash it away.", score: 0, feedback: "Water can spread the chemical or react with it. Follow the safety data sheet.", next: "b3" }
          ] },
        b3: { text: "A colleague has splashed some solvent on their hands and says they feel a burning sensation.",
          options: [
            { text: "Tell them to wipe it off with a rag and carry on.", score: 0, feedback: "Wiping can spread it. Skin contact needs proper first aid.", next: "end" },
            { text: "Take them to the eyewash/shower point or a first aider, follow the data sheet and report the incident.", score: 2, feedback: "Correct. Treat promptly, use the safety data sheet and report.", next: "end" },
            { text: "Wait to see if it settles.", score: 0, feedback: "Don't wait — chemical injuries can worsen quickly.", next: "end" }
          ] }
      },
      outcomes: [
        { min: 5, title: "Excellent response", text: "You protected people first, avoided untrained clean-up and escalated correctly." },
        { min: 4, title: "Good, with gaps", text: "Your decisions were mostly sound. Review the feedback on the steps you missed." },
        { min: 0, title: "Needs more practice", text: "Some choices could have caused harm. Review the feedback and try again." }
      ]
    },
    collision: {
      title: "Forklift incident in the aisle",
      icon: "🚜",
      intro: "A forklift has clipped a pallet in the forklift aisle. A colleague is on the floor and cannot get up.",
      start: "c1",
      steps: {
        c1: { text: "You arrive first at the scene. The forklift engine is still running.",
          options: [
            { text: "Rush to the colleague immediately.", score: 0, feedback: "Check for danger first — a running vehicle or unstable load could injure you too.", next: "c2" },
            { text: "Check it is safe, then ask the driver to switch off and apply the brake.", score: 2, feedback: "Correct. Make the area safe before helping.", next: "c2" },
            { text: "Run off to find a supervisor.", score: 0, feedback: "Someone needs to call for help too, but making the scene safe and getting a first aider is the priority.", next: "c2" }
          ] },
        c2: { text: "The colleague is conscious but in pain and says their leg hurts.",
          options: [
            { text: "Help them stand up and walk to the office.", score: 0, feedback: "Moving an injured person can make injuries worse.", next: "c3" },
            { text: "Keep them still and comforted, send someone for the first aider and call the emergency number.", score: 2, feedback: "Correct. Keep still, get trained help and call for an ambulance if needed.", next: "c3" },
            { text: "Give them painkillers from your bag.", score: 0, feedback: "Never give medication — it could be harmful and hide symptoms.", next: "c3" }
          ] },
        c3: { text: "The colleague has been taken care of. Your supervisor arrives and asks you what happened.",
          options: [
            { text: "Tell them what you saw, keep the area as it is and complete an accident report.", score: 2, feedback: "Correct. Facts, preserved scene and a written report support investigation.", next: "end" },
            { text: "Move the pallet and forklift back to normal so work can resume.", score: 0, feedback: "Don't disturb the scene before it has been investigated.", next: "end" },
            { text: "Say it was nothing serious and go back to work.", score: 0, feedback: "Every injury must be reported and investigated.", next: "end" }
          ] }
      },
      outcomes: [
        { min: 5, title: "Excellent response", text: "You made the scene safe, called for help and preserved the evidence." },
        { min: 4, title: "Good, with gaps", text: "Your decisions were mostly sound. Review the feedback on the steps you missed." },
        { min: 0, title: "Needs more practice", text: "Some choices could have worsened the incident. Review the feedback and try again." }
      ]
    }
  };
  var SCENARIO_IDS = ["fire", "spill", "collision"];

  /* ---------- Extra general questions for the final assessment ---------- */
  var GENERAL_QUESTIONS = [
    { q: "Nobody was hurt but a pallet nearly fell from the racking. Should you report it?",
      options: [
        { text: "No — no one was hurt.", correct: false },
        { text: "Yes — near misses are reported so the cause can be fixed.", correct: true },
        { text: "Only if it happens twice.", correct: false }
      ],
      why: "Near misses are early warnings. Reporting them prevents the next one from causing an injury." },
    { q: "When you hear the fire alarm, which is correct?",
      options: [
        { text: "Collect your belongings and use the lift.", correct: false },
        { text: "Leave by the nearest safe exit and go to the assembly point.", correct: true },
        { text: "Finish your task, then leave.", correct: false }
      ],
      why: "Leave immediately by stairs or exits, never lifts, and report to the assembly point." },
    { q: "Where must you wear a hi-vis vest?",
      options: [
        { text: "Anywhere vehicles and pedestrians share space.", correct: true },
        { text: "Only when a supervisor is watching.", correct: false },
        { text: "Only outdoors.", correct: false }
      ],
      why: "Hi-vis helps drivers see you wherever vehicles operate — indoors or out." }
  ];

  /* ---------- Safety guide ---------- */
  var DEFAULT_CONTACTS = {
    emergency: "999 (or 112)",
    safetyOfficer: "Site safety officer — ext. 100",
    firstAider: "First aider on duty — ext. 101",
    assembly: "Assembly point A — main car park, beside the visitor entrance"
  };
  var GLOSSARY = [
    { term: "PPE", def: "Personal protective equipment — items such as hi-vis, boots, gloves and glasses that protect you from workplace hazards." },
    { term: "COSHH", def: "Control of Substances Hazardous to Health — the rules for storing, handling and disposing of hazardous substances safely." },
    { term: "Near miss", def: "An event that could have caused harm or damage but did not. Always report near misses." },
    { term: "SDS", def: "Safety data sheet — a document that tells you the hazards of a substance and how to respond to spills or exposure." },
    { term: "Assembly point", def: "The safe place outside the building where everyone gathers after an evacuation so that a roll call can be taken." },
    { term: "Load plate", def: "A sign on racking showing the maximum weight each bay can safely carry." },
    { term: "Two-person lift", def: "A manual handling procedure where two people lift together, used for loads over the single-person limit." }
  ];

  return {
    PPE_ITEMS: PPE_ITEMS,
    ZONES: ZONES,
    ZONE_IDS: ZONE_IDS,
    SCENARIOS: SCENARIOS,
    SCENARIO_IDS: SCENARIO_IDS,
    GENERAL_QUESTIONS: GENERAL_QUESTIONS,
    DEFAULT_CONTACTS: DEFAULT_CONTACTS,
    GLOSSARY: GLOSSARY,
    PASS_MARK_ZONE: 2,       // correct answers needed out of 3
    FINAL_QUESTIONS: 8,      // questions drawn for the final assessment
    FINAL_PASS_PERCENT: 75
  };
})();
