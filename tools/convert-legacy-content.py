# Produces content/*.json from the supplied files in content-source/ and applies every recorded,
# source-verified fix (see FIXES and fix_vta). If you edit content/*.json by hand instead,
# add the same change here too, or stop using this script: re-running it overwrites content/.
#
# Run from the project root:  python tools/convert-legacy-content.py
# Converts the supplied banks in content-source/ into the spec schema in content/.
# Wording is copied verbatim except for the owner-authorized changes listed below
# (VTA fixes, SVA/RC option expansion), which are recorded in each question's "revision".
import json, random, re

SRC = "content-source/"
OUT = "content/"
DATE = "2026-09-28"
BC_FUTURE = "https://learnenglish.britishcouncil.org/grammar/english-grammar-reference/talking-about-future"
BC_PLANS = "https://learnenglish.britishcouncil.org/intermediate-grammar/future-plans"
BC_PP = "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect"
BC_PPC = "https://learnenglish.britishcouncil.org/grammar/b1-b2-grammar/present-perfect-simple-continuous"

BANKS = [
    # id, title, prefix, source file, prompt key, answer key
    ("verb-tenses-aspect", "Verb Tenses/Aspect", "vta", "verb_tenses_and_aspect_practice_questions.json", "question", "answer"),
    ("auxiliary-verbs-questions", "Auxiliary Verbs + Questions", "aux", "auxiliary_verbs_practice.json", "prompt", "correct_answer"),
    ("prepositions", "Prepositions", "prep", "english_prepositions_practice.json", "question", "answer"),
    ("articles", "Definite, Indefinite, and Zero Articles", "art", "english_articles_practice_questions.json", "sentence", "answer"),
    ("sentence-structure", "Sentence Structure/Word Order", "ss", "english_sentence_structure_practice.json", "prompt", "correct_answer"),
    ("quantifiers", "Quantifiers", "qnt", "quantifiers_practice_questions.json", "question", "correct_answer"),
    ("subject-verb-agreement", "Subject–Verb Agreement", "sva", "subject_verb_agreement_practice_questions.json", "question", "answer"),
    ("relative-clauses", "Relative Clauses", "rc", "relative_clauses_practice_questions.json", "question", "correct_answer"),
]

# --- Owner-authorized VTA fixes -------------------------------------------------
def fix_vta(q):
    if q["id"] == "vta-016":
        q["prompt"] = "It's only 11 a.m., and she _____ (write) three reports this morning."
        q["explanation"] = ("It is still morning, so 'this morning' is an unfinished time period: use the present perfect simple. "
                            "The simple form also says how many things are completed ('three reports').")
        q["revision"] = {"date": DATE, "reason": "'wrote' was also correct if the morning had finished; added context so the period is unfinished.",
                         "sources": [BC_PP, BC_PPC]}
    elif q["id"] == "vta-041":
        for o in q["options"]:
            if o["text"] == "is going to rain":
                o["text"] = "has rained"
        q["explanation"] = "Use 'will' for future predictions based on opinion or belief ('I think it will rain')."
        q["revision"] = {"date": DATE, "reason": "Replaced distractor 'is going to rain', which is also acceptable with 'I think'.",
                         "sources": [BC_FUTURE]}
    elif q["id"] == "vta-049":
        q["explanation"] = ("The plan was decided before speaking (they already signed the lease), so use 'be going to'. "
                            "'Will' is for decisions made at the moment of speaking.")
        q["revision"] = {"date": DATE, "reason": "Clarified why 'will move' is wrong; key confirmed.", "sources": [BC_PLANS]}

