
# ✅ Learner Flow: Taking an Assessment

## 🔐 Precondition
- ✅ Learner is authenticated with a valid **Bearer Token**
- ✅ Multi-tenant context is passed using `X-Tenant-ID` header

---

## 1️⃣ Check User’s Test Status
**📌 Purpose:** Determine if the learner should **resume**, **reattempt**, or is **restricted** based on previous attempts.

**🛣️ Endpoint:** `GET /assessment/v1/tests/{testId}/users/{userId}/status`

**📤 Input:** `testId`, `userId`, `X-Tenant-ID`

**📥 Output:**
```json
{
  "result": {
    "canResume": true,
    "canReattempt": false,
    "lastAttemptStatus": "in-progress",
    "lastAttemptId": "attempt_abc123"
  }
}
```

**🧠 Decision:**

| Condition            | Action                       |
|----------------------|------------------------------|
| `canResume = true`   | Proceed to **Step 2** (Resume) |
| `canReattempt = true`| Proceed to **Step 3** (Start New) |
| Else                 | Show message: **“Max attempts reached”** |

---

## 2️⃣ Resume Existing Attempt
**📌 Purpose:** Load the existing in-progress attempt and recover previous answers, state, and time.

**🛣️ Endpoint:** `GET /assessment/v1/attempts/{attemptId}`

---

## 3️⃣ Start New Attempt
**📌 Purpose:** Initialize a new test attempt for the learner.

**🛣️ Endpoint:** `POST /assessment/v1/attempts`

**📤 Input:**
```json
{ "testId": "test_123" }
```

**📥 Output:**
```json
{ "result": { "attemptId": "attempt_xyz123","testId": "test_123",
    "resolvedTestId": "test_123",
    "currentPosition": 5,
    "timeSpent": 300 } }
```

---

## 4️⃣ Fetch Test Content (Sections + Questions)
**📌 Purpose:** Get full structured content of the test.

**🛣️ Endpoint:** `GET /assessment/v1/tests/{testId}/hierarchy`

---

## 5️⃣ Save or Autosave Answers
**📌 Purpose:** Persist learner’s responses.

**🛣️ Endpoint:** `POST /assessment/v1/attempts/{attemptId}/answers`

**📤 Example:**
```json
{ "questionId": "q1", "answer": ["opt_2"] }
```

---

## 6️⃣ Periodic Tracking or Resume
**📌 Purpose:** Show ongoing progress and allow resume.

**🛣️ Endpoint:** `GET /assessment/v1/attempts/{attemptId}`

---

## 7️⃣ Submit the Test
**📌 Purpose:** Finalize the attempt and trigger grading.

**🛣️ Endpoint:** `POST /assessment/v1/attempts/{attemptId}/submit`

**📥 Output:**
```json
{
  "result": {
    "status": "submitted",
    "score": 8,
    "result": "P"
  }
}
```

---

## 8️⃣ View Results (If Configured)
**📌 Purpose:** Display result/answersheet based on permission.

**🛣️ Endpoint:** `GET /assessment/v1/attempts/{attemptId}?view=answersheet`

---


![Assessment](https://github.com/user-attachments/assets/cbded5ba-3352-4362-b5fa-6c3b2b0d54d1)


## 💡 Additional Notes

| Concern                   | Recommendation / Handling                             |
|---------------------------|--------------------------------------------------------|
| Shuffle questions/answers | Done during `/hierarchy` generation or attempt setup  |
| Resume support            | Driven by `canResume` flag in `/status` API           |
| Autosave                  | Periodically call `POST /answers`                     |
| Auto-submit               | Trigger `POST /submit` on timeout (client/server side)|
| Attempt restriction       | Controlled by `testUserStatus` table                  |
| Result visibility         | Based on test config (`showCorrectAnswers`, etc.)     |
docs/db-design.md
