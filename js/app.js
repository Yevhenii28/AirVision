// REGISTER VALIDATION
function validateRegister() {
  let name = document.getElementById("name").value;
  let surname = document.getElementById("surname").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  if (!name || !surname || !email || !password) {
    alert("All fields are required!");
    return false;
  }

  if (!email.includes("@")) {
    alert("Invalid email!");
    return false;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters");
    return false;
  }

  alert("Registration successful!");
  return false;
}

// LOGIN VALIDATION
function validateLogin() {
  let email = document.getElementById("loginEmail").value;
  let password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Fill all fields!");
    return false;
  }

  alert("Login successful!");
  return false;
}

// DASHBOARD FAKE DATA
function randomizeAQI() {
  let value = Math.floor(Math.random() * 150);
  document.getElementById("aqi").innerText = value;
}