# --- Owner-authorized fixes for questions whose key was not unique ------------------
BC_QFORMS = "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2/question-forms"
CAM_MODAL = "https://dictionary.cambridge.org/grammar/british-grammar/modality-forms"
BC_PASTPERF = "https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/past-perfect"
BC_THE = "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/definite-article"
# Longman Dictionary of Contemporary English (LDOCE)
LDOCE_HOSPITAL = "https://www.ldoceonline.com/dictionary/hospital"
LDOCE_INSTEAD = "https://www.ldoceonline.com/dictionary/instead"
LDOCE_TREMBLE = "https://www.ldoceonline.com/dictionary/tremble"
LDOCE_THROUGH = "https://www.ldoceonline.com/dictionary/through"
LDOCE_OFF = "https://www.ldoceonline.com/dictionary/off"
LDOCE_TOWARD = "https://www.ldoceonline.com/dictionary/towards"
LDOCE_REQUIRE = "https://www.ldoceonline.com/dictionary/require"
BC_PASTCONT = "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/past-continuous"
CAM_US_ALREADY = "https://www.cambridge.org/elt/blog/2015/10/12/grammar-beyond-9/"
BC_TIME = "https://learnenglish.britishcouncil.org/free-resources/grammar/a1-a2-grammar/prepositions-of-time-at-in-on"
BC_FREQ = "https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/how-often"
BC_FREQ_TEENS = "https://learnenglishteens.britishcouncil.org/grammar/a1-a2-grammar/adverbs-frequency"

FIXES = {
    "vta-037": dict(options={"already left": "already leave", "were already leaving": "are already leaving"},
        sources=[BC_PASTPERF, BC_PASTCONT, CAM_US_ALREADY],
        reason="'were already leaving' is grammatical (past continuous: leaving was in progress when I called), and American English often uses the past simple with 'already' ('They already left'). Replaced both distractors with forms that are wrong in every variety."),
    "aux-027": dict(options={"Have": "Do", "Were": "Does"}, sources=[BC_PASTPERF],
        reason="'Have they left before noon?' (present perfect) is also grammatical, and 'Were they left' can read as a passive. Replaced both distractors with do-forms, which cannot be followed by 'left'."),
    "aux-032": dict(options={"Does": "Has"}, sources=[CAM_MODAL, BC_QFORMS],
        reason="'Does he help us with this task?' is also grammatical. Replaced distractor 'Does' with 'Has'."),
    "aux-033": dict(options={"Do": "Does"}, sources=[CAM_MODAL, BC_QFORMS],
        reason="'Do we invest in this new business project?' is also grammatical. Replaced distractor 'Do' with 'Does'."),
    "aux-035": dict(options={"Do": "Does"}, sources=[CAM_MODAL, BC_QFORMS],
        reason="'Do employees wear an ID badge at all times?' is also grammatical. Replaced distractor 'Do' with 'Does'."),
    "aux-044": dict(prompt="___ does she study at university? — She studies economics.", sources=[BC_QFORMS],
        reason="'Where' and 'How' also formed grammatical questions. Added the answer so only 'What' fits."),
    "aux-050": dict(prompt="___ called you on the phone?", sources=[BC_QFORMS],
        reason="Removed the non-standard word 'standardly' from the prompt."),
    "art-021": dict(prompt="___ president of the committee opened the meeting.", sources=[BC_THE],
        reason="Zero article is also standard after 'elected' ('He was elected president'). Rewrote the prompt so the unique role is the subject and needs 'the'."),
    "art-047": dict(prompt="(British English) He was admitted to ___ hospital after the accident.", sources=[LDOCE_HOSPITAL],
        reason="Longman lists 'be admitted to hospital' as British English and 'be admitted to the hospital' as American English. Marked the prompt as British English, as the explanation already states."),
    "art-048": dict(prompt="___ coffee that we bought in Colombia last year was excellent.", sources=[BC_THE],
        explanation="Although 'coffee' is uncountable, it is specific here ('the coffee that we bought in Colombia last year'), so it takes 'the'.",
        reason="Zero article was also acceptable for coffee grown in Colombia (a general category). Rewrote the prompt so the coffee is clearly specific."),
    "prep-012": dict(options={"in place of": "in front of"}, sources=[LDOCE_INSTEAD],
        reason="'In place of' can also express substitution ('someone else in my place'), so it competed with 'instead of'. Replaced that distractor with 'in front of'."),
    "prep-027": dict(options={"at": "into"}, sources=[LDOCE_HOSPITAL],
        reason="Longman's example 'Lucy works as a nurse at the local hospital' shows 'at' is also correct. Replaced distractor 'at' with 'into'."),
    "prep-043": dict(options={"from": "at", "down": "during"}, sources=[LDOCE_OFF],
        reason="'An apple fell from the tree branch' is also correct, and 'fell down the tree branch' can be read as movement along it. Replaced both distractors; 'off' (removed from a surface, as in Longman's 'his hat fell off') stays the key."),
    "prep-045": dict(prompt="They were walking ___ the lighthouse, getting closer with every step.",
        options={"into": "of", "onto": "since", "past": "during"}, sources=[LDOCE_TOWARD],
        reason="The key produced 'walking toward the beach toward the lighthouse'. Rewrote the prompt and replaced distractors that would also be grammatical ('into', 'past')."),
    "prep-054": dict(options={"from": "at"}, key="with", sources=[LDOCE_TREMBLE],
        explanation="'With' expresses the cause of a physical reaction to an emotion (trembling with fear, shaking with anger).",
        reason="Longman gives 'tremble with anger/fear' as the pattern, and 'with' was listed as a distractor. Made 'with' the key and replaced 'from' with 'at'."),
    "prep-055": dict(options={"due to": "among", "from": "until", "owing to": "since"}, sources=[LDOCE_THROUGH],
        reason="'Due to', 'owing to' and 'from' also produced grammatical sentences. Replaced them; 'through' (by means of) stays the key."),
    "prep-058": dict(prompt="We usually visit our family ___ Christmas Day.", key="on", sources=[BC_TIME],
        explanation="Use 'on' for a specific day, including holidays with 'Day' ('on Christmas Day'). 'At Christmas' refers to the whole holiday period.",
        reason="'On Christmas' is also correct in American English. Changed the prompt to 'Christmas Day', where 'on' is correct in all varieties."),
    "sva-066": dict(prompt="Every teacher and student _____ to register online.", sources=[LDOCE_REQUIRE],
        reason="The original prompt produced the ungrammatical key sentence 'Every teacher and student has required to register online' (the pattern is 'be required to do something'). Removed 'required' so the key reads 'has to register'."),
    "ss-022": dict(options={"She travels often for work.": "She travels for often work."}, sources=[BC_FREQ, BC_FREQ_TEENS],
        reason="'Often' can also go at the end of a clause, so 'She travels often for work.' is acceptable. Replaced that distractor."),
    "ss-045": dict(options={"She often does not travel.": "She not often does travel."}, sources=[BC_FREQ],
        reason="'She often does not travel.' is grammatical (with a different meaning). Replaced that distractor."),
}

