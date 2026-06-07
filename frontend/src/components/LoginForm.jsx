function LoginForm({
  email,
  password,
  name,
  role,
  isRegister,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onRoleChange,
  onToggleRegister,
  onSubmit,
}) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f3f4f6",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        <h1>SmartRecruit AI</h1>
        {isRegister && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={onNameChange}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
            }}
          />
        )}
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
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={onEmailChange}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={onPasswordChange}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
          }}
        />
        <button onClick={onSubmit}>
          {isRegister ? "Register" : "Login"}
        </button>
        <div
          style={{
            marginTop: "15px",
          }}
        >
          <p>
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}
          </p>
          <button onClick={onToggleRegister}>
            {isRegister ? "Go to Login" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
