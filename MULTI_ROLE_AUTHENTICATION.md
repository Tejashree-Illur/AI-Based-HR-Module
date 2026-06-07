# Multi-Role Authentication Implementation

## Overview
Implemented a 4-tier role-based access control (RBAC) system for the HRMS application with Management Admin, Senior Manager, HR Recruiter, and Employee roles.

---

## 🔧 Changes Made

### 1. **Backend - `backend/server.js`**

#### Register Endpoint (Line ~74)
- **Change:** Added `role` parameter to registration request
- **Storage:** Role stored in MongoDB user document with default value "Employee"
```javascript
const { name, email, password, role } = req.body;
// ...
const result = await db.collection("users").insertOne({
  name,
  email,
  password,
  role: role || "Employee",
  createdAt: new Date(),
});
```

#### Login Endpoint (No changes needed)
- Already returns full user object including the new `role` field

---

### 2. **Frontend - `frontend/src/components/LoginForm.jsx`**

#### Changes:
- Added `role` and `onRoleChange` props
- Added role dropdown during registration (only visible when `isRegister === true`)

```javascript
{isRegister && (
  <select
    value={role}
    onChange={onRoleChange}
    style={{
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      fontSize: "14px",
    }}
  >
    <option value="">Select Role</option>
    <option value="Management Admin">Management Admin</option>
    <option value="Senior Manager">Senior Manager</option>
    <option value="HR Recruiter">HR Recruiter</option>
    <option value="Employee">Employee</option>
  </select>
)}
```

---

### 3. **Frontend - `frontend/src/App.jsx`**

#### State Management:
- Added `role` state: `const [role, setRole] = useState("");`

#### Register Function:
- Updated `registerUser()` to include role in the request body
- Reset role on successful registration

#### LoginForm Props:
- Pass `role`, `onRoleChange`, and role state to LoginForm component

#### Dashboard Header:
- Added user info display showing name and role:
```javascript
<div style={{ marginTop: "15px", fontSize: "16px", opacity: 0.9 }}>
  <span>Welcome, <strong>{user.name}</strong></span>
  <span style={{ marginLeft: "15px" }}>👤 Role: <strong>{user.role}</strong></span>
</div>
```

#### Role-Based Section Visibility:

| Section | Visible To |
|---------|-----------|
| Dashboard Stats | Management Admin, Senior Manager |
| Add Candidate | Management Admin, HR Recruiter |
| HR Assistant | Management Admin, Senior Manager, HR Recruiter |
| Interview Questions | Management Admin, HR Recruiter |
| Resume Screening | Management Admin, HR Recruiter |
| Schedule Interview | Management Admin, HR Recruiter |
| Export CSV Button | Management Admin, Senior Manager |
| Candidate List | All Roles (with role-based actions) |
| Interview Schedule | All Roles (with role-based actions) |

---

### 4. **Frontend - `frontend/src/components/CandidateCard.jsx`**

#### Props:
- Added `userRole` prop

#### Button Visibility Rules:
- **Score Button**: Management Admin, HR Recruiter only
- **Shortlist/Reject Buttons**: Management Admin, Senior Manager, HR Recruiter only
- **Delete Button**: Management Admin only
- **View Resume**: All roles

```javascript
{(userRole === "Management Admin" || userRole === "HR Recruiter") && (
  <button onClick={() => onScoreCandidate(...)} ...>
    🔵 Score
  </button>
)}

{(userRole === "Management Admin" || userRole === "Senior Manager" || userRole === "HR Recruiter") && (
  <>
    <button onClick={() => onUpdateStatus(..., "Shortlisted")} ...>
      🟢 Shortlist
    </button>
    <button onClick={() => onUpdateStatus(..., "Rejected")} ...>
      🔴 Reject
    </button>
  </>
)}

{userRole === "Management Admin" && (
  <button onClick={() => onDeleteCandidate(...)} ...>
    ⚪ Delete
  </button>
)}
```

---

### 5. **Frontend - `frontend/src/components/CandidateList.jsx`**

#### Changes:
- Added `userRole` prop to component signature
- Pass `userRole` to CandidateCard component

---

### 6. **Frontend - `frontend/src/components/InterviewList.jsx`**

#### Props:
- Added `userRole` prop

#### Button Visibility Rules:
- **Delete Button**: Management Admin, HR Recruiter only
- **Complete Button**: Management Admin, Senior Manager, HR Recruiter only

---

## 📊 Role Permissions Summary

### Management Admin
✅ Full Access
- Dashboard Analytics
- Add/Delete Candidates
- Resume Screening
- Schedule/Delete Interviews
- Export CSV
- HR Assistant
- Interview Questions Generator

### Senior Manager
✅ View & Report
- Dashboard Analytics
- View Candidates (no delete)
- View Interviews (can mark complete)
- Export CSV
- HR Assistant

### HR Recruiter
✅ Operational Tasks
- Add Candidates
- Resume Screening
- Update Candidate Status
- Schedule Interviews
- Interview Questions Generator
- Cannot Delete Candidates
- Cannot Export CSV

### Employee
✅ View Only
- View Candidate List
- View Interview Schedule
- No add/delete/export capabilities

---

## 🧪 Testing Steps

1. **Register New User**
   - Select different roles from dropdown during registration
   - Verify role is stored in MongoDB

2. **Login & Verify Role Display**
   - Login with different roles
   - Confirm "Welcome, {name}" and "Role: {role}" appear in header

3. **Role-Based Feature Access**
   - Test each role to ensure only permitted sections/buttons are visible
   - Employee: Should only see Candidate List & Interview Schedule (no buttons)
   - HR Recruiter: Should see all except Dashboard Stats and Export
   - Senior Manager: Should see Dashboard but no Add/Delete options
   - Management Admin: Should see everything

---

## 📝 Database Schema Update

Users collection now includes:
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  role: String, // "Management Admin" | "Senior Manager" | "HR Recruiter" | "Employee"
  createdAt: Date
}
```

---

## ✅ Files Modified

- ✅ `backend/server.js` - Register endpoint
- ✅ `frontend/src/App.jsx` - State, permissions, UI rendering
- ✅ `frontend/src/components/LoginForm.jsx` - Role dropdown
- ✅ `frontend/src/components/CandidateCard.jsx` - Button visibility
- ✅ `frontend/src/components/CandidateList.jsx` - Pass role prop
- ✅ `frontend/src/components/InterviewList.jsx` - Button visibility

**No changes needed for:** Other components like DashboardStats, AddCandidateForm, etc. (they work with conditional rendering in App.jsx)