def apply_fix(q):
    fx = FIXES.get(q["id"])
    if not fx:
        return
    if "prompt" in fx:
        q["prompt"] = fx["prompt"]
    for o in q["options"]:
        if o["text"] in fx.get("options", {}):
            o["text"] = fx["options"][o["text"]]
    if "key" in fx:
        q["correctOptionId"] = next(o["id"] for o in q["options"] if o["text"] == fx["key"])
    if "explanation" in fx:
        q["explanation"] = fx["explanation"]
    q["revision"] = {"date": DATE, "reason": fx["reason"], "sources": fx["sources"]}

# --- SVA: expand 2 options to 4 with clearly ungrammatical distractors -----------
ING = {"study": "studying", "analyze": "analyzing", "go": "going", "listen": "listening", "review": "reviewing",
       "create": "creating", "improve": "improving", "visit": "visiting", "know": "knowing", "receive": "receiving",
       "win": "winning", "require": "requiring", "help": "helping", "increase": "increasing", "hang": "hanging",
       "write": "writing"}

def sva_extras(opts, key):
    """Two added distractors that are ungrammatical in the sentence and, where possible,
    test the same agreement point (a progressive form with the wrong number)."""
    s = set(opts)
    if s == {"is", "are"}: return ["am", "be"]
    if s == {"was", "were"}: return ["be", "been"]
    if s == {"has", "have"}: return ["having", "is having" if key == "have" else "are having"]
    if s == {"doesn't", "don't"}: return ["isn't", "not"]
    base = min(opts, key=len)
    wrong_number = "is" if key == base else "are"   # plural key -> singular 'is', and vice versa
    return [ING[base], f"{wrong_number} {ING[base]}"]

# 'The team are winning' is acceptable in British English, so use a form that is wrong in every variety.
SVA_OVERRIDE = {42: ["winning", "have win"]}

# --- RC: expand 2-option items to 4 ---------------------------------------------
NOT_REL = ["Not a relative clause (noun clause)", "Not a relative clause (adverb clause)"]

def fix(a, b): return f"Incorrect: use '{b}' instead of '{a}'"
RC_ERROR = {  # id: (key, [distractors])
    41: (fix("that", "who"), ["Correct", fix("that", "which"), fix("that", "whose")]),
    42: ("Incorrect: remove the commas", ["Correct", fix("that", "who"), fix("that", "whose")]),
    43: (fix("which", "who"), ["Correct", fix("which", "whose"), fix("which", "where")]),
    44: ("Incorrect: add 'who' before 'lives'", ["Correct", "Incorrect: add 'which' before 'lives'", "Incorrect: add 'that' before 'lives'"]),
    45: ("Correct", [fix("who", "which"), fix("who", "whose"), fix("who", "where")]),
    46: ("Correct", [fix("which", "that"), fix("which", "who"), fix("which", "whose")]),
    47: ("Incorrect: remove the comma", ["Correct", fix("that", "who"), fix("that", "whose")]),
    48: ("Correct", [fix("whose", "who"), fix("whose", "which"), fix("whose", "whom")]),
    49: (fix("which", "who"), ["Correct", fix("which", "whose"), fix("which", "where")]),
    50: (fix("that", "which"), ["Correct", fix("that", "who"), fix("that", "whose")]),
    51: ("Correct", [fix("where", "when"), fix("where", "who"), fix("where", "whose")]),
    52: (fix("who's", "whose"), ["Correct", fix("who's", "who"), fix("who's", "which")]),
    53: ("Correct", [fix("whose", "who's"), fix("whose", "which"), fix("whose", "that")]),
    54: (fix("when", "where"), ["Correct", fix("when", "who"), fix("when", "whose")]),
    55: ("Correct", [fix("that", "who"), fix("that", "where"), fix("that", "whose")]),
}
Y_OBJ = "Yes, it can be omitted: it is the object of the clause."
N_SUBJ = "No, it cannot be omitted: it is the subject of the clause."
N_NONDEF = "No, it cannot be omitted: it is in a non-defining clause."
Y_ALWAYS = "Yes, it can be omitted: relative pronouns can always be omitted."
def n_never(p): return f"No, it cannot be omitted: '{p}' can never be omitted."
RC_OMIT = {
    56: (Y_OBJ, [N_SUBJ, N_NONDEF, n_never("that")]),
    57: (N_SUBJ, [Y_OBJ, Y_ALWAYS, N_NONDEF]),
    58: (N_NONDEF, [Y_OBJ, Y_ALWAYS, "Yes, it can be omitted: non-defining clauses do not need a pronoun."]),
    59: (Y_OBJ, [N_SUBJ, N_NONDEF, n_never("that")]),
    60: (N_SUBJ, [Y_OBJ, Y_ALWAYS, N_NONDEF]),
    61: (Y_OBJ, [N_SUBJ, N_NONDEF, n_never("whom")]),
    62: (N_NONDEF, [Y_OBJ, Y_ALWAYS, "Yes, it can be omitted: non-defining clauses do not need a pronoun."]),
    63: (N_SUBJ, [Y_OBJ, Y_ALWAYS, N_NONDEF]),
    64: (Y_OBJ, [N_SUBJ, N_NONDEF, n_never("which")]),
    65: ("No, it cannot be omitted: 'whose' shows possession.", [Y_OBJ, Y_ALWAYS, "Yes, it can be omitted: it is in a defining clause."]),
}
RC_TOPIC = {"fill_in_the_blank": "Fill in the blank", "identify_clause_type": "Clause type",
            "error_identification": "Error identification", "pronoun_omission": "Pronoun omission",
            "sentence_combination": "Sentence combination"}

EXPANDED_NOTE = "Options expanded from 2 to 4 with owner authorization; added options are marked \"added\"."

def build(texts_and_flags, key_text, qid):
    """texts_and_flags: list of (text, added). Returns options (seeded order) and correct id."""
    items = list(texts_and_flags)
    random.Random(qid).shuffle(items)
    options, correct = [], None
    for i, (text, added) in enumerate(items):
        o = {"id": "abcd"[i], "text": text}
        if added: o["added"] = True
        options.append(o)
        if text == key_text: correct = o["id"]
    return options, correct

def convert(bank_id, title, prefix, src, pkey, akey):
    raw = json.load(open(SRC + src, encoding="utf-8"))
    legacy = raw if isinstance(raw, list) else raw["questions"]
    questions = []
    for lq in legacy:
        qid = f"{prefix}-{lq['id']:03d}"
        opts, ans = lq["options"], lq[akey]
        if re.fullmatch(r"[A-D]", ans):  # letter answers (quantifiers): options are "A) ..."
            matches = [i for i, t in enumerate(opts) if t.startswith(ans + ") ")]
        else:
            matches = [i for i, t in enumerate(opts) if t == ans]
        assert len(matches) == 1, qid
        key_text = opts[matches[0]]

        q = {"id": qid}
        topic = lq.get("category") or RC_TOPIC.get(lq.get("type"))
        if topic: q["topic"] = topic
        q["prompt"] = lq[pkey]

        revision = None
        if len(opts) == 2 and prefix == "sva":
            texts = [(t, False) for t in opts] + [(t, True) for t in (SVA_OVERRIDE.get(lq["id"]) or sva_extras(opts, key_text))]
            revision = EXPANDED_NOTE
        elif len(opts) == 2 and prefix == "rc":
            n = lq["id"]
            if n in RC_ERROR or n in RC_OMIT:
                key_text, others = (RC_ERROR.get(n) or RC_OMIT[n])
                texts = [(key_text, key_text != "Correct")] + [(t, t != "Correct") for t in others]
            else:  # clause type
                texts = [(t, False) for t in opts] + [(t, True) for t in NOT_REL]
            revision = EXPANDED_NOTE + " Original options: " + " / ".join(opts) + "."
        else:
            texts = None

        if texts:
            q["options"], q["correctOptionId"] = build(texts, key_text, qid)
        else:
            # Quantifiers options carry their own "A) " labels; the app already shows A-D, so drop the prefix.
            q["options"] = [{"id": "abcd"[i], "text": re.sub(r"^[A-D]\) ", "", t)} for i, t in enumerate(opts)]
            q["correctOptionId"] = "abcd"[matches[0]]
        q["explanation"] = lq["explanation"]
        if revision:
            q["revision"] = {"date": DATE, "reason": revision}
        if prefix == "vta":
            fix_vta(q)
        apply_fix(q)
        assert "revision" in q or q["id"] not in FIXES, q["id"]
        questions.append(q)

    bank = {"id": bank_id, "title": title, "status": "active", "source": "content-source/" + src, "questions": questions}
    with open(OUT + bank_id + ".json", "w", encoding="utf-8", newline="\n") as f:
        json.dump(bank, f, ensure_ascii=False, indent=2)
        f.write("\n")
    revised = sum(1 for q in questions if "revision" in q)
    print(f"{bank_id}: {len(questions)} questions, {revised} revised")

for b in BANKS:
    convert(*b)
